import { serve } from "@hono/node-server";
import {
  CreateEventInputSchema,
  CreateEventResultSchema,
  CreatePodInputSchema,
  CreatePodResultSchema,
  createEventWorkflow,
  createPodWorkflow,
  DashboardSnapshotSchema,
  formatPodwatchError,
  loadDashboardWorkflow,
  type MutationError,
  ViewerSchema,
} from "@podwatch/domain";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";

import { env } from "@/env";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getViewer, requireViewer } from "@/lib/session";
import { createPodwatchRepository } from "@/repositories/podwatch-repository";

type ErrorResponse = {
  error: string;
};

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/health", (context) =>
  context.json({
    ok: true,
  }),
);

app.on(["GET", "POST"], "/api/auth/*", (context) =>
  auth.handler(context.req.raw),
);

app.get("/api/viewer", async (context) => {
  const viewer = await getViewer(context);

  return context.json(ViewerSchema.nullable().parse(viewer));
});

app.get("/api/dashboard", async (context) => {
  try {
    const viewer = await requireViewer(context);
    const repository = createPodwatchRepository(prisma);
    const snapshot = await loadDashboardWorkflow(repository, viewer.id);

    return context.json(DashboardSnapshotSchema.parse(snapshot));
  } catch (error) {
    const formatted = formatPodwatchError(error);
    const status =
      error instanceof Error && error.message === "Unauthorized" ? 401 : 500;

    return context.json(
      {
        error:
          status === 401 ? "Sign in to view the dashboard." : formatted.message,
      } satisfies ErrorResponse,
      status,
    );
  }
});

app.post("/api/pods", async (context) => {
  try {
    const viewer = await requireViewer(context);
    const input = CreatePodInputSchema.parse(
      await context.req.json().catch(() => undefined),
    );
    const repository = createPodwatchRepository(prisma);
    const result = await createPodWorkflow(repository, viewer.id, input).then(
      (data) => ({
        ok: true as const,
        message: "Pod created.",
        data,
      }),
    );

    return context.json(CreatePodResultSchema.parse(result));
  } catch (error) {
    return respondWithError(context, error, "Sign in to create pods.");
  }
});

app.post("/api/events", async (context) => {
  try {
    const viewer = await requireViewer(context);
    const input = CreateEventInputSchema.parse(
      await context.req.json().catch(() => undefined),
    );
    const repository = createPodwatchRepository(prisma);
    const result = await createEventWorkflow(repository, viewer.id, input).then(
      (data) => ({
        ok: true as const,
        message: "Event scheduled.",
        data,
      }),
    );

    return context.json(CreateEventResultSchema.parse(result));
  } catch (error) {
    return respondWithError(context, error, "Sign in to schedule events.");
  }
});

export type AppType = typeof app;

export const startServer = () =>
  serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      // Keep startup logging terse for local dev and self-hosted deployments.
      console.log(`PodWatch API listening on http://localhost:${info.port}`);
    },
  );

const respondWithError = (
  context: Context,
  error: unknown,
  unauthorizedMessage: string,
) => {
  if (error instanceof Error && error.message === "Unauthorized") {
    return context.json(
      {
        ok: false,
        error: unauthorizedMessage,
      } satisfies MutationError,
      401,
    );
  }

  const formatted = formatPodwatchError(error);

  return context.json(
    {
      ok: false,
      error: formatted.message,
    } satisfies MutationError,
    statusForTag(formatted._tag),
  );
};

const statusForTag = (tag: ReturnType<typeof formatPodwatchError>["_tag"]) => {
  switch (tag) {
    case "ConflictError":
      return 409;
    case "NotFoundError":
      return 404;
    case "ValidationError":
      return 400;
    case "InfrastructureError":
      return 500;
  }
};

export default app;
