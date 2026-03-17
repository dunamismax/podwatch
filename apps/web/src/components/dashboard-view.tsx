import type {
  CreateEventResult,
  CreatePodResult,
  DashboardSnapshot,
  Viewer,
} from "@podwatch/domain";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarFold,
  LoaderCircle,
  LogOut,
  Orbit,
  Plus,
  Sparkles,
} from "lucide-react";
import { type ReactNode, startTransition, useEffect, useState } from "react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createEvent, createPod } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { formatInTimeZone } from "@/lib/timezone";

type DashboardViewProps = {
  viewer: Viewer;
  snapshot: DashboardSnapshot;
  timezone: string;
};

export function DashboardView(props: DashboardViewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [podResult, setPodResult] = useState<CreatePodResult | null>(null);
  const [eventResult, setEventResult] = useState<CreateEventResult | null>(
    null,
  );

  const podMutation = useMutation({
    mutationFn: createPod,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const eventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const podForm = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      const result = await podMutation.mutateAsync(value);
      setPodResult(result);

      if (result.ok) {
        startTransition(() => {
          podForm.reset();
        });
      }
    },
  });

  const eventForm = useForm({
    defaultValues: {
      podId: props.snapshot.pods[0]?.id ?? "",
      title: "",
      location: "",
      scheduledFor: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      const result = await eventMutation.mutateAsync({
        ...value,
        timezone: props.timezone,
      });
      setEventResult(result);

      if (result.ok) {
        startTransition(() => {
          eventForm.reset();
          eventForm.setFieldValue("podId", props.snapshot.pods[0]?.id ?? "");
        });
      }
    },
  });

  useEffect(() => {
    const currentPodId = eventForm.getFieldValue("podId");

    if (!currentPodId && props.snapshot.pods[0]?.id) {
      eventForm.setFieldValue("podId", props.snapshot.pods[0].id);
    }
  }, [eventForm, props.snapshot.pods]);

  const signOut = async () => {
    await authClient.signOut();
    queryClient.setQueryData(["viewer"], null);
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    await navigate({ to: "/" });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:py-10">
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_30px_90px_rgba(22,18,12,0.1)] backdrop-blur">
          <CardHeader className="space-y-5 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-4">
                <Badge className="rounded-full px-4 py-1.5 text-[0.7rem] uppercase tracking-[0.24em]">
                  Pod Scheduling Board
                </Badge>
                <div className="space-y-3">
                  <CardTitle className="font-serif text-5xl tracking-[-0.04em]">
                    PodWatch
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-base leading-7">
                    Build small recurring groups, set concrete dates, and keep
                    the timeline calm enough that the next move stays obvious.
                  </CardDescription>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-border/70 bg-background/75 px-4 py-3 backdrop-blur">
                <p className="text-sm font-semibold text-foreground">
                  {props.viewer.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {props.viewer.email}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Pods tracked"
                value={props.snapshot.summary.podCount}
              />
              <StatCard
                label="Total events"
                value={props.snapshot.summary.eventCount}
              />
              <StatCard
                label="Upcoming"
                value={props.snapshot.summary.upcomingCount}
              />
              <StatCard
                label="Timezone"
                value={props.timezone}
                suppressHydrationWarning
              />
            </div>
          </CardHeader>
        </Card>

        <Card className="border-border/70 bg-card/85 shadow-[0_22px_70px_rgba(22,18,12,0.08)] backdrop-blur">
          <CardHeader className="pb-4">
            <Badge
              variant="secondary"
              className="w-fit rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-primary"
            >
              Session
            </Badge>
            <CardTitle className="font-serif text-3xl tracking-[-0.03em]">
              Protected dashboard
            </CardTitle>
            <CardDescription>
              The SPA reads this board through TanStack Query while the Hono API
              enforces Better Auth sessions on every protected endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.4rem] border border-border/60 bg-background/70 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-primary/10 p-2 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Event times are submitted in the browser timezone, normalized
                  to UTC by the shared workflow, and rendered back into the
                  local timeline for readability.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-2xl"
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="font-serif text-3xl tracking-[-0.03em]">
                Create a pod
              </CardTitle>
              <CardDescription>
                Keep the object tight. A pod is just the recurring group you
                schedule against.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResultBanner result={podResult} />
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void podForm.handleSubmit();
                }}
              >
                <podForm.Field
                  name="name"
                  validators={{
                    onChange: z
                      .string()
                      .trim()
                      .min(2, "Pod name must be at least 2 characters."),
                  }}
                >
                  {(field) => (
                    <Field
                      id={field.name}
                      label="Name"
                      error={getErrorMessage(field.state.meta.errors[0])}
                    >
                      <Input
                        id={field.name}
                        placeholder="Friday Pod"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                    </Field>
                  )}
                </podForm.Field>

                <podForm.Field name="description">
                  {(field) => (
                    <Field id={field.name} label="Description">
                      <Textarea
                        id={field.name}
                        placeholder="Small recurring group with a standing purpose."
                        rows={4}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                    </Field>
                  )}
                </podForm.Field>

                <podForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      className="w-full rounded-2xl"
                      size="lg"
                      disabled={!canSubmit || isSubmitting}
                    >
                      {isSubmitting ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                      Create pod
                    </Button>
                  )}
                </podForm.Subscribe>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="font-serif text-3xl tracking-[-0.03em]">
                Schedule an event
              </CardTitle>
              <CardDescription>
                The API stores UTC instants, but the form stays local and human.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResultBanner result={eventResult} />
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void eventForm.handleSubmit();
                }}
              >
                <eventForm.Field name="podId">
                  {(field) => (
                    <Field id={field.name} label="Pod">
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                        disabled={props.snapshot.pods.length === 0}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select a pod" />
                        </SelectTrigger>
                        <SelectContent>
                          {props.snapshot.pods.map((pod) => (
                            <SelectItem key={pod.id} value={pod.id}>
                              {pod.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </eventForm.Field>

                <eventForm.Field
                  name="title"
                  validators={{
                    onChange: z
                      .string()
                      .trim()
                      .min(2, "Event title must be at least 2 characters."),
                  }}
                >
                  {(field) => (
                    <Field
                      id={field.name}
                      label="Title"
                      error={getErrorMessage(field.state.meta.errors[0])}
                    >
                      <Input
                        id={field.name}
                        placeholder="Commander Night"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                    </Field>
                  )}
                </eventForm.Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <eventForm.Field name="location">
                    {(field) => (
                      <Field id={field.name} label="Location">
                        <Input
                          id={field.name}
                          placeholder="Library meeting room"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />
                      </Field>
                    )}
                  </eventForm.Field>

                  <eventForm.Field
                    name="scheduledFor"
                    validators={{
                      onChange: z
                        .string()
                        .min(1, "Choose a local date and time."),
                    }}
                  >
                    {(field) => (
                      <Field
                        id={field.name}
                        label="Local date and time"
                        error={getErrorMessage(field.state.meta.errors[0])}
                      >
                        <Input
                          id={field.name}
                          type="datetime-local"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />
                      </Field>
                    )}
                  </eventForm.Field>
                </div>

                <eventForm.Field name="description">
                  {(field) => (
                    <Field id={field.name} label="Notes">
                      <Textarea
                        id={field.name}
                        placeholder="Optional notes, agenda, or what to bring."
                        rows={4}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                    </Field>
                  )}
                </eventForm.Field>

                <eventForm.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      className="w-full rounded-2xl"
                      size="lg"
                      disabled={
                        props.snapshot.pods.length === 0 ||
                        !canSubmit ||
                        isSubmitting
                      }
                    >
                      {isSubmitting ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <CalendarFold className="size-4" />
                      )}
                      Schedule event
                    </Button>
                  )}
                </eventForm.Subscribe>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="font-serif text-3xl tracking-[-0.03em]">
                Current pods
              </CardTitle>
              <CardDescription>
                Every pod belongs to the signed-in account and scopes the event
                timeline beside it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {props.snapshot.pods.length ? (
                <div className="grid gap-3">
                  {props.snapshot.pods.map((pod) => (
                    <div
                      key={pod.id}
                      className="rounded-[1.4rem] border border-border/60 bg-background/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-foreground">
                            {pod.name}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {pod.description || "No description yet."}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-full border-border/70 px-3 py-1"
                        >
                          {pod.eventCount} event(s)
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState copy="No pods exist yet. Create one to unlock scheduling." />
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="font-serif text-3xl tracking-[-0.03em]">
                Recent and upcoming events
              </CardTitle>
              <CardDescription>
                The timeline keeps the recent window visible so just-finished
                sessions still have context.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {props.snapshot.events.length ? (
                <div className="space-y-4">
                  {props.snapshot.events.map((event, index) => (
                    <div key={event.id}>
                      {index > 0 ? <Separator className="mb-4" /> : null}
                      <div className="flex gap-4">
                        <div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Orbit className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold text-foreground">
                                {event.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {event.podName}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className="rounded-full border border-primary/10 bg-primary/10 px-3 py-1 text-primary"
                            >
                              <span suppressHydrationWarning>
                                {formatInTimeZone(
                                  event.scheduledFor,
                                  props.timezone,
                                )}
                              </span>
                            </Badge>
                          </div>
                          {event.location ? (
                            <p className="mt-3 text-sm text-muted-foreground">
                              Location: {event.location}
                            </p>
                          ) : null}
                          {event.description ? (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {event.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState copy="No events yet. Schedule one once a pod exists." />
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function Field(props: {
  id: string;
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      {props.children}
      {props.error ? (
        <p className="text-sm text-destructive">{props.error}</p>
      ) : null}
    </div>
  );
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return undefined;
};

function ResultBanner({
  result,
}: {
  result: CreatePodResult | CreateEventResult | null;
}) {
  if (!result) {
    return null;
  }

  return (
    <div
      className={
        result.ok
          ? "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
          : "rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      }
    >
      {result.ok ? result.message : result.error}
    </div>
  );
}

function StatCard(props: {
  label: string;
  value: number | string;
  suppressHydrationWarning?: boolean;
}) {
  return (
    <div className="rounded-[1.4rem] border border-border/70 bg-background/75 px-4 py-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {props.label}
      </p>
      <p
        className="mt-3 font-serif text-3xl tracking-[-0.04em] text-foreground"
        suppressHydrationWarning={props.suppressHydrationWarning}
      >
        {props.value}
      </p>
    </div>
  );
}

function EmptyState(props: { copy: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-background/70 px-5 py-8 text-sm leading-6 text-muted-foreground">
      {props.copy}
    </div>
  );
}
