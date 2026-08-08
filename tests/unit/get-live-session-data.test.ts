import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getLiveSessionData } from "@/features/workout/server/get-live-session-data";

vi.mock("@/shared/auth/session", () => ({
  getAuthenticatedSession: () => Promise.resolve({ accessToken: "mock_access_token", userId: "usr_123" }),
}));

describe("getLiveSessionData Fallback & Session Execution", () => {
  beforeEach(() => {
    vi.stubEnv("FITAI_RPC_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns fallback exercise plan when offline so live session never starts empty", async () => {
    const plan = await getLiveSessionData("session_test_123");

    expect(plan.sessionId).toBe("session_test_123");
    expect(plan.mainExercises.length).toBeGreaterThan(0);
    expect(plan.mainExercises[0]?.name).toBe("Bodyweight Squat");
    expect(plan.mainExercises[0]?.videoUrl).toBeTruthy();
    expect(plan.mainExercises[0]?.thumbnailUrl).toBeTruthy();
  });

  it("parses exerciseIds encoded in adhoc sessionId when starting adhoc workout", async () => {
    const plan = await getLiveSessionData("adhoc_ex-pushup,ex-plank_172300000");

    expect(plan.sessionId).toBe("adhoc_ex-pushup,ex-plank_172300000");
    expect(plan.mainExercises.length).toBe(2);
    expect(plan.mainExercises[0]?.exerciseId).toBe("ex-pushup");
    expect(plan.mainExercises[0]?.videoUrl).toBeTruthy();
    expect(plan.mainExercises[1]?.exerciseId).toBe("ex-plank");
    expect(plan.mainExercises[1]?.videoUrl).toBeTruthy();
  });
});
