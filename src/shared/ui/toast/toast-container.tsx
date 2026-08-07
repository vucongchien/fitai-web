"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { useToast } from "./toast-context";

const typeIcon = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <section aria-label="Notifications" aria-live="polite" className="toast-stack">
      {toasts.map((toast) => {
        const type = toast.type ?? "info";
        const Icon = typeIcon[type];

        return (
          <output
            className="toast-item"
            data-exiting={toast.exiting ? "true" : undefined}
            data-type={type}
            key={toast.id}
          >
            <span aria-hidden="true" className={`toast-type-icon toast-type-icon--${type}`}>
              <Icon size={16} />
            </span>

            <span className="toast-message">{toast.message}</span>

            {toast.action && (
              <button
                className="toast-action-btn"
                onClick={() => {
                  toast.action?.onClick();
                  dismissToast(toast.id);
                }}
                type="button"
              >
                {toast.action.label}
              </button>
            )}

            <button
              aria-label="Dismiss"
              className="toast-close-btn"
              onClick={() => dismissToast(toast.id)}
              type="button"
            >
              <X size={14} />
            </button>
          </output>
        );
      })}
    </section>
  );
}
