import { and, eq, gt } from 'drizzle-orm';
import { sessions, users } from '../db/schema';
import { db } from './db';
import { parseCookies } from './http';

export type SessionUser = {
  id: number;
  email: string;
  name: string | null;
};

export async function resolveSessionUser(request: Request): Promise<SessionUser | null> {
  const cookies = parseCookies(request);
  const sessionToken =
    cookies.get('__Secure-authjs.session-token') ?? cookies.get('authjs.session-token') ?? null;

  if (!sessionToken) {
    return null;
  }

  const now = new Date();
  const record = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.sessionToken, sessionToken), gt(sessions.expires, now)))
    .limit(1);

  if (!record[0]) {
    return null;
  }

  return record[0];
}
