import { describe, expect, it } from "vitest";

import {
  clockLabel,
  dayKeyFromCalendarDate,
  dayKeyFromLoggedAt,
  dayKeyFromTimestamp,
  dayKeyRange,
  minutesOfDay,
  weekdayLabel,
} from "@/shared/api/bff/aggregate/day-key";

describe("day-key normalization", () => {
  it("converts google.protobuf.Timestamp to a day key", () => {
    // 2026-08-06T04:00:00Z
    expect(dayKeyFromTimestamp({ seconds: 1785988800 })).toBe("2026-08-06");
  });

  it("accepts bigint seconds from protoc-gen-es", () => {
    expect(dayKeyFromTimestamp({ seconds: 1785988800n })).toBe("2026-08-06");
  });

  it("returns null for a missing timestamp", () => {
    expect(dayKeyFromTimestamp(undefined)).toBeNull();
  });

  it("converts google.type.Date to a day key with zero padding", () => {
    expect(dayKeyFromCalendarDate({ day: 6, month: 8, year: 2026 })).toBe("2026-08-06");
  });

  it("rejects the all-zero proto default rather than inventing a date", () => {
    expect(dayKeyFromCalendarDate({ day: 0, month: 0, year: 0 })).toBeNull();
  });

  it("parses logged_at as ISO", () => {
    expect(dayKeyFromLoggedAt("2026-08-06T07:30:00Z")).toBe("2026-08-06");
  });

  it("falls back to the leading date when logged_at is not a parseable timestamp", () => {
    expect(dayKeyFromLoggedAt("2026-08-06 morning")).toBe("2026-08-06");
  });

  it("returns null for empty logged_at", () => {
    expect(dayKeyFromLoggedAt("")).toBeNull();
    expect(dayKeyFromLoggedAt(undefined)).toBeNull();
  });

  it("orders meals by minutes of day and sorts unparseable values last", () => {
    expect(minutesOfDay("2026-08-06T07:30:00Z")).toBe(450);
    expect(minutesOfDay("nonsense")).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("formats a clock label", () => {
    expect(clockLabel("2026-08-06T07:05:00Z")).toBe("07:05");
    expect(clockLabel("nonsense")).toBeNull();
  });

  it("builds an inclusive trailing range, oldest first", () => {
    expect(dayKeyRange("2026-08-06", 3)).toEqual(["2026-08-04", "2026-08-05", "2026-08-06"]);
  });

  it("crosses a month boundary correctly", () => {
    expect(dayKeyRange("2026-08-02", 3)).toEqual(["2026-07-31", "2026-08-01", "2026-08-02"]);
  });

  it("returns an empty range for a non-positive length", () => {
    expect(dayKeyRange("2026-08-06", 0)).toEqual([]);
  });

  it("labels weekdays", () => {
    expect(weekdayLabel("2026-08-06")).toBe("Thu");
  });
});
