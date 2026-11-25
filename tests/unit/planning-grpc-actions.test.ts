import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  InitiateRoadmapResponseSchema,
  RegenerateScheduleResponseSchema,
} from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";
import type { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";

type CoachingClient = Client<typeof CoachingService>;

const mockInitiateRoadmap = vi.fn<CoachingClient["initiateRoadmap"]>();
const mockRegenerateSchedule = vi.fn<CoachingClient["regenerateSchedule"]>();

vi.mock<typeof import("@connectrpc/connect")>(import("@connectrpc/connect"), () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    initiateRoadmap: mockInitiateRoadmap,
    regenerateSchedule: mockRegenerateSchedule,
  }),
}));

vi.mock<typeof import("@/shared/api/server/transport")>(
  import("@/shared/api/server/transport"),
  () => ({
    createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
  }),
);

vi.mock<typeof import("@/shared/auth/session")>(import("@/shared/auth/session"), () => ({
  getAccessToken: () => Promise.resolve("auth_token_123"),
  getAuthenticatedUserId: () => Promise.resolve("usr-plan-456"),
}));

describe("planning & Coaching gRPC Actions", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockInitiateRoadmap.mockReset();
    mockRegenerateSchedule.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("initiateRoadmapServerAction calls gRPC InitiateRoadmap with userId", async () => {
    mockInitiateRoadmap.mockResolvedValue(
      create(InitiateRoadmapResponseSchema, {
        roadmap: {
          roadmapId: "rdm-999",
          userId: "usr-plan-456",
        },
      }),
    );

    const { initiateRoadmapServerAction } =
      await import("@/features/roadmap/server/coaching-actions");
    const res = await initiateRoadmapServerAction();

    expect(mockInitiateRoadmap).toHaveBeenCalledWith({});
    expect(res.success).toBe(true);
    expect(res.roadmapId).toBe("rdm-999");
  });

  it("regenerateScheduleServerAction triggers schedule adaptation on backend", async () => {
    mockRegenerateSchedule.mockResolvedValue(
      create(RegenerateScheduleResponseSchema, {
        roadmap: { roadmapId: "rdm-999" },
      }),
    );

    const { regenerateScheduleServerAction } =
      await import("@/features/roadmap/server/coaching-actions");
    const res = await regenerateScheduleServerAction("rdm-999", "Injury reported");

    expect(mockRegenerateSchedule).toHaveBeenCalledWith({
      roadmapId: "rdm-999",
      reason: "Injury reported",
    });
    expect(res.success).toBe(true);
  });
});
