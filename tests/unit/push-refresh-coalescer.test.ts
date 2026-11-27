import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPushRefreshCoalescer } from "@/shared/push/foreground-push-listener";

describe("createPushRefreshCoalescer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flushes immediately on leading push and coalesces burst pushes into one trailing flush", () => {
    const onFlush = vi.fn();
    const coalescer = createPushRefreshCoalescer(onFlush, 2500);

    coalescer.schedule("post-1");
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenLastCalledWith(["post-1"]);

    for (let i = 0; i < 10; i++) {
      coalescer.schedule(i % 2 === 0 ? "post-2" : "post-3");
    }
    expect(onFlush).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2500);
    expect(onFlush).toHaveBeenCalledTimes(2);
    expect(onFlush).toHaveBeenLastCalledWith(["post-2", "post-3"]);

    vi.advanceTimersByTime(5000);
    expect(onFlush).toHaveBeenCalledTimes(2);

    coalescer.reset();
  });
});
