import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOtpCountdown } from "@/features/auth/model/use-otp-countdown";

describe("useOtpCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with initialSeconds and canResend false", () => {
    const { result } = renderHook(() => useOtpCountdown(60));
    expect(result.current.remainingSeconds).toBe(60);
    expect(result.current.canResend).toBe(false);
  });

  it("decrements remaining seconds every 1000ms", () => {
    const { result } = renderHook(() => useOtpCountdown(60));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.remainingSeconds).toBe(58);
    expect(result.current.canResend).toBe(false);
  });

  it("stops at 0 and sets canResend to true", () => {
    const { result } = renderHook(() => useOtpCountdown(3));

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.canResend).toBe(true);
  });

  it("restarts timer correctly when restart is called", () => {
    const { result } = renderHook(() => useOtpCountdown(3));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.canResend).toBe(true);

    act(() => {
      result.current.restart(30);
    });

    expect(result.current.remainingSeconds).toBe(30);
    expect(result.current.canResend).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.remainingSeconds).toBe(25);
  });

  it("cleans up timer on unmount without errors", () => {
    const { unmount } = renderHook(() => useOtpCountdown(60));
    unmount();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });
});
