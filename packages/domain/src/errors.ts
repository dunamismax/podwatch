export type PodwatchErrorTag =
  | "ValidationError"
  | "ConflictError"
  | "NotFoundError"
  | "InfrastructureError";

export class PodwatchError extends Error {
  constructor(
    readonly _tag: PodwatchErrorTag,
    message: string,
  ) {
    super(message);
    this.name = _tag;
  }
}

const createPodwatchError =
  (_tag: PodwatchErrorTag) =>
  (message: string): PodwatchError =>
    new PodwatchError(_tag, message);

export const validationError = createPodwatchError("ValidationError");
export const conflictError = createPodwatchError("ConflictError");
export const notFoundError = createPodwatchError("NotFoundError");
export const infrastructureError = createPodwatchError("InfrastructureError");

export const formatPodwatchError = (error: unknown): PodwatchError => {
  if (error instanceof PodwatchError) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    "message" in error &&
    typeof error._tag === "string" &&
    typeof error.message === "string"
  ) {
    return new PodwatchError(error._tag as PodwatchErrorTag, error.message);
  }

  if (error instanceof Error) {
    return infrastructureError(error.message);
  }

  return infrastructureError("Unexpected server failure.");
};
