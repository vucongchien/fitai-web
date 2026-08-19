import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";

import { SaveHealthProfileResponseSchema } from "@/shared/api/gen/contracts/supporting/profile/v1/message/profile_messages_pb";
import type { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import {
  formatWorkoutTimesToProto,
  normalizeWorkoutTimes,
} from "@/features/onboarding/domain/workout-times-normalizer";
import {
  onboardingDefaults,
  onboardingSchema,
} from "@/features/onboarding/domain/onboarding-schema";
import {
  mapToWeekAvailability,
  weekAvailabilityToMap,
} from "@/features/onboarding/ui/components/scheduler/types";

type ProfileClient = Client<typeof ProfileService>;
const mockSaveHealthProfile = vi.fn<ProfileClient["saveHealthProfile"]>();

vi.mock<typeof import("@connectrpc/connect")>(import("@connectrpc/connect"), () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    saveHealthProfile: mockSaveHealthProfile,
    initiateRoadmap: vi.fn().mockResolvedValue({ roadmap: { roadmapId: "rdm-test-123" } }),
  }),
}));

vi.mock<typeof import("@/shared/api/server/transport")>(
  import("@/shared/api/server/transport"),
  () => ({
    createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
  }),
);

vi.mock<typeof import("@/shared/auth/session")>(import("@/shared/auth/session"), () => ({
  getAccessToken: () => Promise.resolve("mock_token"),
  getAuthenticatedUserId: () => Promise.resolve("usr-test-123"),
}));

describe("Onboarding Schedule State & Serialization Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. formatWorkoutTimesToProto Behavior", () => {
    it("returns exactly 3 default slots when input is undefined, null, or empty object", () => {
      // Chứng minh: khi dữ liệu bị rỗng hoặc mất state, hàm fallback về đúng 3 slot
      expect(formatWorkoutTimesToProto(undefined as any)).toStrictEqual([
        "mon:17:30-19:00",
        "wed:17:30-19:00",
        "fri:17:30-19:00",
      ]);

      expect(formatWorkoutTimesToProto({} as any)).toStrictEqual([
        "mon:17:30-19:00",
        "wed:17:30-19:00",
        "fri:17:30-19:00",
      ]);

      expect(formatWorkoutTimesToProto({ mon: [], wed: [] } as any)).toStrictEqual([
        "mon:17:30-19:00",
        "wed:17:30-19:00",
        "fri:17:30-19:00",
      ]);
    });

    it("correctly serializes when user selects 5 days in a week", () => {
      const fiveDaysSchedule = {
        mon: ["17:30-19:00"],
        tue: ["17:30-19:00"],
        wed: ["17:30-19:00"],
        thu: ["17:30-19:00"],
        fri: ["17:30-19:00"],
      };

      const result = formatWorkoutTimesToProto(fiveDaysSchedule);

      expect(result).toStrictEqual([
        "mon:17:30-19:00",
        "tue:17:30-19:00",
        "wed:17:30-19:00",
        "thu:17:30-19:00",
        "fri:17:30-19:00",
      ]);
      expect(result.length).toBe(5);
    });

    it("correctly serializes when user selects multiple slots (e.g. AM and PM) on the same day", () => {
      const multiSlotSchedule = {
        mon: ["06:00-07:30", "17:30-19:00"],
        wed: ["06:00-07:30", "18:00-19:30"],
        fri: ["17:30-19:00"],
        sat: ["08:00-09:30"],
      };

      const result = formatWorkoutTimesToProto(multiSlotSchedule);

      expect(result).toStrictEqual([
        "mon:06:00-07:30",
        "mon:17:30-19:00",
        "wed:06:00-07:30",
        "wed:18:00-19:30",
        "fri:17:30-19:00",
        "sat:08:00-09:30",
      ]);
      expect(result.length).toBe(6);
    });
  });

  describe("2. UI Conversion Roundtrip (mapToWeekAvailability <-> weekAvailabilityToMap)", () => {
    it("converts from WeekAvailability UI state to PreferredWorkoutTimesMap with multiple days", () => {
      const initialMap = {
        mon: ["06:00-07:30"],
        tue: ["17:30-19:00"],
        thu: ["18:00-19:30"],
        sat: ["09:00-10:30"],
      };

      // Chuyển sang format UI Scheduler
      const uiWeek = mapToWeekAvailability(initialMap);
      expect(uiWeek.mon.enabled).toBe(true);
      expect(uiWeek.tue.enabled).toBe(true);
      expect(uiWeek.wed.enabled).toBe(false);
      expect(uiWeek.thu.enabled).toBe(true);
      expect(uiWeek.sat.enabled).toBe(true);

      // Chuyển ngược lại sang Map để gửi đi
      const convertedBack = weekAvailabilityToMap(uiWeek);
      expect(convertedBack).toStrictEqual(initialMap);

      // Serialize sang Proto payload
      const protoPayload = formatWorkoutTimesToProto(convertedBack);
      expect(protoPayload).toStrictEqual([
        "mon:06:00-07:30",
        "tue:17:30-19:00",
        "thu:18:00-19:30",
        "sat:09:00-10:30",
      ]);
    });
  });

  describe("3. saveOnboardingProfileServerAction Payload Verification", () => {
    it("sends full multi-day schedule to gRPC SaveHealthProfile when provided in form values", async () => {
      mockSaveHealthProfile.mockResolvedValue(
        create(SaveHealthProfileResponseSchema, {
          userId: "usr-test-123",
          completionRate: 100,
          aiCoachActivated: true,
          message: "Profile saved successfully",
        }),
      );

      const { saveOnboardingProfileServerAction } = await import(
        "@/features/onboarding/server/onboarding-actions"
      );

      const customTimesMap = {
        mon: ["06:00-07:30", "17:30-19:00"],
        tue: ["17:30-19:00"],
        wed: ["17:30-19:00"],
        thu: ["17:30-19:00"],
        fri: ["17:30-19:00"],
      };

      const result = await saveOnboardingProfileServerAction({
        ...onboardingDefaults,
        preferredWorkoutTimes: customTimesMap,
      });

      expect(result.success).toBe(true);
      expect(mockSaveHealthProfile).toHaveBeenCalledTimes(1);

      const calledPayload = mockSaveHealthProfile.mock.calls[0][0];
      expect(calledPayload.preferredWorkoutTimes).toStrictEqual([
        "mon:06:00-07:30",
        "mon:17:30-19:00",
        "tue:17:30-19:00",
        "wed:17:30-19:00",
        "thu:17:30-19:00",
        "fri:17:30-19:00",
      ]);
    });

    it("demonstrates why 3 default slots get sent if form values contain empty or default preferredWorkoutTimes", async () => {
      mockSaveHealthProfile.mockResolvedValue(
        create(SaveHealthProfileResponseSchema, {
          userId: "usr-test-123",
          completionRate: 100,
          aiCoachActivated: true,
          message: "Profile saved successfully",
        }),
      );

      const { saveOnboardingProfileServerAction } = await import(
        "@/features/onboarding/server/onboarding-actions"
      );

      // Trường hợp form values bị mất state hoặc rỗng
      await saveOnboardingProfileServerAction({
        ...onboardingDefaults,
        preferredWorkoutTimes: {}, // rỗng do unmount hoặc mất snapshot
      });

      const calledPayload = mockSaveHealthProfile.mock.calls[0][0];
      // Fallback về đúng 3 slot
      expect(calledPayload.preferredWorkoutTimes).toStrictEqual([
        "mon:17:30-19:00",
        "wed:17:30-19:00",
        "fri:17:30-19:00",
      ]);
    });
  });
});
