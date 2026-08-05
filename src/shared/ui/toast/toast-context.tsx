"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type ToastType = "info" | "success" | "error";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastItem = {
  id: string;
  message: string;
  type?: ToastType;
  durationMs?: number;
  action?: ToastAction;
};

type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = {
        id,
        durationMs: 4000,
        type: "info",
        ...toast,
      };

      setToasts((prev) => [...prev, newToast]);

      if (newToast.durationMs && newToast.durationMs > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, newToast.durationMs);
      }

      return id;
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
