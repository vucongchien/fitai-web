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

export type PushStatus = "idle" | "asking" | "granted" | "denied" | "unsupported";

export function usePushRegistration() {
  const [status, setStatus] = useState<PushStatus>("idle");

  useEffect(() => {
    if (!pushSupport().supported) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") setStatus("granted");
    if (Notification.permission === "denied") setStatus("denied");
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

    const messaging = await getMessagingIfSupported();
    if (!messaging) {
      setStatus("unsupported");
      return;
    }

    // Register our own SW and hand it to FCM, rather than letting the SDK look
    // for /firebase-messaging-sw.js. One service worker, one push handler.
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    }).catch(() => null);

    if (!token) {
      setStatus("denied");
      return;
    }

    await registerDeviceToken(token);
    setStatus("granted");
  }, []);

  return { enable, status };
}
