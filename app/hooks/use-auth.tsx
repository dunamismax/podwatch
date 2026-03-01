import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '~/lib/api';

export type SessionUser = {
  email: string;
  id: number;
  name: string | null;
};

type SessionPayload = {
  authenticated: boolean;
  user: SessionUser | null;
};

type AuthStatus = 'authenticated' | 'loading' | 'unauthenticated';

type AuthContextValue = {
  session: SessionUser | null;
  status: AuthStatus;
  refreshSession: () => Promise<void>;
  signIn: (payload: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refreshSession = useCallback(async () => {
    try {
      const data = await apiFetch<SessionPayload>('/api/session');
      setSession(data.user);
      setStatus(data.authenticated ? 'authenticated' : 'unauthenticated');
    } catch {
      setSession(null);
      setStatus('unauthenticated');
    }
  }, []);

  const signIn = useCallback(
    async (payload: { email: string; password: string }) => {
      await apiFetch('/api/login', { method: 'POST', body: payload });
      await refreshSession();
    },
    [refreshSession],
  );

  const signOut = useCallback(async () => {
    await apiFetch('/api/logout', { method: 'POST' });
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <AuthContext value={{ session, status, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
