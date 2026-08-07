"use client";

import { Toaster } from "sonner";

export function ToastContainer() {
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
