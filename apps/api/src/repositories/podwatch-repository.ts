import type {
  DashboardSnapshot,
  EventSummary,
  PodSummary,
  PodwatchRepository,
} from "@podwatch/domain";
import type { PrismaClient } from "@prisma/client";

const toIsoString = (value: Date) => value.toISOString();

export const createPodwatchRepository = (
  db: PrismaClient,
): PodwatchRepository => ({
  async loadDashboardSnapshot(userId, now) {
    const recentThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [pods, events, podCount, eventCount, upcomingCount] =
      await Promise.all([
        db.pod.findMany({
          where: {
            ownerId: userId,
          },
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                events: true,
              },
            },
          },
        }),
        db.event.findMany({
          where: {
            ownerId: userId,
            scheduledFor: {
              gte: recentThreshold,
            },
          },
          orderBy: [{ scheduledFor: "asc" }, { title: "asc" }],
          take: 20,
          select: {
            id: true,
            podId: true,
            title: true,
            description: true,
            location: true,
            scheduledFor: true,
            scheduledTimezone: true,
            pod: {
              select: {
                name: true,
              },
            },
          },
        }),
        db.pod.count({
          where: {
            ownerId: userId,
          },
        }),
        db.event.count({
          where: {
            ownerId: userId,
          },
        }),
        db.event.count({
          where: {
            ownerId: userId,
            scheduledFor: {
              gte: now,
            },
          },
        }),
      ]);

    return {
      summary: {
        podCount,
        eventCount,
        upcomingCount,
      },
      pods: pods.map(
        (pod): PodSummary => ({
          id: pod.id,
          name: pod.name,
          description: pod.description,
          eventCount: pod._count.events,
        }),
      ),
      events: events.map(
        (event): EventSummary => ({
          id: event.id,
          podId: event.podId,
          podName: event.pod.name,
          title: event.title,
          description: event.description,
          location: event.location,
          scheduledFor: toIsoString(event.scheduledFor),
          scheduledTimezone: event.scheduledTimezone,
        }),
      ),
    } satisfies DashboardSnapshot;
  },

  async findPodByNormalizedName(userId, nameNormalized) {
    const pod = await db.pod.findFirst({
      where: {
        ownerId: userId,
        nameNormalized,
      },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            events: true,
          },
        },
      },
    });

    if (!pod) {
      return null;
    }

    return {
      id: pod.id,
      name: pod.name,
      description: pod.description,
      eventCount: pod._count.events,
    };
  },

  async createPod({ userId, name, nameNormalized, description }) {
    const pod = await db.pod.create({
      data: {
        ownerId: userId,
        name,
        nameNormalized,
        description,
      },
    });

    return {
      id: pod.id,
      name: pod.name,
      description: pod.description,
      eventCount: 0,
    };
  },

  async findPodForOwner(userId, podId) {
    const pod = await db.pod.findFirst({
      where: {
        id: podId,
        ownerId: userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return pod;
  },

  async createEvent({
    userId,
    podId,
    title,
    description,
    location,
    scheduledFor,
    scheduledTimezone,
  }) {
    const event = await db.event.create({
      data: {
        ownerId: userId,
        podId,
        title,
        description,
        location,
        scheduledFor,
        scheduledTimezone,
      },
      select: {
        id: true,
        podId: true,
        title: true,
        description: true,
        location: true,
        scheduledFor: true,
        scheduledTimezone: true,
        pod: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: event.id,
      podId: event.podId,
      podName: event.pod.name,
      title: event.title,
      description: event.description,
      location: event.location,
      scheduledFor: toIsoString(event.scheduledFor),
      scheduledTimezone: event.scheduledTimezone,
    };
  },
});
