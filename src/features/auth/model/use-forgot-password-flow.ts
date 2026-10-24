"use client";

import { useCallback, useState } from "react";

import {
  detectIdentifierType,
  getEmailProviderUrl,
  maskIdentifier,
} from "@/features/auth/model/auth-validation";
import {
  resetPasswordAction,
  sendOtpAction,
  verifyOtpAction,
} from "@/features/auth/server/auth-actions";

export type ForgotPasswordStep = "IDENTIFIER" | "VERIFY_OTP" | "NEW_PASSWORD" | "SUCCESS";

export function useForgotPasswordFlow() {
  const [step, setStep] = useState<ForgotPasswordStep>("IDENTIFIER");
  const [identifier, setIdentifier] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const identifierType = detectIdentifierType(identifier);
  const isIdentifierValid = identifierType !== "invalid";
  const maskedIdentifier = isIdentifierValid ? maskIdentifier(identifier) : "";
  const emailProviderUrl = identifierType === "email" ? getEmailProviderUrl(identifier) : null;

  const handleSendOtp = useCallback(async () => {
    if (!isIdentifierValid) {
      setErrorMessage("Please enter a valid email or phone number.");
      return;
    }
    setErrorMessage(null);
    setIsPending(true);
    try {
      const result = await sendOtpAction(identifier, "reset_password");
      if (result.success) {
        setOtpToken(result.data.otpToken);
      }
      // Anti-enumeration: always advance to OTP step regardless of result.
      // If identifier doesn't exist, backend may return error but we swallow it.
      setStep("VERIFY_OTP");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }, [identifier, isIdentifierValid]);

  const handleVerifyOtp = useCallback(
    async (code: string) => {
      setErrorMessage(null);
      setIsPending(true);
      try {
        const result = await verifyOtpAction(otpToken, code);
        if (result.success && result.data.resetToken) {
          setResetToken(result.data.resetToken);
          setStep("NEW_PASSWORD");
          return;
        }
        setErrorMessage(result.success ? "Verification failed. Please try again." : result.error);
      } finally {
        setIsPending(false);
      }
    },
    [otpToken],
  );

  const handleResetPassword = useCallback(
    async (newPassword: string, confirmPassword: string) => {
      if (newPassword.length < 8) {
        setErrorMessage("Password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
      setErrorMessage(null);
      setIsPending(true);
      try {
        const result = await resetPasswordAction(resetToken, newPassword, confirmPassword);
        if (result.success) {
          setStep("SUCCESS");
          return;
        }
        // If resetToken expired, guide user to start over
        if (
          result.error.toLowerCase().includes("expired") ||
          result.error.toLowerCase().includes("invalid")
        ) {
          setErrorMessage("Reset session has expired. Please start over.");
          return;
        }
        setErrorMessage(result.error);
      } finally {
        setIsPending(false);
      }
    },
    [resetToken],
  );

  const handleResendOtp = useCallback(async () => {
    setErrorMessage(null);
    setIsPending(true);
    try {
      const result = await sendOtpAction(identifier, "reset_password");
      if (result.success) {
        setOtpToken(result.data.otpToken);
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }, [identifier]);

  const goToIdentifierStep = useCallback(() => {
    setStep("IDENTIFIER");
    setErrorMessage(null);
    setOtpToken("");
    setResetToken("");
  }, []);

  const reset = useCallback(() => {
    setStep("IDENTIFIER");
    setIdentifier("");
    setOtpToken("");
    setResetToken("");
    setErrorMessage(null);
    setIsPending(false);
  }, []);

  return {
    step,
    identifier,
    setIdentifier,
    identifierType,
    isIdentifierValid,
    maskedIdentifier,
    emailProviderUrl,
    otpToken,
    errorMessage,
    setErrorMessage,
    isPending,
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
    handleResendOtp,
    goToIdentifierStep,
    reset,
  };
}
