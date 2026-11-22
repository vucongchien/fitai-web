"use client";

import { onMessage } from "firebase/messaging";
import { useRouter } from "next/navigation";
import { useRef, useSyncExternalStore } from "react";

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

type PushHandler = (title: string, body: string) => void;
const activeHandlers = new Set<PushHandler>();
let listenerInitialized = false;
let lastPushKey = "";
let lastPushAt = 0;

function dispatchPush(title: string, body: string) {
  const key = `${title}|${body}`;
  const now = Date.now();
  if (key === lastPushKey && now - lastPushAt < 1500) {
    return;
  }
  lastPushKey = key;
  lastPushAt = now;

  playNotificationChime();
  toast.info(body ? `${title}: ${body}` : title);
  activeHandlers.forEach((fn) => fn(title, body));
}

function ensureGlobalListeners() {
  if (typeof window === "undefined" || listenerInitialized) return;
  listenerInitialized = true;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
      const msg = event.data as { type?: string; title?: string; body?: string } | undefined;
      if (msg?.type === "FITAI_PUSH") {
        dispatchPush(msg.title ?? "FITAI", msg.body ?? "");
      }
    });
  }

  void getMessagingIfSupported().then((messaging) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? payload.data?.title ?? "FITAI";
      const body = payload.notification?.body ?? payload.data?.body ?? "";
      dispatchPush(title, body);
    });
  });
}

const getSnapshot = () => true;

export function ForegroundPushListener() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  usePushRegistration();

  useSyncExternalStore(
    () => {
      ensureGlobalListeners();
      const handler: PushHandler = () => {
        routerRef.current.refresh();
      };
      activeHandlers.add(handler);
      return () => {
        activeHandlers.delete(handler);
      };
    },
    getSnapshot,
    getSnapshot,
  );

  return null;
}
