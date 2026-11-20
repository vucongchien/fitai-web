import type { ToastAction, ToastType } from "./toast-context";

export interface ToastOpts {
  durationMs?: number;
  action?: ToastAction;
}

export interface ToastRecord {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

const DEFAULT_DURATION_MS = 4000;
let nextId = 1;
let toasts: ToastRecord[] = [];
const timers = new Map<string, ReturnType<typeof globalThis.setTimeout>>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function dismissToast(id?: string): void {
  if (!id) {
    for (const timer of timers.values()) {
      globalThis.clearTimeout(timer);
    }
    timers.clear();
    if (toasts.length === 0) return;
    toasts = [];
    emit();
    return;
  }

  const timer = timers.get(id);
  if (timer !== undefined) {
    globalThis.clearTimeout(timer);
    timers.delete(id);
  }
  const next = toasts.filter((t) => t.id !== id);
  if (next.length !== toasts.length) {
    toasts = next;
    emit();
  }
}

function dispatchToast(type: ToastType, message: string, opts?: ToastOpts): string {
  const id = `toast-${nextId++}`;
  const duration = opts?.durationMs ?? DEFAULT_DURATION_MS;
  toasts = [...toasts, { id, type, message, action: opts?.action }];
  emit();

  if (duration > 0) {
    const timer = globalThis.setTimeout(() => dismissToast(id), duration);
    timers.set(id, timer);
  }

  return id;
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastSnapshot(): ToastRecord[] {
  return toasts;
}

export const toast = {
  show: (message: string, opts?: ToastOpts & { type?: ToastType }): string =>
    dispatchToast(opts?.type ?? "info", message, opts),
  info: (message: string, opts?: ToastOpts): string => dispatchToast("info", message, opts),
  success: (message: string, opts?: ToastOpts): string => dispatchToast("success", message, opts),
  error: (message: string, opts?: ToastOpts): string => dispatchToast("error", message, opts),
  dismiss: dismissToast,
};
