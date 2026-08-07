import { afterEach, describe, expect, it, vi } from "vitest";

import { pushSupport } from "@/shared/push/use-push-registration";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pushSupport", () => {
  it("reports unsupported when the browser has no service worker", () => {
    // jsdom has no navigator.serviceWorker and no PushManager.
    const result = pushSupport();
    expect(result.supported).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it("reports supported when service worker, PushManager and Notification all exist", () => {
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { permission: "default" });
    vi.stubGlobal("navigator", { serviceWorker: {} });
    expect(pushSupport()).toEqual({ reason: null, supported: true });
  });
});
