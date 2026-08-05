"use client";

import { RotateCcw, X } from "lucide-react";

import { useToast } from "./toast-context";

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      aria-live="polite"
      className="global-toast-container"
      role="region"
    >
      {toasts.map((toast) => (
        <div
          className={`custom-undo-toast toast-type--${toast.type ?? "info"}`}
          key={toast.id}
          role="status"
        >
          <div className="custom-undo-toast__content">
            <span>{toast.message}</span>
            {toast.action && (
              <button
                className="custom-undo-toast__btn"
                onClick={() => {
                  toast.action?.onClick();
                  dismissToast(toast.id);
                }}
                type="button"
              >
                <RotateCcw size={14} />
                {toast.action.label}
              </button>
            )}
            <button
              aria-label="Dismiss notification"
              className="toast-dismiss-btn"
              onClick={() => dismissToast(toast.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                padding: "2px",
                marginLeft: "4px",
                display: "inline-flex",
                alignItems: "center",
                opacity: 0.7,
              }}
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
