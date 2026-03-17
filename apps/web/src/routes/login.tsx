import { createFileRoute, redirect } from "@tanstack/react-router";

import { AuthCard } from "@/components/auth-card";
import { viewerQueryOptions } from "@/lib/query";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    const viewer = await context.queryClient.ensureQueryData(
      viewerQueryOptions(),
    );

    if (viewer) {
      throw redirect({ to: "/app" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
      <AuthCard />
    </main>
  );
}
