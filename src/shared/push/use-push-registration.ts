"use client";

import { getToken } from "firebase/messaging";
import { useCallback, useSyncExternalStore } from "react";

import { getMessagingIfSupported } from "@/shared/push/firebase-app";
import { registerDeviceToken } from "@/shared/push/push-actions";

export interface PushSupport {
  supported: boolean;
  reason: string | null;
}

/**
 * Why push is or is not possible here. Split out from the hook so it is testable
 * without React and so the UI can explain the "add to home screen first" case,
 * which is the only way iOS Safari grants notification permission.
 */
export function pushSupport(): PushSupport {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return { reason: "This browser does not support background notifications.", supported: false };
  }
  if (typeof PushManager === "undefined") {
    return { reason: "This browser does not support push messages.", supported: false };
  }
  if (typeof Notification === "undefined") {
    return { reason: "This browser does not support notifications.", supported: false };
  }
  return { reason: null, supported: true };
}

export type PushStatus = "idle" | "asking" | "granted" | "denied" | "unsupported" | "failed";

/**
 * Mints an FCM registration token and hands it to the backend.
 *
 * Assumes permission is already granted — callers must check first, because
 * getToken() silently returns null rather than prompting.
 */
async function mintAndRegister(): Promise<PushStatus> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) {
    return "unsupported";
  }

  // Register our own SW and hand it to FCM, rather than letting the SDK look
  // For /firebase-messaging-sw.js. One service worker, one push handler.
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  const token = await getToken(messaging, {
    serviceWorkerRegistration: registration,
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  }).catch(() => null);

  if (!token) {
    return "failed";
  }

  // The backend is the thing that decides whether push actually works. Reporting
  // "granted" on a failed handoff would tell the user reminders are on while the
  // Notification service has no token to send to.
  return (await registerDeviceToken(token)) ? "granted" : "failed";
}

class PushRegistrationStore {
  private status: PushStatus = "idle";
  private initialized = false;
  private listeners = new Set<() => void>();

  getSnapshot = (): PushStatus => this.status;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (!this.initialized && typeof window !== "undefined") {
      void this.init();
    }
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private async init() {
    this.initialized = true;
    if (!pushSupport().supported) {
      this.status = "unsupported";
      this.notify();
      return;
    }
    if (Notification.permission === "denied") {
      this.status = "denied";
      this.notify();
      return;
    }
    if (Notification.permission !== "granted") {
      return;
    }

    // Optimistic: permission is granted
    this.status = "granted";
    this.notify();

    const next = await mintAndRegister();
    this.status = next;
    this.notify();
  }

  async enable() {
    if (!pushSupport().supported) {
      this.status = "unsupported";
      this.notify();
      return;
    }
    this.status = "asking";
    this.notify();

    // Must be called from a user gesture — browsers reject a bare prompt.
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      this.status = "denied";
      this.notify();
      return;
    }

    this.status = await mintAndRegister();
    this.notify();
  }
}

const pushStore = new PushRegistrationStore();

export function usePushRegistration() {
  const status = useSyncExternalStore(
    pushStore.subscribe,
    pushStore.getSnapshot,
    () => "idle" as PushStatus,
  );

  const enable = useCallback(async () => {
    await pushStore.enable();
  }, []);

  return { enable, status };
}
