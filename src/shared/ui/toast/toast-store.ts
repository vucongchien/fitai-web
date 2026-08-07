import { toast as sonnerToast } from "sonner";

import type { ToastAction, ToastType } from "./toast-context";

type ToastOpts = { durationMs?: number; action?: ToastAction };

export const toast = {
  show: (message: string, opts?: ToastOpts & { type?: ToastType }): string => {
    const type = opts?.type ?? "info";
    const duration = opts?.durationMs;
    const action = opts?.action
      ? { label: opts.action.label, onClick: opts.action.onClick }
      : undefined;

    if (type === "success") return String(sonnerToast.success(message, { duration, action }));
    if (type === "error") return String(sonnerToast.error(message, { duration, action }));
    return String(sonnerToast.info(message, { duration, action }));
  },
  info: (message: string, opts?: ToastOpts): string => {
    const action = opts?.action
      ? { label: opts.action.label, onClick: opts.action.onClick }
      : undefined;
    return String(sonnerToast.info(message, { duration: opts?.durationMs, action }));
  },
  success: (message: string, opts?: ToastOpts): string => {
    const action = opts?.action
      ? { label: opts.action.label, onClick: opts.action.onClick }
      : undefined;
    return String(sonnerToast.success(message, { duration: opts?.durationMs, action }));
  },
  error: (message: string, opts?: ToastOpts): string => {
    const action = opts?.action
      ? { label: opts.action.label, onClick: opts.action.onClick }
      : undefined;
    return String(sonnerToast.error(message, { duration: opts?.durationMs, action }));
  },
  dismiss: (id?: string): void => {
    sonnerToast.dismiss(id);
  },
};
