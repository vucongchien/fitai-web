"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  detectIdentifierType,
  getEmailProviderUrl,
  maskIdentifier,
} from "@/features/auth/model/auth-validation";
import type { Gender, RegisterSubStep } from "@/features/auth/model/auth.types";
import {
  registerAction,
  sendOtpAction,
  verifyOtpAction,
} from "@/features/auth/server/auth-actions";
import { OtpInputGroup } from "@/features/auth/ui/otp-input-group";
import { RegisterProfileSubform } from "@/features/auth/ui/register-profile-subform";
import { Button } from "@/shared/ui/button";

export function RegisterForm() {
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

  return (
    <div className="register-form-container">
      {errorMessage && (
        <div className="auth-alert auth-alert--error" role="alert">
          <span>{errorMessage}</span>
        </div>
      )}

      {subStep === "VERIFY_IDENTIFIER" && (
        <div className="auth-step-register-verify">
          {!isOtpSent ? (
            <div className="auth-field">
              <label className="auth-label" htmlFor="register-identifier">
                Số điện thoại hoặc Email để đăng ký
              </label>
              <input
                id="register-identifier"
                autoComplete="username"
                className={`auth-input ${identifier && !isIdentifierValid ? "auth-input--invalid" : ""}`}
                disabled={isPending}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setErrorMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isIdentifierValid) {
                    handleSendOtp();
                  }
                }}
                placeholder="VD: 0912 345 678 hoặc user@gmail.com"
                type="text"
                value={identifier}
              />
              {identifier && !isIdentifierValid && (
                <p className="auth-field-hint auth-field-hint--error">
                  Định dạng chưa đúng (VD: SĐT 10 số 09... hoặc user@domain.com)
                </p>
              )}

              <Button
                className="auth-submit-btn"
                disabled={!isIdentifierValid || isPending}
                loading={isPending}
                onClick={handleSendOtp}
                size="large"
                type="button"
              >
                Gửi mã xác nhận đăng ký
              </Button>
            </div>
          ) : (
            <div className="auth-step-otp">
              <div className="auth-step-header">
                <h3 className="auth-step-title">Xác minh tài khoản mới</h3>
                <p className="auth-step-desc">
                  Mã xác thực đã gửi tới <strong>{maskIdentifier(identifier)}</strong>
                  <button
                    className="auth-change-identifier-btn"
                    disabled={isPending}
                    onClick={() => {
                      setIsOtpSent(false);
                      setErrorMessage(null);
                    }}
                    type="button"
                  >
                    Sửa
                  </button>
                </p>
              </div>

              {mailUrl && (
                <div className="auth-mail-shortcut">
                  <a
                    className="auth-shortcut-btn"
                    href={mailUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Mở ứng dụng thư điện tử
                  </a>
                  <span className="auth-shortcut-tip">
                    Kiểm tra cả hòm thư Spam nếu chưa thấy mã.
                  </span>
                </div>
              )}

              <OtpInputGroup
                disabled={isPending}
                errorMessage={errorMessage}
                expiresInSeconds={60}
                onComplete={handleVerifyOtp}
                onResend={async () => {
                  const res = await sendOtpAction(identifier, "register");
                  if (res.success) {
                    setOtpToken(res.data.otpToken);
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {subStep === "PROFILE_DETAILS" && (
        <RegisterProfileSubform
          isPending={isPending}
          onSubmit={handleProfileSubmit}
        />
      )}
    </div>
  );
}
