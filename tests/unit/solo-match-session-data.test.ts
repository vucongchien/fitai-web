import { create } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";
import type { Client, Transport } from "@connectrpc/connect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreateAdhocSessionPlanResponseSchema } from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";
import type { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { GetMatchResponseSchema } from "@/shared/api/gen/contracts/core/solo_match/v1/message/match_message_pb";
import type { SoloMatchService } from "@/shared/api/gen/contracts/core/solo_match/v1/service/solo_match_service_pb";
import { GetMotionSpecificationResponseSchema } from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";
import type { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";

type CoachingClient = Client<typeof CoachingService>;
type SoloClient = Client<typeof SoloMatchService>;
type WorkoutClient = Client<typeof WorkoutExecutionService>;

const mockCreateAdhocSessionPlan = vi.fn<CoachingClient["createAdhocSessionPlan"]>();
const mockGetMatch = vi.fn<SoloClient["getMatch"]>();
const mockGetMotionSpecification = vi.fn<WorkoutClient["getMotionSpecification"]>();

vi.mock<typeof import("@connectrpc/connect")>(
  import("@connectrpc/connect"),
  async (importOriginal) => ({
    ...(await importOriginal()),
    createClient: (_service: unknown, _transport: unknown) => ({
      createAdhocSessionPlan: mockCreateAdhocSessionPlan,
      getMatch: mockGetMatch,
      getMotionSpecification: mockGetMotionSpecification,
    }),
  }),
);

vi.mock<typeof import("@/shared/api/server/transport")>(
  import("@/shared/api/server/transport"),
  () => ({
    createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
  }),
);

const cookieValues: Record<string, string> = {
  fitai_access_token: "token-1",
  fitai_user_id: "user-1",
};
vi.mock<typeof import("next/headers")>(import("next/headers"), () => ({
  cookies: async () =>
    ({
      get: (name: string) => (cookieValues[name] ? { value: cookieValues[name] } : undefined),
    }) as unknown as Awaited<ReturnType<typeof import("next/headers").cookies>>,
}));

describe("solo match session data", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockCreateAdhocSessionPlan.mockReset();
    mockGetMatch.mockReset();
    mockGetMotionSpecification.mockReset();
    mockGetMatch.mockResolvedValue(
      create(GetMatchResponseSchema, { match: { matchId: "m-1", exerciseId: "bench" } }),
    );
    mockGetMotionSpecification.mockResolvedValue(create(GetMotionSpecificationResponseSchema, {}));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks the duel with the coach's reason when an injury excludes the exercise", async () => {
    mockCreateAdhocSessionPlan.mockRejectedValue(
      new ConnectError(
        "exercise is excluded by an active injury: Bench Press (SHOULDER (MODERATE))",
        Code.FailedPrecondition,
      ),
    );

    const { getSoloMatchSessionData } =
      await import("@/features/solo-match/server/get-challenge-page-data");
    const data = await getSoloMatchSessionData("m-1");

    expect(data.match?.matchId).toBe("m-1");
    expect(data.blockedReason).toBe(
      "exercise is excluded by an active injury: Bench Press (SHOULDER (MODERATE))",
    );
  });

  it("falls back to a match-session id when the athlete has no roadmap", async () => {
    mockCreateAdhocSessionPlan.mockRejectedValue(
      new ConnectError("no active roadmap", Code.NotFound),
    );

    const { getSoloMatchSessionData } =
      await import("@/features/solo-match/server/get-challenge-page-data");
    const data = await getSoloMatchSessionData("m-1");

    expect(data.blockedReason).toBeUndefined();
    expect(data.planId).toBe("solo-m-1-user-1");
  });

  it("uses the coach's session plan when one is created", async () => {
    mockCreateAdhocSessionPlan.mockResolvedValue(
      create(CreateAdhocSessionPlanResponseSchema, { sessionPlan: { sessionPlanId: "plan-9" } }),
    );

    const { getSoloMatchSessionData } =
      await import("@/features/solo-match/server/get-challenge-page-data");
    const data = await getSoloMatchSessionData("m-1");

    expect(data.blockedReason).toBeUndefined();
    expect(data.planId).toBe("plan-9");
  });

  it("loads the result page without creating a session plan", async () => {
    const { getSoloMatchResultData } =
      await import("@/features/solo-match/server/get-challenge-page-data");
    const data = await getSoloMatchResultData("m-1");

    expect(data.match?.matchId).toBe("m-1");
    expect(data.currentUserId).toBe("user-1");
    expect(mockCreateAdhocSessionPlan).not.toHaveBeenCalled();
  });
});
