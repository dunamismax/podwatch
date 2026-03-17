import {
  type CreateEventInput,
  CreateEventResultSchema,
  type CreatePodInput,
  CreatePodResultSchema,
  DashboardSnapshotSchema,
  ViewerSchema,
} from "@podwatch/domain";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const apiFetch = async <T>({
  path,
  schema,
  method = "GET",
  body,
}: {
  path: string;
  schema: {
    parse: (value: unknown) => T;
  };
  method?: "GET" | "POST";
  body?: unknown;
}) => {
  const requestInit: RequestInit = {
    method,
    credentials: "include",
  };

  if (body) {
    requestInit.headers = {
      "Content-Type": "application/json",
    };
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, requestInit);
  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "The request failed.";

    throw new ApiError(message, response.status);
  }

  return schema.parse(payload);
};

export const fetchViewer = async () => {
  try {
    return await apiFetch({
      path: "/api/viewer",
      schema: ViewerSchema.nullable(),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    return null;
  }
};

export const fetchDashboard = () =>
  apiFetch({
    path: "/api/dashboard",
    schema: DashboardSnapshotSchema,
  });

export const createPod = (input: CreatePodInput) =>
  apiFetch({
    path: "/api/pods",
    method: "POST",
    body: input,
    schema: CreatePodResultSchema,
  });

export const createEvent = (input: CreateEventInput) =>
  apiFetch({
    path: "/api/events",
    method: "POST",
    body: input,
    schema: CreateEventResultSchema,
  });

export const getApiUrl = () => API_URL;
