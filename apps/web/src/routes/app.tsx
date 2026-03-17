import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardView } from "@/components/dashboard-view";
import { ApiError } from "@/lib/api";
import { dashboardQueryOptions, viewerQueryOptions } from "@/lib/query";
import { useBrowserTimeZone } from "@/lib/timezone";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ context }) => {
    const viewer = await context.queryClient.ensureQueryData(
      viewerQueryOptions(),
    );

    if (!viewer) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async ({ context }) => {
    try {
      return await context.queryClient.ensureQueryData(dashboardQueryOptions());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        context.queryClient.setQueryData(["viewer"], null);
        throw redirect({ to: "/login" });
      }

      throw error;
    }
  },
  component: AppPage,
});

function AppPage() {
  const timezone = useBrowserTimeZone();
  const viewerQuery = useSuspenseQuery(viewerQueryOptions());
  const dashboardQuery = useSuspenseQuery(dashboardQueryOptions());

  if (!viewerQuery.data) {
    throw redirect({ to: "/login" });
  }

  return (
    <DashboardView
      viewer={viewerQuery.data}
      snapshot={dashboardQuery.data}
      timezone={timezone}
    />
  );
}
