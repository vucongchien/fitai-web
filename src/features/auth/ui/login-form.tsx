"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import {
  detectIdentifierType,
  getEmailProviderUrl,
  maskIdentifier,
} from "@/features/auth/model/auth-validation";
import type { LoginSubStep } from "@/features/auth/model/auth.types";
import {
  loginWithPasswordAction,
  sendOtpAction,
  verifyOtpAction,
} from "@/features/auth/server/auth-actions";
import { openOAuthPopup } from "@/features/auth/ui/login-actions";
import { OtpInputGroup } from "@/features/auth/ui/otp-input-group";
import { PasswordLoginSubform } from "@/features/auth/ui/password-login-subform";
import { GoogleMark } from "@/features/auth/ui/provider-marks";
import { Button } from "@/shared/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [subStep, setSubStep] = useState<LoginSubStep>("IDENTIFIER");
  const [identifier, setIdentifier] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const identifierType = detectIdentifierType(identifier);
  const isIdentifierValid = identifierType !== "invalid";
  const mailUrl = getEmailProviderUrl(identifier);

  const handleSendOtp = () => {
    if (!isIdentifierValid) {
      setErrorMessage("Vui lòng nhập đúng định dạng số điện thoại hoặc email.");
      return;
    }
    setErrorMessage(null);

    startTransition(async () => {
      const result = await sendOtpAction(identifier, "login");
      if (result.success) {
        setOtpToken(result.data.otpToken);
        setSubStep("OTP");
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

  return (
    <div className="login-form-container">
      {errorMessage && (
        <div className="auth-alert auth-alert--error" role="alert">
          <span>{errorMessage}</span>
        </div>
      )}

      {subStep === "IDENTIFIER" && (
        <div className="auth-step-identifier">
          <Button
            className="login-provider login-provider--google"
            disabled={isPending}
            onClick={handleGoogleLogin}
            size="large"
            type="button"
          >
            <span aria-hidden="true" className="login-provider__mark">
              <GoogleMark />
            </span>
            <span>Tiếp tục với Google</span>
          </Button>

          <div className="auth-divider">
            <span className="auth-divider__line" />
            <span className="auth-divider__text">hoặc tiếp tục với</span>
            <span className="auth-divider__line" />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-identifier">
              Số điện thoại hoặc Email
            </label>
            <input
              id="login-identifier"
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
          </div>

          <Button
            className="auth-submit-btn"
            disabled={!isIdentifierValid || isPending}
            loading={isPending}
            onClick={handleSendOtp}
            size="large"
            type="button"
          >
            Nhận mã OTP
          </Button>

          <div className="auth-alt-actions">
            <button
              className="auth-link-btn"
              disabled={isPending}
              onClick={() => {
                setSubStep("PASSWORD");
                setErrorMessage(null);
              }}
              type="button"
            >
              Đăng nhập bằng mật khẩu
            </button>
          </div>
        </div>
      )}

      {subStep === "OTP" && (
        <div className="auth-step-otp">
          <div className="auth-step-header">
            <h3 className="auth-step-title">Xác thực mã OTP</h3>
            <p className="auth-step-desc">
              Mã xác thực đã gửi tới <strong>{maskIdentifier(identifier)}</strong>
              <button
                className="auth-change-identifier-btn"
                disabled={isPending}
                onClick={() => {
                  setSubStep("IDENTIFIER");
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
              const res = await sendOtpAction(identifier, "login");
              if (res.success) {
                setOtpToken(res.data.otpToken);
              }
            }}
          />

          <div className="auth-alt-actions">
            <button
              className="auth-link-btn"
              disabled={isPending}
              onClick={() => {
                setSubStep("IDENTIFIER");
                setErrorMessage(null);
              }}
              type="button"
            >
              Quay lại bước trước
            </button>
          </div>
        </div>
      )}

      {subStep === "PASSWORD" && (
        <PasswordLoginSubform
          identifier={identifier}
          isPending={isPending}
          onIdentifierChange={setIdentifier}
          onSubmit={handlePasswordSubmit}
          onSwitchToOtp={() => {
            setSubStep("IDENTIFIER");
            setErrorMessage(null);
          }}
        />
      )}
    </div>
  );
}
