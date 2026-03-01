import { auth } from './auth';

export type SessionUser = {
  id: number;
  email: string;
  name: string | null;
};

export async function resolveSessionUser(request: Request): Promise<SessionUser | null> {
  const result = await auth.api.getSession({ headers: request.headers });

  if (!result?.user) {
    return null;
  }

  return {
    id: Number(result.user.id),
    email: result.user.email,
    name: result.user.name,
  };
}
