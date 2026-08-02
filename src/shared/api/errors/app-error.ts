import { Code, ConnectError } from "@connectrpc/connect";

export type AppErrorKind =
  | "auth"
  | "conflict"
  | "network"
  | "not-found"
  | "unavailable"
  | "validation"
  | "unknown";

export class AppError extends Error {
  constructor(
    message: string,
    readonly kind: AppErrorKind,
    readonly retryable: boolean,
    readonly traceId?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toAppError(reason: unknown): AppError {
  const error = ConnectError.from(reason);
  const traceId = error.metadata.get("x-trace-id") ?? undefined;

  switch (error.code) {
    case Code.Unauthenticated:
      return new AppError(
        "Your session has expired. Sign in again to continue.",
        "auth",
        false,
        traceId,
      );
    case Code.InvalidArgument:
      return new AppError(
        error.rawMessage || "Check the highlighted details and try again.",
        "validation",
        false,
        traceId,
      );
    case Code.NotFound:
      return new AppError(
        "That training record is no longer available.",
        "not-found",
        false,
        traceId,
      );
    case Code.AlreadyExists:
    case Code.Aborted:
      return new AppError(
        "The request conflicts with a newer training update.",
        "conflict",
        false,
        traceId,
      );
    case Code.Unavailable:
    case Code.DeadlineExceeded:
      return new AppError(
        "FITAI cannot reach the training service right now.",
        "unavailable",
        true,
        traceId,
      );
    default:
      return new AppError(
        "The request did not finish. Try again when your connection is stable.",
        "unknown",
        false,
        traceId,
      );
  }
}
