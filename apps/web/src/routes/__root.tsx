import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import "@/styles.css";

type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootDocument,
  errorComponent: RootError,
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

function RootError(props: { error: Error; reset: () => void }) {
  const isApiError = props.error instanceof ApiError;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-16">
      <Card className="w-full max-w-2xl border-border/70 bg-card/90 shadow-[0_32px_90px_rgba(35,27,15,0.12)] backdrop-blur">
        <CardHeader className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <CardTitle className="font-serif text-4xl tracking-[-0.03em]">
            {isApiError
              ? "PodWatch hit an API problem."
              : "PodWatch hit an unexpected error."}
          </CardTitle>
          <p className="text-base leading-7 text-muted-foreground">
            {isApiError
              ? `The app could not complete a request (${props.error.message}).`
              : "Reload the route or head back home. If this keeps happening, check the API and database services."}
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            className="rounded-full"
            onClick={() => {
              props.reset();
            }}
          >
            Try again
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/">Back home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
