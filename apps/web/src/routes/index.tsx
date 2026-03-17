import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Orbit, Radar, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { viewerQueryOptions } from "@/lib/query";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const viewer = await context.queryClient.ensureQueryData(
      viewerQueryOptions(),
    );

    if (viewer) {
      throw redirect({ to: "/app" });
    }
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_42%),radial-gradient(circle_at_18%_18%,rgba(217,119,6,0.18),transparent_28%),linear-gradient(180deg,transparent,rgba(255,248,235,0.88))]" />
      <section className="mx-auto grid min-h-screen w-full max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
        <div className="space-y-8">
          <div className="space-y-5">
            <Badge className="rounded-full px-4 py-1.5 text-[0.72rem] uppercase tracking-[0.26em]">
              Modern Full-Stack Rewrite
            </Badge>
            <h1 className="max-w-3xl font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
              A focused planning board for recurring groups, rebuilt on a Vite
              SPA and Hono API.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              PodWatch now runs on React, TanStack Router, TanStack Query,
              TanStack Form, Hono, Prisma, Better Auth, and PostgreSQL. The app
              stays narrow on purpose: create pods, schedule events, and keep
              the next meeting obvious.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link to="/login">
                Open the workspace
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-border/70 bg-background/70 px-6 backdrop-blur"
            >
              <a href="#stack">See the architecture</a>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Frontend" value="SPA + Router" />
            <Metric label="Backend" value="Hono + Prisma" />
            <Metric label="Auth" value="Better Auth" />
          </div>
        </div>

        <Card className="relative overflow-hidden border-border/70 bg-card/85 shadow-[0_30px_90px_rgba(22,18,12,0.12)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(217,119,6,0.12),transparent_40%)]" />
          <CardHeader className="relative space-y-4 pb-6">
            <Badge
              variant="secondary"
              className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.22em] text-primary"
            >
              Product Frame
            </Badge>
            <CardTitle className="font-serif text-3xl tracking-[-0.03em]">
              Private scheduling for small, repeatable groups
            </CardTitle>
            <CardDescription className="max-w-xl text-base leading-7 text-muted-foreground">
              Each user gets an authenticated workspace with named pods, an
              upcoming timeline, and event forms validated on both sides of the
              API boundary.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <FeatureRow
              icon={ShieldCheck}
              title="Protected dashboard"
              copy="Sessions stay server-backed with Better Auth and Postgres."
            />
            <FeatureRow
              icon={Radar}
              title="Shared contracts"
              copy="Zod schemas shape payloads across the frontend, domain layer, and Hono routes."
            />
            <FeatureRow
              icon={Orbit}
              title="Lean workflow"
              copy="The app keeps pods, events, and the recent timeline in a single calm workflow."
            />
          </CardContent>
        </Card>
      </section>

      <section
        id="stack"
        className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-16 lg:grid-cols-3"
      >
        <StackCard
          title="SPA surface"
          copy="Vite serves the React app, TanStack Router handles navigation, Query manages server state, and Form keeps input logic typed."
        />
        <StackCard
          title="Clean API edge"
          copy="Hono owns the HTTP boundary while Prisma maps Postgres data into the domain repository used by the workflows."
        />
        <StackCard
          title="Design system"
          copy="shadcn/ui components and Radix primitives provide the base interactions, then the visual language gets customized on top."
        />
      </section>
    </main>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-[1.6rem] border border-border/70 bg-background/70 px-4 py-5 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
        {props.label}
      </p>
      <p className="mt-3 font-serif text-2xl tracking-[-0.03em] text-foreground">
        {props.value}
      </p>
    </div>
  );
}

function FeatureRow(props: {
  icon: typeof Orbit;
  title: string;
  copy: string;
}) {
  const Icon = props.icon;

  return (
    <div className="flex gap-4 rounded-[1.4rem] border border-border/60 bg-background/70 p-4 backdrop-blur">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{props.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {props.copy}
        </p>
      </div>
    </div>
  );
}

function StackCard(props: { title: string; copy: string }) {
  return (
    <Card className="border-border/70 bg-card/85 shadow-[0_22px_70px_rgba(22,18,12,0.08)] backdrop-blur">
      <CardHeader>
        <CardTitle className="font-serif text-2xl tracking-[-0.03em]">
          {props.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-7 text-muted-foreground">{props.copy}</p>
      </CardContent>
    </Card>
  );
}
