import {
  dingToast,
  type DingConfigureOptions,
  type DingShowOptions,
  type DingToastType,
  type DingUpdatePatch,
} from "./ding-engine";
import type { ToastAction, ToastType } from "./toast-context";

export interface ToastOpts extends Omit<DingShowOptions, "action"> {
  durationMs?: number;
  action?: ToastAction;
}

function toDingOptions(opts?: ToastOpts): DingShowOptions | undefined {
  if (!opts) return undefined;
  const { durationMs, duration, action, ...rest } = opts;
  return {
    ...rest,
    duration: duration ?? durationMs,
    action: action ? { label: action.label, onClick: action.onClick } : undefined,
  };
}

export { dingToast };

export const toast = {
  show: (message: string, opts?: ToastOpts & { type?: ToastType | DingToastType }): string =>
    dingToast.show(opts?.type ?? "info", message, toDingOptions(opts)),
  info: (message: string, opts?: ToastOpts): string => dingToast.info(message, toDingOptions(opts)),
  success: (message: string, opts?: ToastOpts): string =>
    dingToast.success(message, toDingOptions(opts)),
  error: (message: string, opts?: ToastOpts): string =>
    dingToast.error(message, toDingOptions(opts)),
  warning: (message: string, opts?: ToastOpts): string =>
    dingToast.warning(message, toDingOptions(opts)),
  loading: (message: string, opts?: ToastOpts): string =>
    dingToast.loading(message, toDingOptions(opts)),
  promise: dingToast.promise,
  update: (id: string, patch: DingUpdatePatch) => dingToast.update(id, patch),
  dismiss: (id?: string, opts?: { immediate?: boolean }) => dingToast.dismiss(id, opts),
  configure: (config: DingConfigureOptions) => dingToast.configure(config),
};
