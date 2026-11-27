"use client";

import { useQueryClient } from "@tanstack/react-query";
import { onMessage } from "firebase/messaging";
import { useRouter } from "next/navigation";
import { useRef, useSyncExternalStore } from "react";

import { resolveNotificationHref } from "@/features/notification/model/notification-routing";
import { markNotificationAsReadAction } from "@/features/notification/server/notification-actions";
import { invalidateCachedThread, socialQueryKeys } from "@/features/social/lib/post-cache";
import { getMessagingIfSupported } from "@/shared/push/firebase-app";
import { usePushRegistration } from "@/shared/push/use-push-registration";
import { notificationBadgeStore } from "@/shared/ui/header-actions";
import { notificationListStore } from "@/shared/ui/side-panel/quick-notifications-pane";
import { toast } from "@/shared/ui/toast";

const CHIME_COOLDOWN_MS = 1500;
const PUSH_REFRESH_THROTTLE_MS = 2500;
let lastChimeAt = 0;

function playNotificationChime() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastChimeAt < CHIME_COOLDOWN_MS) return;
  lastChimeAt = now;
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

type RefreshFlushHandler = (feedItemIds: string[]) => void;

export function createPushRefreshCoalescer(
  onFlush: RefreshFlushHandler,
  windowMs: number = PUSH_REFRESH_THROTTLE_MS,
) {
  let cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  let hasTrailing = false;
  const pendingFeedItemIds = new Set<string>();

  function flushNow() {
    const ids = Array.from(pendingFeedItemIds);
    pendingFeedItemIds.clear();
    hasTrailing = false;
    onFlush(ids);
    cooldownTimer = setTimeout(() => {
      cooldownTimer = null;
      if (hasTrailing) {
        flushNow();
      }
    }, windowMs);
  }

  return {
    schedule(feedItemId?: string) {
      if (feedItemId) {
        pendingFeedItemIds.add(feedItemId);
      }
      if (cooldownTimer === null) {
        flushNow();
      } else {
        hasTrailing = true;
      }
    },
    reset() {
      if (cooldownTimer !== null) {
        clearTimeout(cooldownTimer);
        cooldownTimer = null;
      }
      hasTrailing = false;
      pendingFeedItemIds.clear();
    },
  };
}

const activeHandlers = new Set<RefreshFlushHandler>();
let activeNavigate: ((href: string) => void) | null = null;
let listenerInitialized = false;
let lastPushKey = "";
let lastPushAt = 0;

const pushRefreshCoalescer = createPushRefreshCoalescer((feedItemIds) => {
  void notificationBadgeStore.refresh();
  void notificationListStore.refresh();
  activeHandlers.forEach((fn) => fn(feedItemIds));
});

function navigateFromPushToast(href: string, data?: Record<string, string>) {
  const notificationId = data?.notificationId;
  if (notificationId) {
    notificationListStore.markReadOptimistic(notificationId);
    void markNotificationAsReadAction(notificationId).then(() => notificationBadgeStore.refresh());
  }
  if (activeNavigate) {
    activeNavigate(href);
  } else if (typeof globalThis.window !== "undefined") {
    globalThis.window.location.assign(href);
  }
}

function dispatchPush(title: string, body: string, data?: Record<string, string>) {
  const key = `${title}|${body}`;
  const now = Date.now();
  if (key === lastPushKey && now - lastPushAt < 1500) {
    return;
  }
  lastPushKey = key;
  lastPushAt = now;

  if (data?.feedItemId) {
    invalidateCachedThread(data.feedItemId);
  }

  playNotificationChime();
  const targetHref = resolveNotificationHref(data) ?? "/notifications";
  toast.info(body ? `${title}: ${body}` : title, {
    onClick: () => navigateFromPushToast(targetHref, data),
  });
  pushRefreshCoalescer.schedule(data?.feedItemId);
}

function ensureGlobalListeners() {
  if (typeof window === "undefined" || listenerInitialized) return;
  listenerInitialized = true;

  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.getRegistration("/").then((reg) => reg?.update());
    navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
      const msg = event.data as
        | { type?: string; title?: string; body?: string; data?: Record<string, string> }
        | undefined;
      if (msg?.type === "FITAI_PUSH") {
        dispatchPush(msg.title ?? "FITAI", msg.body ?? "", msg.data);
      }
    });
  }

  void getMessagingIfSupported().then((messaging) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? payload.data?.title ?? "FITAI";
      const body = payload.notification?.body ?? payload.data?.body ?? "";
      dispatchPush(title, body, payload.data);
    });
  });
}

const getSnapshot = () => true;

export function ForegroundPushListener() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const routerRef = useRef(router);
  const queryClientRef = useRef(queryClient);
  routerRef.current = router;
  queryClientRef.current = queryClient;

  usePushRegistration();

  useSyncExternalStore(
    () => {
      ensureGlobalListeners();
      const navigate = (href: string) => routerRef.current.push(href);
      activeNavigate = navigate;
      const handler: RefreshFlushHandler = (feedItemIds) => {
        for (const feedItemId of feedItemIds) {
          void queryClientRef.current.invalidateQueries({
            queryKey: socialQueryKeys.comments(feedItemId),
          });
          void queryClientRef.current.invalidateQueries({
            queryKey: socialQueryKeys.threadBootstrap(feedItemId),
          });
        }
        routerRef.current.refresh();
      };
      activeHandlers.add(handler);
      return () => {
        if (activeNavigate === navigate) {
          activeNavigate = null;
        }
        activeHandlers.delete(handler);
      };
    },
    getSnapshot,
    getSnapshot,
  );

  return null;
}
