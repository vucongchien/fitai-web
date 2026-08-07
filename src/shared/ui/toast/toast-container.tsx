"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";

export function ToastContainer() {
  useEffect(() => {
    const handleInvalid = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener("invalid", handleInvalid, true);
    return () => {
      document.removeEventListener("invalid", handleInvalid, true);
    };
  }, []);

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
