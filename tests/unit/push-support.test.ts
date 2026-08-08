import { afterEach, describe, expect, it, vi } from '@jest/globals';
import { pushSupport } from "@/shared/push/use-push-registration";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(pushSupport, () => {
  it("reports unsupported when the browser has no service worker", () => {
    // Jsdom has no navigator.serviceWorker and no PushManager.
    const result = pushSupport();
    expect(result.supported).toBe(false);
    expect(result.reason).toBe(true);
  });

  it("reports supported when service worker, PushManager and Notification all exist", () => {
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { permission: "default" });
    vi.stubGlobal("navigator", { serviceWorker: {} });
    expect(pushSupport()).toStrictEqual({ reason: null, supported: true });
  });
});
