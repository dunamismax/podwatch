import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { type ReactNode, startTransition, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";

export function AuthCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setError(null);

      if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        });

        if (result.error) {
          setError(result.error.message || "Could not create the account.");
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });

        if (result.error) {
          setError(result.error.message || "Could not sign in.");
          return;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["viewer"] });
      startTransition(() => {
        form.reset();
      });
      await navigate({ to: "/app" });
    },
  });

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <div className="space-y-6">
        <Badge className="w-fit rounded-full px-4 py-1.5 text-[0.72rem] uppercase tracking-[0.26em]">
          Private Workspace
        </Badge>
        <div className="space-y-4">
          <h1 className="font-serif text-5xl leading-[0.95] tracking-[-0.04em] text-foreground">
            {mode === "sign-up"
              ? "Start a fresh pod board."
              : "Return to your planning desk."}
          </h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Accounts stay on the Hono API, sessions live in Better Auth, and the
            SPA only loads the protected dashboard once your session is in
            place.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-[0_26px_80px_rgba(23,17,11,0.12)] backdrop-blur">
        <CardHeader className="space-y-4">
          <Badge
            variant="secondary"
            className="w-fit rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-primary"
          >
            Better Auth
          </Badge>
          <CardTitle className="font-serif text-3xl tracking-[-0.03em]">
            {mode === "sign-up" ? "Create an account" : "Sign back in"}
          </CardTitle>
          <CardDescription>
            Use email and password to create or reopen your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={mode}
            onValueChange={(next) => {
              setMode(next as "sign-in" | "sign-up");
              setError(null);
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="sign-up" className="flex-1">
                Create account
              </TabsTrigger>
              <TabsTrigger value="sign-in" className="flex-1">
                Sign in
              </TabsTrigger>
            </TabsList>

            <TabsContent value={mode}>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit();
                }}
              >
                {mode === "sign-up" ? (
                  <form.Field
                    name="name"
                    validators={{
                      onChange: z
                        .string()
                        .trim()
                        .min(2, "Name must be at least 2 characters."),
                    }}
                  >
                    {(field) => (
                      <Field
                        id={field.name}
                        label="Name"
                        error={getErrorMessage(field.state.meta.errors[0])}
                      >
                        <Input
                          autoComplete="name"
                          id={field.name}
                          name={field.name}
                          placeholder="Sawyer"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                ) : null}

                <form.Field
                  name="email"
                  validators={{
                    onChange: z.string().email("Enter a valid email address."),
                  }}
                >
                  {(field) => (
                    <Field
                      id={field.name}
                      label="Email"
                      error={getErrorMessage(field.state.meta.errors[0])}
                    >
                      <Input
                        autoComplete="email"
                        id={field.name}
                        name={field.name}
                        placeholder="sawyer@example.com"
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field
                  name="password"
                  validators={{
                    onChange: z
                      .string()
                      .min(8, "Password must be at least 8 characters."),
                  }}
                >
                  {(field) => (
                    <Field
                      id={field.name}
                      label="Password"
                      error={getErrorMessage(field.state.meta.errors[0])}
                    >
                      <Input
                        autoComplete={
                          mode === "sign-up"
                            ? "new-password"
                            : "current-password"
                        }
                        id={field.name}
                        name={field.name}
                        placeholder="At least 8 characters"
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                    </Field>
                  )}
                </form.Field>

                {error ? (
                  <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}

                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full rounded-2xl"
                      disabled={!canSubmit || isSubmitting}
                    >
                      {isSubmitting ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <ArrowRight className="size-4" />
                      )}
                      {mode === "sign-up" ? "Create account" : "Sign in"}
                    </Button>
                  )}
                </form.Subscribe>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
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
