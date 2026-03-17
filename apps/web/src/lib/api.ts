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

const parsePayload = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      "The server returned an unreadable response.",
      response.status,
    );
  }
};

const getApiErrorMessage = (payload: unknown) =>
  typeof payload === "object" &&
  payload !== null &&
  "error" in payload &&
  typeof payload.error === "string"
    ? payload.error
    : "The request failed.";

const apiFetch = async <T>({
  path,
  schema,
  method = "GET",
  body,
  parseErrorResponse = false,
}: {
  path: string;
  schema: {
    parse: (value: unknown) => T;
  };
  method?: "GET" | "POST";
  body?: unknown;
  parseErrorResponse?: boolean;
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
  const payload = await parsePayload(response);

  if (!response.ok && !parseErrorResponse) {
    throw new ApiError(getApiErrorMessage(payload), response.status);
  }

  try {
    return schema.parse(payload);
  } catch (error) {
    if (!response.ok) {
      throw new ApiError(getApiErrorMessage(payload), response.status);
    }

    throw error;
  }
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
    parseErrorResponse: true,
  });

export const createEvent = (input: CreateEventInput) =>
  apiFetch({
    path: "/api/events",
    method: "POST",
    body: input,
    schema: CreateEventResultSchema,
    parseErrorResponse: true,
  });

export const getApiUrl = () => API_URL;
