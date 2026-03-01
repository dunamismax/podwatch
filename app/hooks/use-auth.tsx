import { authClient } from '~/lib/auth-client';

export type SessionUser = {
  email: string;
  id: string;
  name: string | null;
};

export function useAuth() {
  const session = authClient.useSession();

  const status = session.isPending
    ? ('loading' as const)
    : session.data?.user
      ? ('authenticated' as const)
      : ('unauthenticated' as const);

  const user: SessionUser | null = session.data?.user
    ? {
        id: session.data.user.id,
        email: session.data.user.email,
        name: session.data.user.name,
      }
    : null;

  return {
    session: user,
    status,
    signIn: authClient.signIn,
    signUp: authClient.signUp,
    signOut: authClient.signOut,
  };
}
