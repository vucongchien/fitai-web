"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  detectIdentifierType,
  getEmailProviderUrl,
} from "@/features/auth/model/auth-validation";
import type { LoginSubStep } from "@/features/auth/model/auth.types";
import {
  loginWithPasswordAction,
  sendOtpAction,
  verifyOtpAction,
} from "@/features/auth/server/auth-actions";
import { openOAuthPopup } from "@/features/auth/ui/login-actions";

export function useLoginFlow() {
  const router = useRouter();
  const [subStep, setSubStep] = useState<LoginSubStep>("IDENTIFIER");
  const [identifier, setIdentifier] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const identifierType = detectIdentifierType(identifier);
  const isIdentifierValid = identifierType !== "invalid";
  const mailUrl = getEmailProviderUrl(identifier);

  const handleSendOtp = async (): Promise<boolean> => {
    if (!isIdentifierValid) {
      setErrorMessage("Vui lòng nhập đúng định dạng số điện thoại hoặc email.");
      return false;
    }
    setErrorMessage(null);
    setIsPending(true);
    try {
      const result = await sendOtpAction(identifier, "login");
      if (result.success) {
        setOtpToken(result.data.otpToken);
        setSubStep("OTP");
        return true;
      }
      setErrorMessage(result.error);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setErrorMessage(null);
    setIsPending(true);
    try {
      const result = await verifyOtpAction(otpToken, code);
      if (result.success) {
        router.push("/home");
      } else {
        setErrorMessage(result.error);
      }
    } finally {
      setIsPending(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent, password: string) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage("Vui lòng điền đầy đủ số điện thoại/email và mật khẩu.");
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

  const switchToPassword = () => {
    setSubStep("PASSWORD");
    setErrorMessage(null);
  };

  const switchToIdentifier = () => {
    setSubStep("IDENTIFIER");
    setErrorMessage(null);
  };

  return {
    subStep,
    identifier,
    setIdentifier,
    errorMessage,
    setErrorMessage,
    isPending,
    isIdentifierValid,
    mailUrl,
    handleSendOtp,
    handleVerifyOtp,
    handlePasswordSubmit,
    handleGoogleLogin,
    switchToPassword,
    switchToIdentifier,
  };
}
