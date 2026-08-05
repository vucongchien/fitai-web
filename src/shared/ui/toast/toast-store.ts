// Imperative toast API — callable outside React components.
// Usage: import { toast } from "@/shared/ui/toast";
//        toast.success("Saved!");
//        toast.error("Network error.", { durationMs: 6000 });
//        toast.info("Removed.", { action: { label: "Undo", onClick: () => restore() } });

import type { ToastAction, ToastType } from "./toast-context";

type ShowFn = (toast: { message: string; type?: ToastType; durationMs?: number; action?: ToastAction }) => string;
type DismissFn = (id: string) => void;

let _show: ShowFn | null = null;
let _dismiss: DismissFn | null = null;

export function _register(show: ShowFn | null, dismiss: DismissFn | null) {
  _show = show;
  _dismiss = dismiss;
}

type ToastOpts = { durationMs?: number; action?: ToastAction };

export const toast = {
  show:    (message: string, opts?: ToastOpts & { type?: ToastType }): string =>
             _show?.({ message, ...opts }) ?? "",
  info:    (message: string, opts?: ToastOpts): string =>
             _show?.({ message, type: "info",    ...opts }) ?? "",
  success: (message: string, opts?: ToastOpts): string =>
             _show?.({ message, type: "success", ...opts }) ?? "",
  error:   (message: string, opts?: ToastOpts): string =>
             _show?.({ message, type: "error",   ...opts }) ?? "",
  dismiss: (id: string): void => { _dismiss?.(id); },
};
