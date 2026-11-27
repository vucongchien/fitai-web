import { Code, ConnectError } from "@connectrpc/connect";

export interface AiSupportState {
  /** AI rules (motion spec) can only be configured once the exercise has a motion slug. */
  canConfigure: boolean;
  message: string;
}

export function getAiSupportState({
  hasAiSupported,
  motionSlug,
}: {
  hasAiSupported: boolean;
  motionSlug: string;
}): AiSupportState {
  const slug = motionSlug.trim();
  if (!slug) {
    return {
      canConfigure: false,
      message: "Set a motion slug and save before enabling AI form tracking.",
    };
  }
  if (hasAiSupported) {
    return { canConfigure: true, message: `AI form tracking is on (motion "${slug}").` };
  }
  return {
    canConfigure: true,
    message: `AI form tracking turns on once the "${slug}" motion spec is ready.`,
  };
}

/** Client-side guard mirroring the backend invariant (AI support requires a motion slug). */
export function validateMotionSlug(hasAiSupported: boolean, motionSlug: string): string | null {
  if (hasAiSupported && !motionSlug.trim()) {
    return "Motion slug is required while AI form tracking is on.";
  }
  return null;
}

export function describeExerciseError(error: unknown): string {
  const connectError = ConnectError.from(error);
  switch (connectError.code) {
    case Code.AlreadyExists: {
      return "An exercise with this slug already exists. Use a different name.";
    }
    case Code.FailedPrecondition: {
      return "AI form tracking requires a motion slug.";
    }
    case Code.InvalidArgument: {
      return connectError.rawMessage || "Some exercise fields are invalid.";
    }
    case Code.NotFound: {
      return "Exercise not found.";
    }
    default: {
      return "Could not save the exercise. Please try again.";
    }
  }
}
