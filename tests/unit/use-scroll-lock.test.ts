import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  acquireScrollLock,
  getScrollLockCount,
  releaseScrollLock,
  resetScrollLockForTest,
  useScrollLock,
} from "@/shared/lib/use-scroll-lock";

describe("useScrollLock", () => {
  beforeEach(() => {
    resetScrollLockForTest();
    document.body.style.overflow = "";
  });

  afterEach(() => {
    resetScrollLockForTest();
    document.body.style.overflow = "";
  });

  it("does not modify body overflow when enabled is false", () => {
    renderHook(() => useScrollLock(false));

    expect(document.body.style.overflow).toBe("");
    expect(getScrollLockCount()).toBe(0);
  });

  it("locks body overflow when enabled is true", () => {
    const { unmount } = renderHook(() => useScrollLock(true));

    expect(document.body.style.overflow).toBe("hidden");
    expect(getScrollLockCount()).toBe(1);

    unmount();

    expect(document.body.style.overflow).toBe("");
    expect(getScrollLockCount()).toBe(0);
  });

  it("restores original custom overflow value upon unlock", () => {
    document.body.style.overflow = "scroll";

    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("handles stacked modals with reference counting", () => {
    const hook1 = renderHook(({ open }) => useScrollLock(open), {
      initialProps: { open: true },
    });
    expect(document.body.style.overflow).toBe("hidden");
    expect(getScrollLockCount()).toBe(1);

    const hook2 = renderHook(({ open }) => useScrollLock(open), {
      initialProps: { open: true },
    });
    expect(document.body.style.overflow).toBe("hidden");
    expect(getScrollLockCount()).toBe(2);

    // Closing child modal should NOT unlock body
    act(() => {
      hook2.rerender({ open: false });
    });
    expect(document.body.style.overflow).toBe("hidden");
    expect(getScrollLockCount()).toBe(1);

    // Closing root modal should finally unlock body
    act(() => {
      hook1.rerender({ open: false });
    });
    expect(document.body.style.overflow).toBe("");
    expect(getScrollLockCount()).toBe(0);
  });

  it("prevents negative lock count on extraneous releases", () => {
    releaseScrollLock();
    expect(getScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe("");
  });
});
