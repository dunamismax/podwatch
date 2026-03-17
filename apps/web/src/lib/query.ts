import { QueryClient, queryOptions } from "@tanstack/react-query";

import { fetchDashboard, fetchViewer } from "./api";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
    },
  });

export const viewerQueryOptions = () =>
  queryOptions({
    queryKey: ["viewer"],
    queryFn: fetchViewer,
  });

export const dashboardQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
