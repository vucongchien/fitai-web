

import {
  applyWeeklyPreset,
  calculateSlotDurationMinutes,
  calculateWeeklyScheduleStats,
  copySlotsToOtherActiveDays,
  formatWorkoutTimesToAgentJson,
  formatWorkoutTimesToProto,
  normalizeDayKey,
  normalizeWorkoutTimes,
  validateTimeSlot,
} from "../../src/features/onboarding/domain/workout-times-normalizer";

describe("workout Times Normalizer & Schedule Engine", () => {
  describe(normalizeDayKey, () => {
    it("recognizes English standard abbreviations", () => {
      expect(normalizeDayKey("mon")).toBe("mon");
      expect(normalizeDayKey("tue")).toBe("tue");
      expect(normalizeDayKey("wed")).toBe("wed");
      expect(normalizeDayKey("thu")).toBe("thu");
      expect(normalizeDayKey("fri")).toBe("fri");
      expect(normalizeDayKey("sat")).toBe("sat");
      expect(normalizeDayKey("sun")).toBe("sun");
    });

    it("recognizes Vietnamese short labels (T2, T3, T4, T5, T6, T7, CN)", () => {
      expect(normalizeDayKey("T2")).toBe("mon");
      expect(normalizeDayKey("t3")).toBe("tue");
      expect(normalizeDayKey("T4")).toBe("wed");
      expect(normalizeDayKey("t5")).toBe("thu");
      expect(normalizeDayKey("T6")).toBe("fri");
      expect(normalizeDayKey("t7")).toBe("sat");
      expect(normalizeDayKey("CN")).toBe("sun");
      expect(normalizeDayKey("Chủ nhật")).toBe("sun");
    });

    it("returns null for invalid inputs", () => {
      expect(normalizeDayKey("")).toBeNull();
      expect(normalizeDayKey("invalid")).toBeNull();
    });
  });

  describe(calculateSlotDurationMinutes, () => {
    it("calculates exact duration for 06:00-07:30 as 90 minutes", () => {
      expect(calculateSlotDurationMinutes("06:00-07:30")).toBe(90);
    });

    it("calculates exact duration for 17:30-19:00 as 90 minutes", () => {
      expect(calculateSlotDurationMinutes("17:30-19:00")).toBe(90);
    });

    it("calculates 18:00-18:45 as 45 minutes", () => {
      expect(calculateSlotDurationMinutes("18:00-18:45")).toBe(45);
    });

    it("handles legacy string like Mon PM with 60 minutes default", () => {
      expect(calculateSlotDurationMinutes("PM")).toBe(60);
      expect(calculateSlotDurationMinutes("AM")).toBe(60);
    });

    it("falls back to default minutes for empty or invalid format", () => {
      expect(calculateSlotDurationMinutes("", 45)).toBe(45);
    });
  });

  describe(validateTimeSlot, () => {
    it("validates valid start and end time", () => {
      const result = validateTimeSlot("06:00", "07:30");
      expect(result.isValid).toBeTruthy();
      expect(result.durationMinutes).toBe(90);
    });

    it("rejects invalid time format", () => {
      const result = validateTimeSlot("invalid", "07:30");
      expect(result.isValid).toBeFalsy();
      expect(result.message).toContain("không hợp lệ");
    });

    it("rejects duration under 20 minutes", () => {
      const result = validateTimeSlot("06:00", "06:10");
      expect(result.isValid).toBeFalsy();
      expect(result.message).toContain("tối thiểu là 20 phút");
    });

    it("rejects duration over 4 hours (240 minutes)", () => {
      const result = validateTimeSlot("06:00", "12:00");
      expect(result.isValid).toBeFalsy();
      expect(result.message).toContain("không nên vượt quá 4 giờ");
    });
  });

  describe(normalizeWorkoutTimes, () => {
    it("parses modern Key-Value map with multiple slots per day", () => {
      const input = {
        mon: ["06:00-07:30", "17:30-19:00"],
        wed: ["06:00-07:30"],
        fri: ["06:00-07:30"],
      };

      const result = normalizeWorkoutTimes(input);
      expect(result.mon).toStrictEqual(["06:00-07:30", "17:30-19:00"]);
      expect(result.wed).toStrictEqual(["06:00-07:30"]);
      expect(result.fri).toStrictEqual(["06:00-07:30"]);
      expect(result.tue).toBeUndefined(); // Rest day
      expect(result.thu).toBeUndefined(); // Rest day
      expect(result.sat).toBeUndefined(); // Rest day
      expect(result.sun).toBeUndefined(); // Rest day
    });

    it("parses normalized string array formatted like day:slot", () => {
      const input = ["mon:06:00-07:30", "mon:17:30-19:00", "fri:18:00-19:30"];
      const result = normalizeWorkoutTimes(input);

      expect(result.mon).toStrictEqual(["06:00-07:30", "17:30-19:00"]);
      expect(result.fri).toStrictEqual(["18:00-19:30"]);
      expect(result.wed).toBeUndefined();
    });

    it("migrates legacy string array like ['Mon PM', 'Wed PM', 'Fri PM']", () => {
      const input = ["Mon PM", "Wed PM", "Fri PM"];
      const result = normalizeWorkoutTimes(input);

      expect(result.mon).toStrictEqual(["17:30-19:00"]);
      expect(result.wed).toStrictEqual(["17:30-19:00"]);
      expect(result.fri).toStrictEqual(["17:30-19:00"]);
    });

    it("handles legacy string array with AM format ['Tue AM', 'Thu AM', 'Sat AM']", () => {
      const input = ["Tue AM", "Thu AM", "Sat AM"];
      const result = normalizeWorkoutTimes(input);

      expect(result.tue).toStrictEqual(["06:00-07:30"]);
      expect(result.thu).toStrictEqual(["06:00-07:30"]);
      expect(result.sat).toStrictEqual(["06:00-07:30"]);
    });

    it("handles JSON stringified object input cleanly", () => {
      const input = [JSON.stringify({ mon: ["06:00-07:30"], wed: ["17:30-19:00"] })];
      const result = normalizeWorkoutTimes(input);

      expect(result.mon).toStrictEqual(["06:00-07:30"]);
      expect(result.wed).toStrictEqual(["17:30-19:00"]);
    });

    it("returns empty object for undefined or null input", () => {
      expect(normalizeWorkoutTimes()).toStrictEqual({});
      expect(normalizeWorkoutTimes(null)).toStrictEqual({});
    });
  });

  describe(formatWorkoutTimesToProto, () => {
    it("serializes map into clean proto array", () => {
      const map = {
        mon: ["06:00-07:30"],
        wed: ["17:30-19:00"],
      };

      const result = formatWorkoutTimesToProto(map);
      expect(result).toStrictEqual(["mon:06:00-07:30", "wed:17:30-19:00"]);
    });

    it("provides safe fallback when schedule is completely empty", () => {
      const result = formatWorkoutTimesToProto({});
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain("mon:17:30-19:00");
    });
  });

  describe(formatWorkoutTimesToAgentJson, () => {
    it("formats map into standard JSON object string for AI Prompt", () => {
      const map = {
        mon: ["06:00-07:30"],
        fri: ["17:30-19:00"],
      };

      const jsonStr = formatWorkoutTimesToAgentJson(map);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.mon).toStrictEqual(["06:00-07:30"]);
      expect(parsed.fri).toStrictEqual(["17:30-19:00"]);
    });
  });

  describe(calculateWeeklyScheduleStats, () => {
    it("calculates active days, rest days, total slots and average duration", () => {
      const map = {
        mon: ["06:00-07:30", "17:30-19:00"], // 2 slots = 180 min
        wed: ["06:00-07:30"], // 1 slot = 90 min
        fri: ["06:00-07:30"], // 1 slot = 90 min
      };

      const stats = calculateWeeklyScheduleStats(map);
      expect(stats.activeDaysCount).toBe(3);
      expect(stats.totalSlotsCount).toBe(4);
      expect(stats.avgDurationMinutes).toBe(90);
      expect(stats.totalHoursPerWeek).toBe(6); // 360 min / 60
      expect(stats.activeDays).toStrictEqual(["mon", "wed", "fri"]);
      expect(stats.restDays).toStrictEqual(["tue", "thu", "sat", "sun"]);
      expect(stats.hasSchedule).toBeTruthy();
    });

    it("returns zero stats when schedule is empty", () => {
      const stats = calculateWeeklyScheduleStats({});
      expect(stats.activeDaysCount).toBe(0);
      expect(stats.totalSlotsCount).toBe(0);
      expect(stats.hasSchedule).toBeFalsy();
      expect(stats.restDays).toHaveLength(7);
    });
  });

  describe(applyWeeklyPreset, () => {
    it("applies MWF_EVENING preset accurately", () => {
      const preset = applyWeeklyPreset("MWF_EVENING");
      expect(preset.mon).toStrictEqual(["17:30-19:00"]);
      expect(preset.wed).toStrictEqual(["17:30-19:00"]);
      expect(preset.fri).toStrictEqual(["17:30-19:00"]);
    });

    it("clears schedule when applying CLEAR preset", () => {
      const preset = applyWeeklyPreset("CLEAR");
      expect(preset).toStrictEqual({});
    });
  });

  describe(copySlotsToOtherActiveDays, () => {
    it("copies slots from source day to all other active days", () => {
      const initial = {
        mon: ["06:00-07:30", "18:00-19:30"],
        wed: ["17:30-19:00"],
        fri: ["12:00-13:00"],
      };

      const updated = copySlotsToOtherActiveDays(initial, "mon");
      expect(updated.mon).toStrictEqual(["06:00-07:30", "18:00-19:30"]);
      expect(updated.wed).toStrictEqual(["06:00-07:30", "18:00-19:30"]);
      expect(updated.fri).toStrictEqual(["06:00-07:30", "18:00-19:30"]);
      expect(updated.tue).toBeUndefined(); // Rest day stays rest day
    });
  });
});
