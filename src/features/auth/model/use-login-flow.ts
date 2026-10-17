"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

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
  const [isPending, startTransition] = useTransition();

  const identifierType = detectIdentifierType(identifier);
  const isIdentifierValid = identifierType !== "invalid";
  const mailUrl = getEmailProviderUrl(identifier);

  const handleSendOtp = async (): Promise<boolean> => {
    if (!isIdentifierValid) {
      setErrorMessage("Vui lòng nhập đúng định dạng số điện thoại hoặc email.");
      return false;
    }
    setErrorMessage(null);

    let ok = false;
    await new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          const result = await sendOtpAction(identifier, "login");
          if (result.success) {
            setOtpToken(result.data.otpToken);
            setSubStep("OTP");
            ok = true;
          } else {
            setErrorMessage(result.error);
            ok = false;
          }
        } finally {
          resolve();
        }
      });
    });
    return ok;
  };

  const handleVerifyOtp = (code: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await verifyOtpAction(otpToken, code);
      if (result.success) {
        router.push("/home");
      } else {
        setErrorMessage(result.error);
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent, password: string) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage("Vui lòng điền đầy đủ số điện thoại/email và mật khẩu.");
      return;
    }
    setErrorMessage(null);

    startTransition(async () => {
      const result = await loginWithPasswordAction(identifier, password);
      if (result.success) {
        router.push(result.data.redirectUrl);
      } else {
        setErrorMessage(result.error);
      }
    });
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
