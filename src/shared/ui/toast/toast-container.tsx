"use client";

import { useSyncExternalStore } from "react";

import { getToastSnapshot, subscribeToasts, toast, type ToastRecord } from "./toast-store";

const EMPTY_TOASTS: ToastRecord[] = [];

function getServerSnapshot(): ToastRecord[] {
  return EMPTY_TOASTS;
}

const TYPE_STYLES: Record<ToastRecord["type"], string> = {
  info: "border-neutral-200 bg-white text-neutral-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-rose-200 bg-rose-50 text-rose-950",
};

export function ToastContainer() {
  const items = useSyncExternalStore(subscribeToasts, getToastSnapshot, getServerSnapshot);

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 bottom-4 z-[9999] flex max-w-sm flex-col gap-2"
      role="region"
    >
      {items.map((item) => (
        <div
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium shadow-lg ${TYPE_STYLES[item.type]}`}
          data-type={item.type}
          key={item.id}
          role={item.type === "error" ? "alert" : "status"}
        >
          <span>{item.message}</span>
          {item.action ? (
            <button
              className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold underline"
              onClick={() => {
                item.action?.onClick();
                toast.dismiss(item.id);
              }}
              type="button"
            >
              {item.action.label}
            </button>
          ) : null}
          <button
            aria-label="Dismiss notification"
            className="shrink-0 rounded-md px-1 text-xs opacity-60 hover:opacity-100"
            onClick={() => toast.dismiss(item.id)}
            type="button"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
