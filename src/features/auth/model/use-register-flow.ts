"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  detectIdentifierType,
  getEmailProviderUrl,
} from "@/features/auth/model/auth-validation";
import { Gender } from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";
export type RegisterSubStep = "VERIFY_IDENTIFIER" | "PROFILE_DETAILS";
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
  const [isPending, setIsPending] = useState(false);

  const identifierType = detectIdentifierType(identifier);
  const isIdentifierValid = identifierType !== "invalid";
  const mailUrl = getEmailProviderUrl(identifier);

  const handleSendOtp = async (): Promise<boolean> => {
    if (!isIdentifierValid) {
      setErrorMessage("Vui lòng nhập số điện thoại hoặc email hợp lệ để đăng ký.");
      return false;
    }
    setErrorMessage(null);
    setIsPending(true);
    try {
      const result = await sendOtpAction(identifier, "register");
      if (result.success) {
        setOtpToken(result.data.otpToken);
        setIsOtpSent(true);
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
        setSubStep("PROFILE_DETAILS");
      } else {
        setErrorMessage(result.error);
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleProfileSubmit = async (
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
    setIsPending(true);
    try {
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
    } finally {
      setIsPending(false);
    }
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
