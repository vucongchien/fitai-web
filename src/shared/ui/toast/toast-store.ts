// Imperative toast API — callable outside React components.
// Usage: import { toast } from "@/shared/ui/toast";
//        toast.success("Saved!");
//        toast.error("Network error.", { durationMs: 6000 });
//        toast.info("Removed.", { action: { label: "Undo", onClick: () => restore() } });

import type { ToastAction, ToastType } from "./toast-context";

type ShowFn = (toast: {
  message: string;
  type?: ToastType;
  durationMs?: number;
  action?: ToastAction;
}) => string;
type DismissFn = (id: string) => void;

let showImpl: ShowFn | null = null;
let dismissImpl: DismissFn | null = null;

export function registerToastImpl(show: ShowFn | null, dismiss: DismissFn | null) {
  showImpl = show;
  dismissImpl = dismiss;
}

type ToastOpts = { durationMs?: number; action?: ToastAction };

export const toast = {
  show: (message: string, opts?: ToastOpts & { type?: ToastType }): string =>
    showImpl?.({ message, ...opts }) ?? "",
  info: (message: string, opts?: ToastOpts): string =>
    showImpl?.({ message, type: "info", ...opts }) ?? "",
  success: (message: string, opts?: ToastOpts): string =>
    showImpl?.({ message, type: "success", ...opts }) ?? "",
  error: (message: string, opts?: ToastOpts): string =>
    showImpl?.({ message, type: "error", ...opts }) ?? "",
  dismiss: (id: string): void => {
    dismissImpl?.(id);
  },
};
