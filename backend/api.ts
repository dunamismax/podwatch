import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { events, podMembers, pods } from '../db/schema';
import { db } from './db';
import { json } from './http';
import { userHasPermission } from './permissions';
import { resolveSessionUser } from './session';

const createPodSchema = z.object({
  name: z.string().trim().min(2, 'Pod name must be at least 2 characters.').max(120),
  description: z.string().trim().max(500).optional().nullable(),
});

async function requirePermission(request: Request, permission: string) {
  const user = await resolveSessionUser(request);

  if (!user) {
    return { error: json({ error: 'Unauthorized' }, 401) };
  }

  const allowed = await userHasPermission(user.id, permission);

  if (!allowed) {
    return { error: json({ error: 'Forbidden' }, 403) };
  }

  return { user };
}

async function parseJson(
  request: Request,
): Promise<{ ok: true; data: unknown } | { ok: false; error: Response }> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return {
      ok: false,
      error: json({ error: 'Request body must be valid JSON.' }, 400),
    };
  }
}

export async function handlePodsIndex(request: Request): Promise<Response> {
  const access = await requirePermission(request, 'api.access');
  if (access.error) {
    return access.error;
  }

  const records = await db
    .select({
      id: pods.id,
      name: pods.name,
      description: pods.description,
      role: podMembers.role,
    })
    .from(podMembers)
    .innerJoin(pods, eq(pods.id, podMembers.podId))
    .where(eq(podMembers.userId, access.user.id))
    .orderBy(desc(pods.createdAt));

  return json({ pods: records });
}

export async function handlePodsCreate(request: Request): Promise<Response> {
  const access = await requirePermission(request, 'api.access');
  if (access.error) {
    return access.error;
  }

  const canCreatePod = await userHasPermission(access.user.id, 'api.pods.create');
  if (!canCreatePod) {
    return json({ error: 'Forbidden' }, 403);
  }

  const parsedBody = await parseJson(request);
  if (!parsedBody.ok) {
    return parsedBody.error;
  }

  const payload = createPodSchema.safeParse(parsedBody.data);
  if (!payload.success) {
    return json({ error: payload.error.issues[0]?.message ?? 'Invalid payload.' }, 400);
  }

  const description = payload.data.description?.trim() || null;

  const [pod] = await db.transaction(async (tx) => {
    const [createdPod] = await tx
      .insert(pods)
      .values({
        name: payload.data.name.trim(),
        description,
        ownerId: access.user.id,
      })
      .returning({
        id: pods.id,
        name: pods.name,
        description: pods.description,
      });

    if (!createdPod) {
      throw new Error('Pod creation failed.');
    }

    await tx.insert(podMembers).values({
      podId: createdPod.id,
      userId: access.user.id,
      role: 'owner',
    });

    return [createdPod];
  });

  return json(
    {
      pod: {
        ...pod,
        role: 'owner',
      },
    },
    201,
  );
}

export async function handleEventsIndex(request: Request): Promise<Response> {
  const access = await requirePermission(request, 'api.access');
  if (access.error) {
    return access.error;
  }

  const records = await db
    .select({
      id: events.id,
      podName: pods.name,
      title: events.title,
      location: events.location,
      scheduledFor: events.scheduledFor,
    })
    .from(events)
    .innerJoin(pods, eq(pods.id, events.podId))
    .innerJoin(
      podMembers,
      and(eq(podMembers.podId, events.podId), eq(podMembers.userId, access.user.id)),
    )
    .where(gte(events.scheduledFor, sql`NOW() - INTERVAL '1 day'`))
    .orderBy(events.scheduledFor)
    .limit(20);

  return json({
    events: records.map((event) => ({
      ...event,
      scheduledFor: event.scheduledFor?.toISOString() ?? null,
    })),
  });
}
