import * as z from "zod";

export const SummarySchema = z.object({
  podCount: z.number(),
  eventCount: z.number(),
  upcomingCount: z.number(),
});

export const PodSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  eventCount: z.number(),
});

export const EventSummarySchema = z.object({
  id: z.string(),
  podId: z.string(),
  podName: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  scheduledFor: z.string(),
  scheduledTimezone: z.string(),
});

export const DashboardSnapshotSchema = z.object({
  summary: SummarySchema,
  pods: z.array(PodSummarySchema),
  events: z.array(EventSummarySchema),
});

export const CreatePodInputSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const CreateEventInputSchema = z.object({
  podId: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  scheduledFor: z.string(),
  timezone: z.string(),
});

export type Summary = z.infer<typeof SummarySchema>;
export type PodSummary = z.infer<typeof PodSummarySchema>;
export type EventSummary = z.infer<typeof EventSummarySchema>;
export type DashboardSnapshot = z.infer<typeof DashboardSnapshotSchema>;
export type CreatePodInput = z.infer<typeof CreatePodInputSchema>;
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

export interface PodwatchRepository {
  loadDashboardSnapshot(userId: string, now: Date): Promise<DashboardSnapshot>;
  findPodByNormalizedName(
    userId: string,
    nameNormalized: string,
  ): Promise<PodSummary | null>;
  createPod(input: {
    userId: string;
    name: string;
    nameNormalized: string;
    description: string;
  }): Promise<PodSummary>;
  findPodForOwner(
    userId: string,
    podId: string,
  ): Promise<Pick<PodSummary, "id" | "name"> | null>;
  createEvent(input: {
    userId: string;
    podId: string;
    title: string;
    description: string;
    location: string;
    scheduledFor: Date;
    scheduledTimezone: string;
  }): Promise<EventSummary>;
}
