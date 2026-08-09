import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";

import {
  SuggestAdHocSessionResponseSchema,
} from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";
import type { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";

type CoachingClient = Client<typeof CoachingService>;

const mockSuggestAdHocSession = vi.fn<CoachingClient["suggestAdHocSession"]>();

vi.mock<typeof import("@connectrpc/connect")>(import("@connectrpc/connect"), () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    suggestAdHocSession: mockSuggestAdHocSession,
  }),
}));

vi.mock<typeof import("@/shared/api/server/transport")>(
  import("@/shared/api/server/transport"),
  () => ({
    createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
  }),
);

vi.mock<typeof import("@/shared/auth/session")>(import("@/shared/auth/session"), () => ({
  getAccessToken: () => Promise.resolve("mock_jwt_token_123"),
  getAuthenticatedUserId: () => Promise.resolve("usr-adhoc-test"),
}));

describe("Adhoc AI Recommendation Server Action", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockSuggestAdHocSession.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls CoachingService.suggestAdHocSession with ConnectRPC hint and maps response", async () => {
    mockSuggestAdHocSession.mockResolvedValue(
      create(SuggestAdHocSessionResponseSchema, {
        muscleGroups: ["Chest", "Triceps"],
        reasoning: "Tập trung tăng áp lực lên cơ ngực và tay sau với bài đẩy.",
        estimatedRpe: 7.5,
        prescription: {
          mainExercises: [
            {
              exerciseId: "ex-incline-db",
              exerciseName: "Incline Dumbbell Press",
              targetSets: 4,
              targetReps: 10,
              targetWeight: 22,
              durationSeconds: 0,
              notes: "Tập trung ngực trên",
              restSetSec: 90,
              restExerciseSec: 120,
            },
          ],
          warmUps: [
            {
              exerciseId: "ex-warmup-pushup",
              exerciseName: "Pushups",
              targetSets: 2,
              targetReps: 15,
              notes: "Khởi động nhẹ",
              restSetSec: 45,
            },
          ],
          coolDowns: [
            {
              exerciseId: "ex-chest-stretch",
              exerciseName: "Chest Stretch",
              targetSets: 1,
              targetReps: 10,
              notes: "Giãn cơ ngực",
              restSetSec: 30,
            },
          ],
        },
      }),
    );

    const { getAiRecommendation } = await import(
      "@/features/workout/server/workout-actions"
    );

    const res = await getAiRecommendation({
      freeText: "Tập ngực với tạ đơn",
      durationMinutes: 45,
    });

    expect(mockSuggestAdHocSession).toHaveBeenCalledTimes(1);
    expect(res.muscleGroups).toEqual(["Chest", "Triceps"]);
    expect(res.estimatedRpe).toBe(7.5);
    expect(res.reasoning).toContain("ngực và tay sau");
    expect(res.exercises).toHaveLength(1);
    expect(res.exercises[0]?.exerciseName).toBe("Incline Dumbbell Press");
    expect(res.exercises[0]?.targetWeight).toBe(22);
    expect(res.warmUps).toHaveLength(1);
    expect(res.coolDowns).toHaveLength(1);
  });

  it("throws error when gRPC returns error directly without offline fallback", async () => {
    mockSuggestAdHocSession.mockRejectedValue(new Error("ConnectRPC connection timeout"));

    const { getAiRecommendation } = await import(
      "@/features/workout/server/workout-actions"
    );

    await expect(
      getAiRecommendation({
        freeText: "Hôm nay muốn tập chân đùi",
        durationMinutes: 45,
      }),
    ).rejects.toThrow("ConnectRPC connection timeout");
  });
});
