"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { detectIdentifierType } from "@/features/auth/model/auth-validation";
import { loginWithPasswordAction } from "@/features/auth/server/auth-actions";
import { openOAuthPopup } from "@/features/auth/ui/login-actions";

export function useLoginFlow(defaultIdentifier: string = "") {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(defaultIdentifier);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const identifierType = detectIdentifierType(identifier);
  const isIdentifierValid = identifierType !== "invalid";

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const idInput = form?.elements?.namedItem("identifier") as HTMLInputElement | null;
    const pwdInput = form?.elements?.namedItem("password") as HTMLInputElement | null;

    const effectiveIdentifier = (idInput?.value || identifier).trim();
    const effectivePassword = pwdInput?.value || password;

    if (!effectiveIdentifier || !effectivePassword) {
      setErrorMessage("Please enter your email or phone number and password.");
      return;
    }
    const idType = detectIdentifierType(effectiveIdentifier);
    if (idType === "invalid") {
      setErrorMessage("Please enter a valid email or 10-digit phone number.");
      return;
    }
    setErrorMessage(null);
    setIsPending(true);
    try {
      const result = await loginWithPasswordAction(effectiveIdentifier, effectivePassword);
      if (result.success) {
        router.push(result.data.redirectUrl);
      } else {
        setErrorMessage(result.error);
      }
    } finally {
      setIsPending(false);
    }
  };

  const triggerOAuth = useCallback((provider: "google" | "facebook") => {
    setIsPending(true);
    setErrorMessage(null);
    const popup = openOAuthPopup(provider);
    if (!popup) {
      setIsPending(false);
      return;
    }

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      clearInterval(pollClosed);
      setIsPending(false);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "OAUTH_COMPLETE") {
        window.removeEventListener("message", onMessage);
        try {
          popup.close();
        } catch {}
        cleanup();
        const dest = typeof event.data.dest === "string" && event.data.dest.startsWith("/")
          ? event.data.dest
          : "/home";
        window.location.assign(dest);
        return;
      }

      if (event.data?.type === "OAUTH_ERROR") {
        window.removeEventListener("message", onMessage);
        try {
          popup.close();
        } catch {}
        cleanup();
        setErrorMessage(event.data.message || "OAuth login failed");
      }
    };

    window.addEventListener("message", onMessage);

    const pollClosed = window.setInterval(() => {
      if (popup.closed) {
        window.removeEventListener("message", onMessage);
        cleanup();
      }
    }, 300);
  }, []);

  const handleGoogleLogin = useCallback(() => {
    triggerOAuth("google");
  }, [triggerOAuth]);

  const handleFacebookLogin = useCallback(() => {
    triggerOAuth("facebook");
  }, [triggerOAuth]);

  return {
    identifier,
    setIdentifier,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    errorMessage,
    setErrorMessage,
    isPending,
    isIdentifierValid,
    handlePasswordSubmit,
    handleGoogleLogin,
    handleFacebookLogin,
  };
}
