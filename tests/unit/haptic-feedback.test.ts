import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  HAPTIC_PATTERNS,
  hapticFeedback,
  isHapticSupported,
  triggerHaptic,
} from "@/shared/lib/haptic-feedback";

describe("hapticFeedback Utility", () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: originalNavigator,
      writable: true,
    });
  });

  it("returns isHapticSupported = false when navigator.vibrate is missing (e.g. iOS Safari)", () => {
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: { ...originalNavigator },
      writable: true,
    });

    expect(isHapticSupported()).toBe(false);
    expect(hapticFeedback.isSupported()).toBe(false);
    expect(triggerHaptic(80)).toBe(false);
  });

  it("returns isHapticSupported = true and calls navigator.vibrate with correct pattern", () => {
    const mockVibrate = vi.fn().mockReturnValue(true);

    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: {
        ...originalNavigator,
        vibrate: mockVibrate,
      },
      writable: true,
    });

    expect(isHapticSupported()).toBe(true);

    hapticFeedback.repSuccess();
    expect(mockVibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.repSuccess);

    hapticFeedback.setComplete();
    expect(mockVibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.setComplete);

    hapticFeedback.formWarning();
    expect(mockVibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.formWarning);

    hapticFeedback.formDanger();
    expect(mockVibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.formDanger);
  });

  it("handles navigator.vibrate exception without crashing", () => {
    const mockVibrate = vi.fn().mockImplementation(() => {
      throw new Error("SecurityError: User interaction required");
    });

    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: {
        ...originalNavigator,
        vibrate: mockVibrate,
      },
      writable: true,
    });

    expect(triggerHaptic(100)).toBe(false);
  });
});
