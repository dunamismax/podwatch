import { type Viewer, ViewerSchema } from "@podwatch/domain";
import type { Context } from "hono";

import { auth } from "@/lib/auth";

export const getViewer = async (context: Context): Promise<Viewer | null> => {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });

  if (!session?.user) {
    return null;
  }

  return ViewerSchema.parse({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  });
};

export const requireViewer = async (context: Context): Promise<Viewer> => {
  const viewer = await getViewer(context);

  if (!viewer) {
    throw new Error("Unauthorized");
  }

  return viewer;
};
