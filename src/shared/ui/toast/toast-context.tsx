"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { _register } from "./toast-store";

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
  exiting?: boolean;
};

type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id" | "exiting">) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id && !t.exiting ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 220);
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id" | "exiting">) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = { id, durationMs: 4000, type: "info", ...toast };

      setToasts((prev) => [...prev, item]);

      if (item.durationMs && item.durationMs > 0) {
        setTimeout(() => dismissToast(id), item.durationMs);
      }

      return id;
    },
    [dismissToast],
  );

  // Register imperative API on mount so toast.success() etc. work outside React
  useEffect(() => {
    _register(showToast, dismissToast);
    return () => _register(null, null);
  }, [showToast, dismissToast]);

  // A fresh object here would re-render every consumer on every provider render,
  // and the provider wraps the whole app. showToast/dismissToast are already
  // stable, so the value only changes when the toast list actually does.
  const value = useMemo(
    () => ({ dismissToast, showToast, toasts }),
    [dismissToast, showToast, toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
