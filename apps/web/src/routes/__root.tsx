import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

import "@/styles.css";

type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-[2rem] border border-border/70 bg-card/90 p-10 shadow-[0_32px_90px_rgba(35,27,15,0.12)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
          Lost In The Stack
        </p>
        <h1 className="mt-4 font-serif text-4xl text-foreground">
          That route does not exist anymore.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          PodWatch was rewritten as a Vite SPA, so the page you tried to open is
          not part of the current route map.
        </p>
      </div>
    </main>
  );
}
