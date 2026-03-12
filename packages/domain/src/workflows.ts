import { Temporal } from "@js-temporal/polyfill";

import {
  type CreateEventInput,
  CreateEventInputSchema,
  type CreatePodInput,
  CreatePodInputSchema,
  type DashboardSnapshot,
  DashboardSnapshotSchema,
  type EventSummary,
  type PodSummary,
  type PodwatchRepository,
} from "./contracts";
import {
  conflictError,
  formatPodwatchError,
  infrastructureError,
  notFoundError,
  validationError,
} from "./errors";

const collapseWhitespace = (value: string) => value.trim().replace(/\s+/g, " ");

const sanitizeOptionalText = (
  value: string,
  maxLength: number,
  label: string,
) => {
  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw validationError(`${label} must be ${maxLength} characters or fewer.`);
  }

  return normalized;
};

const sanitizeRequiredText = (
  value: string,
  {
    label,
    minLength,
    maxLength,
  }: {
    label: string;
    minLength: number;
    maxLength: number;
  },
) => {
  const normalized = collapseWhitespace(value);

  if (normalized.length < minLength) {
    throw validationError(`${label} must be at least ${minLength} characters.`);
  }

  if (normalized.length > maxLength) {
    throw validationError(`${label} must be ${maxLength} characters or fewer.`);
  }

  return normalized;
};

const validateTimezone = (timezone: string) => {
  const normalized = timezone.trim();

  if (!normalized) {
    throw validationError("A browser timezone is required.");
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: normalized }).format(
      new Date(),
    );
    return normalized;
  } catch {
    throw validationError("Submit a valid timezone.");
  }
};

const parseLocalDateTime = (scheduledFor: string, timezone: string) => {
  try {
    const plainDateTime = Temporal.PlainDateTime.from(scheduledFor);
    const zonedDateTime = plainDateTime.toZonedDateTime(timezone);

    return new Date(zonedDateTime.toInstant().epochMilliseconds);
  } catch {
    throw validationError("Submit a valid local date and time.");
  }
};

const fromRepository = async <T>(message: string, run: () => Promise<T>) => {
  try {
    return await run();
  } catch (error) {
    const formatted = formatPodwatchError(error);

    if (formatted._tag !== "InfrastructureError") {
      throw formatted;
    }

    throw infrastructureError(message);
  }
};

export const loadDashboardWorkflow = (
  repository: PodwatchRepository,
  userId: string,
  now = new Date(),
) =>
  fromRepository("Could not load the dashboard.", () =>
    repository.loadDashboardSnapshot(userId, now),
  ).then((snapshot) => {
    const parsed = DashboardSnapshotSchema.safeParse(snapshot);

    if (!parsed.success) {
      throw infrastructureError(
        "Dashboard data did not match the expected contract.",
      );
    }

    return parsed.data;
  });

export const createPodWorkflow = (
  repository: PodwatchRepository,
  userId: string,
  rawInput: unknown,
) =>
  (async () => {
    const parsedInput = CreatePodInputSchema.safeParse(rawInput);

    if (!parsedInput.success) {
      throw validationError("Submit a valid pod payload.");
    }

    const input = parsedInput.data as CreatePodInput;
    const name = sanitizeRequiredText(input.name, {
      label: "Pod name",
      minLength: 2,
      maxLength: 120,
    });
    const description = sanitizeOptionalText(
      input.description,
      1000,
      "Description",
    );
    const nameNormalized = name.toLocaleLowerCase();

    const existing = await fromRepository(
      "Could not check for existing pods.",
      () => repository.findPodByNormalizedName(userId, nameNormalized),
    );

    if (existing) {
      throw conflictError("A pod with this name already exists.");
    }

    return fromRepository("Could not create the pod.", () =>
      repository.createPod({
        userId,
        name,
        nameNormalized,
        description,
      }),
    );
  })();

export const createEventWorkflow = (
  repository: PodwatchRepository,
  userId: string,
  rawInput: unknown,
) =>
  (async () => {
    const parsedInput = CreateEventInputSchema.safeParse(rawInput);

    if (!parsedInput.success) {
      throw validationError("Submit a valid event payload.");
    }

    const input = parsedInput.data as CreateEventInput;
    const podId = input.podId.trim();

    if (!podId) {
      throw validationError("Choose a pod before scheduling.");
    }

    const timezone = validateTimezone(input.timezone);
    const title = sanitizeRequiredText(input.title, {
      label: "Event title",
      minLength: 2,
      maxLength: 255,
    });
    const location = sanitizeOptionalText(input.location, 255, "Location");
    const description = sanitizeOptionalText(
      input.description,
      2000,
      "Description",
    );
    const scheduledFor = parseLocalDateTime(input.scheduledFor, timezone);

    const pod = await fromRepository("Could not load the selected pod.", () =>
      repository.findPodForOwner(userId, podId),
    );

    if (!pod) {
      throw notFoundError("That pod does not exist for the current user.");
    }

    return fromRepository("Could not schedule the event.", () =>
      repository.createEvent({
        userId,
        podId: pod.id,
        title,
        description,
        location,
        scheduledFor,
        scheduledTimezone: timezone,
      }),
    );
  })();

export type { DashboardSnapshot, EventSummary, PodSummary };
