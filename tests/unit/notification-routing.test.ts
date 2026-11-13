import { describe, expect, it } from "vitest";

import {
  getNotificationIconType,
  mergeUniqueNotifications,
  resolveNotificationHref,
} from "@/features/notification/model/notification-routing";

describe("resolveNotificationHref", () => {
  it("routes workout reminders to /schedule", () => {
    expect(
      resolveNotificationHref({
        eventType: "contracts.core.coaching.v1.event.UpcomingWorkoutReminder",
      }),
    ).toBe("/schedule");
    expect(
      resolveNotificationHref({
        eventType: "contracts.core.coaching.v1.upcomingWorkoutReminder",
      }),
    ).toBe("/schedule");
  });

  it("routes meal reminders to /nutrition", () => {
    expect(
      resolveNotificationHref({
        eventType: "contracts.core.nutrition.v1.event.UpcomingMealReminder",
      }),
    ).toBe("/nutrition");
  });

  it("routes personal record alerts to /profile", () => {
    expect(
      resolveNotificationHref({
        eventType: "contracts.core.workout_execution.v1.event.NewPersonalRecordAchieved",
      }),
    ).toBe("/profile");
  });

  it("prefers explicit safe internal href/route over eventType", () => {
    expect(
      resolveNotificationHref({
        href: "/profile/badges",
        eventType: "contracts.core.workout_execution.v1.event.NewPersonalRecordAchieved",
      }),
    ).toBe("/profile/badges");
  });

  it("rejects external or protocol-relative URLs to prevent open redirects", () => {
    expect(resolveNotificationHref({ href: "https://evil.com" })).toBeNull();
    expect(resolveNotificationHref({ route: "//evil.com/phish" })).toBeNull();
  });

  it("returns null for unknown or empty data", () => {
    expect(resolveNotificationHref(undefined)).toBeNull();
    expect(resolveNotificationHref({})).toBeNull();
    expect(resolveNotificationHref({ eventType: "unknown.event" })).toBeNull();
  });
});

describe("mergeUniqueNotifications", () => {
  it("appends new items while deduplicating existing IDs in order", () => {
    const existing = [
      { id: "n1", title: "First" },
      { id: "n2", title: "Second" },
    ];
    const incoming = [
      { id: "n2", title: "Duplicate Second" },
      { id: "n3", title: "Third" },
    ];

    expect(mergeUniqueNotifications(existing, incoming)).toEqual([
      { id: "n1", title: "First" },
      { id: "n2", title: "Second" },
      { id: "n3", title: "Third" },
    ]);
  });
});

describe("getNotificationIconType", () => {
  it("detects PR notifications from eventType and title", () => {
    expect(
      getNotificationIconType("Kỷ lục cá nhân mới!", {
        eventType: "contracts.core.workout_execution.v1.event.NewPersonalRecordAchieved",
      }),
    ).toBe("pr");
    expect(getNotificationIconType("New PR achieved!", {})).toBe("pr");
  });

  it("detects coach notifications and falls back to plan", () => {
    expect(getNotificationIconType("Coach note", {})).toBe("coach");
    expect(getNotificationIconType("Nhắc nhở bữa ăn", {})).toBe("plan");
  });
});
