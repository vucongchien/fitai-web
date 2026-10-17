"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  detectIdentifierType,
  getEmailProviderUrl,
} from "@/features/auth/model/auth-validation";
import type { Gender, RegisterSubStep } from "@/features/auth/model/auth.types";
import {
  registerAction,
  sendOtpAction,
  verifyOtpAction,
} from "@/features/auth/server/auth-actions";

export function useRegisterFlow() {
  const router = useRouter();
  const [subStep, setSubStep] = useState<RegisterSubStep>("VERIFY_IDENTIFIER");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const identifierType = detectIdentifierType(identifier);
  const isIdentifierValid = identifierType !== "invalid";
  const mailUrl = getEmailProviderUrl(identifier);

  const handleSendOtp = () => {
    if (!isIdentifierValid) {
      setErrorMessage("Vui lòng nhập số điện thoại hoặc email hợp lệ để đăng ký.");
      return;
    }
    setErrorMessage(null);

    startTransition(async () => {
      const result = await sendOtpAction(identifier, "register");
      if (result.success) {
        setOtpToken(result.data.otpToken);
        setIsOtpSent(true);
      } else {
        setErrorMessage(result.error);
      }
    });
  };

  const handleVerifyOtp = (code: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await verifyOtpAction(otpToken, code);
      if (result.success) {
        setSubStep("PROFILE_DETAILS");
      } else {
        setErrorMessage(result.error);
      }
    });
  };

  const handleProfileSubmit = (
    e: React.FormEvent,
    data: {
      fullName: string;
      password: string;
      gender: Gender;
      dateOfBirth: string;
      avatarUrl: string;
    },
  ) => {
    e.preventDefault();
    if (!data.fullName.trim() || !data.password || !data.dateOfBirth) {
      setErrorMessage("Vui lòng điền đầy đủ họ tên, mật khẩu và ngày sinh.");
      return;
    }
    if (data.password.length < 8) {
      setErrorMessage("Mật khẩu phải có tối thiểu 8 ký tự.");
      return;
    }
    setErrorMessage(null);

    startTransition(async () => {
      const result = await registerAction({
        identifier,
        password: data.password,
        fullName: data.fullName.trim(),
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        avatarUrl: data.avatarUrl || undefined,
      });

      if (result.success) {
        router.push(result.data.redirectUrl);
      } else {
        setErrorMessage(result.error);
      }
    });
  };

  const resetToIdentifier = () => {
    setIsOtpSent(false);
    setErrorMessage(null);
  };

  return {
    subStep,
    isOtpSent,
    identifier,
    setIdentifier,
    errorMessage,
    setErrorMessage,
    isPending,
    identifierType,
    isIdentifierValid,
    mailUrl,
    handleSendOtp,
    handleVerifyOtp,
    handleProfileSubmit,
    resetToIdentifier,
  };
}
