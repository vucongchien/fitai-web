"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

export type ToastType = "info" | "success" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
  durationMs?: number;
  action?: ToastAction;
  exiting?: boolean;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id" | "exiting">) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    sonnerToast.dismiss(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((item: Omit<ToastItem, "id" | "exiting">) => {
    const type = item.type ?? "info";
    const duration = item.durationMs;
    const action = item.action
      ? { label: item.action.label, onClick: item.action.onClick }
      : undefined;

    let id: string | number;
    if (type === "success") {
      id = sonnerToast.success(item.message, { duration, action });
    } else if (type === "error") {
      id = sonnerToast.error(item.message, { duration, action });
    } else {
      id = sonnerToast.info(item.message, { duration, action });
    }

    const toastId = String(id);
    const newToast: ToastItem = { ...item, id: toastId };
    setToasts((prev) => [...prev, newToast]);

    return toastId;
  }, []);

  const value = useMemo(
    () => ({ dismissToast, showToast, toasts }),
    [dismissToast, showToast, toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
