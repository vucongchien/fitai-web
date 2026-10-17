"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { detectIdentifierType } from "@/features/auth/model/auth-validation";
import { loginWithPasswordAction } from "@/features/auth/server/auth-actions";
import { openOAuthPopup } from "@/features/auth/ui/login-actions";

export function useLoginFlow() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const identifierType = detectIdentifierType(identifier);
  const isIdentifierValid = identifierType !== "invalid";

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage("Please enter your email or phone number and password.");
      return;
    }
    if (!isIdentifierValid) {
      setErrorMessage("Please enter a valid email or 10-digit phone number.");
      return;
    }
    setErrorMessage(null);
    setIsPending(true);
    try {
      const result = await loginWithPasswordAction(identifier, password);
      if (result.success) {
        router.push(result.data.redirectUrl);
      } else {
        setErrorMessage(result.error);
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleGoogleLogin = useCallback(() => {
    openOAuthPopup("google");
  }, []);

  const handleFacebookLogin = useCallback(() => {
    openOAuthPopup("facebook");
  }, []);

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
