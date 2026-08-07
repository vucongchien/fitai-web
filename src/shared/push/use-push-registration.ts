"use client";

import { getToken } from "firebase/messaging";
import { useCallback, useEffect, useState } from "react";

import { getMessagingIfSupported } from "@/shared/push/firebase-app";
import { registerDeviceToken } from "@/shared/push/push-actions";

export type PushSupport = { supported: boolean; reason: string | null };

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
  if (!messaging) return "unsupported";

  // Register our own SW and hand it to FCM, rather than letting the SDK look
  // for /firebase-messaging-sw.js. One service worker, one push handler.
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  const token = await getToken(messaging, {
    serviceWorkerRegistration: registration,
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  }).catch(() => null);

  if (!token) return "failed";

  // The backend is the thing that decides whether push actually works. Reporting
  // "granted" on a failed handoff would tell the user reminders are on while the
  // notification service has no token to send to.
  return (await registerDeviceToken(token)) ? "granted" : "failed";
}

export function usePushRegistration() {
  const [status, setStatus] = useState<PushStatus>("idle");

  useEffect(() => {
    if (!pushSupport().supported) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (Notification.permission !== "granted") return;

    // Optimistic: permission is granted, so hide the opt-in immediately rather
    // than flashing a button for the duration of the round trip below.
    setStatus("granted");

    // Permission survives across sessions but the token does not: FCM rotates
    // it, and clearing site data drops it. Without this re-mint the user stays
    // permanently opted in with a token the backend no longer has, and no UI
    // ever appears to fix it. Re-registering an unchanged token is a cheap no-op
    // on the backend side.
    let cancelled = false;
    void (async () => {
      const next = await mintAndRegister();
      if (!cancelled) setStatus(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    if (!pushSupport().supported) {
      setStatus("unsupported");
      return;
    }
    setStatus("asking");

    // Must be called from a user gesture — browsers reject a bare prompt.
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }

    setStatus(await mintAndRegister());
  }, []);

  return { enable, status };
}
