import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useWakeLock } from "@/shared/lib/use-wake-lock";

describe("useWakeLock", () => {
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

  it("returns isSupported = false when wakeLock API is absent", () => {
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: { ...originalNavigator },
      writable: true,
    });

    const { result } = renderHook(() => useWakeLock());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isActive).toBe(false);
  });

  it("requests wake lock and sets isActive = true when supported and enabled", async () => {
    const mockRelease = vi.fn().mockResolvedValue(undefined);
    const mockSentinel = {
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onrelease: null,
      release: mockRelease,
      released: false,
      removeEventListener: vi.fn(),
      type: "screen",
    };

    const mockRequest = vi.fn().mockResolvedValue(mockSentinel);

    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: {
        ...originalNavigator,
        wakeLock: {
          request: mockRequest,
        },
      },
      writable: true,
    });

    const onChange = vi.fn();
    const { result } = renderHook(() => useWakeLock({ enabled: true, onChange }));

    // Wait for effect execution
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockRequest).toHaveBeenCalledWith("screen");
    expect(result.current.isActive).toBe(true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("releases wake lock when unmounting", async () => {
    const mockRelease = vi.fn().mockResolvedValue(undefined);
    const mockSentinel = {
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onrelease: null,
      release: mockRelease,
      released: false,
      removeEventListener: vi.fn(),
      type: "screen",
    };

    const mockRequest = vi.fn().mockResolvedValue(mockSentinel);

    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: {
        ...originalNavigator,
        wakeLock: {
          request: mockRequest,
        },
      },
      writable: true,
    });

    const { unmount } = renderHook(() => useWakeLock({ enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    unmount();

    expect(mockRelease).toHaveBeenCalled();
  });

  it("handles request failure gracefully via onError callback without crashing", async () => {
    const error = new Error("NotAllowedError: Battery low");
    const mockRequest = vi.fn().mockRejectedValue(error);

    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: {
        ...originalNavigator,
        wakeLock: {
          request: mockRequest,
        },
      },
      writable: true,
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useWakeLock({ enabled: true, onError }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isActive).toBe(false);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("releases on visibilitychange hidden and re-requests on visibilitychange visible", async () => {
    const mockRelease = vi.fn().mockResolvedValue(undefined);
    let mockSentinel = {
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onrelease: null,
      release: mockRelease,
      released: false,
      removeEventListener: vi.fn(),
      type: "screen",
    };

    const mockRequest = vi.fn().mockImplementation(() => {
      mockSentinel = { ...mockSentinel, released: false };
      return Promise.resolve(mockSentinel);
    });

    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: {
        ...originalNavigator,
        wakeLock: {
          request: mockRequest,
        },
      },
      writable: true,
    });

    renderHook(() => useWakeLock({ enabled: true }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockRequest).toHaveBeenCalledTimes(1);

    // Simulate tab hidden
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
      writable: true,
    });

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    expect(mockRelease).toHaveBeenCalled();

    // Simulate tab visible again
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
      writable: true,
    });

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    expect(mockRequest).toHaveBeenCalledTimes(2);
  });
});
