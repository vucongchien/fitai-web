/// <reference lib="webworker" />

/**
 * A tick source that survives a backgrounded tab.
 *
 * useTicker's maths is already drift-proof — every consumer derives from
 * Date.now(), not from a tick count. What a main-thread setInterval cannot do is
 * keep *firing* once the tab is hidden or the phone screen goes off: browsers
 * throttle it to roughly once a minute, so a rest countdown finishes late and the
 * "rest over" transition waits for the user to look at the screen.
 *
 * Timers inside a Dedicated Worker are not throttled the same way, so this posts
 * a bare tick and the hook re-reads the clock on the main thread.
 */

const scope = self as unknown as DedicatedWorkerGlobalScope;

let timer: ReturnType<typeof setInterval> | null = null;

export type TimerRequest = { type: "start"; intervalMs: number } | { type: "stop" };

scope.addEventListener("message", (message: MessageEvent<TimerRequest>) => {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  if (message.data.type === "start") {
    timer = setInterval(() => scope.postMessage({ type: "tick" }), message.data.intervalMs);
  }
});
