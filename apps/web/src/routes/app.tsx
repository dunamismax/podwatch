import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardView } from "@/components/dashboard-view";
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
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(dashboardQueryOptions()),
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
