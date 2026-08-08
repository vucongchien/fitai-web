import { it, afterEach, describe, expect, beforeEach } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from '@jest/globals';
import { act, renderHook } from "@testing-library/react";


import {
  elapsedSeconds,
  formatCountdown,
  secondsLeft,
  useTicker,
} from "@/features/workout/model/use-session-timer";

describe(useTicker, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a timestamp immediately, before any tick arrives", () => {
    const { result } = renderHook(() => useTicker(true));
    expect(result.current).toBeTypeOf("number");
    expect(result.current).toBeGreaterThan(0);
  });

  it("advances while active", () => {
    const { result } = renderHook(() => useTicker(true, 500));
    const first = result.current;
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current).toBeGreaterThanOrEqual(first);
  });

  it("does not tick while inactive", () => {
    const { result } = renderHook(() => useTicker(false, 500));
    const first = result.current;
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(first);
  });
});

describe("time helpers are unchanged by the worker move", () => {
  it("secondsLeft never goes negative", () => {
    expect(secondsLeft(1000, 5000)).toBe(0);
    expect(secondsLeft(null, 5000)).toBe(0);
    expect(secondsLeft(5000, 1000)).toBe(4);
  });

  it("elapsedSeconds floors and clamps", () => {
    expect(elapsedSeconds(1000, 4900)).toBe(3);
    expect(elapsedSeconds(5000, 1000)).toBe(0);
  });

  it("formatCountdown pads both fields", () => {
    expect(formatCountdown(65)).toBe("01:05");
    expect(formatCountdown(0)).toBe("00:00");
  });
});
