"use client";

import { onMessage } from "firebase/messaging";
import { useSyncExternalStore } from "react";

import { getMessagingIfSupported } from "@/shared/push/firebase-app";
import { usePushRegistration } from "@/shared/push/use-push-registration";
import { toast } from "@/shared/ui/toast";

function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    // Autoplay policy may block sound before user interaction.
  }
}

let foregroundSubscribed = false;

function subscribeForegroundMessages(_onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || foregroundSubscribed) {
    return () => {};
  }
  foregroundSubscribed = true;

  let unsubscribe: (() => void) | undefined;
  let active = true;

  void getMessagingIfSupported().then((messaging) => {
    if (!active || !messaging) return;
    unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? payload.data?.title ?? "FITAI";
      const body = payload.notification?.body ?? payload.data?.body ?? "";
      playNotificationChime();
      toast.info(body ? `${title}: ${body}` : title);
    });
  });

  return () => {
    active = false;
    foregroundSubscribed = false;
    unsubscribe?.();
  };
}

const getSnapshot = () => true;

export function ForegroundPushListener() {
  usePushRegistration();
  useSyncExternalStore(subscribeForegroundMessages, getSnapshot, getSnapshot);
  return null;
}
