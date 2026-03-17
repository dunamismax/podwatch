import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  createEvent,
  createPod,
  fetchDashboard,
  fetchViewer,
} from "./api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("mutation API helpers", () => {
  it("returns typed validation and conflict payloads from non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            error: "A pod with this name already exists.",
          }),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );

    await expect(
      createPod({
        name: "Friday Pod",
        description: "",
      }),
    ).resolves.toEqual({
      ok: false,
      error: "A pod with this name already exists.",
    });
  });

  it("parses successful event payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            message: "Event scheduled.",
            data: {
              id: "event_1",
              podId: "pod_1",
              podName: "Friday Pod",
              title: "Commander Night",
              description: "",
              location: "Library",
              scheduledFor: "2026-07-11T02:00:00.000Z",
              scheduledTimezone: "America/Phoenix",
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );

    await expect(
      createEvent({
        podId: "pod_1",
        title: "Commander Night",
        description: "",
        location: "Library",
        scheduledFor: "2026-07-10T19:00",
        timezone: "America/Phoenix",
      }),
    ).resolves.toMatchObject({
      ok: true,
      message: "Event scheduled.",
    });
  });
});

describe("query API helpers", () => {
  it("throws ApiError for protected query failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "Sign in to view the dashboard.",
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      ),
    );

    await expect(fetchDashboard()).rejects.toEqual(
      new ApiError("Sign in to view the dashboard.", 401),
    );
  });

  it("surfaces unexpected viewer fetch failures instead of treating them as signed out", async () => {
    const networkError = new TypeError("fetch failed");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError));

    await expect(fetchViewer()).rejects.toBe(networkError);
  });
});
