"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";

function subscribe() {
  if (typeof document === "undefined") {
    return () => {};
  }
  const handleInvalid = (e: Event) => {
    e.preventDefault();
  };
  document.addEventListener("invalid", handleInvalid, true);
  return () => {
    document.removeEventListener("invalid", handleInvalid, true);
  };
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return true;
}

export function ToastContainer() {
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <Toaster
      closeButton
      position="bottom-right"
      richColors
      toastOptions={{
        className: "fitai-sonner-toast",
      }}
    />
  );
}
