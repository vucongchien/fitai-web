"use client";

import { maskIdentifier } from "@/features/auth/model/auth-validation";
import { useRegisterFlow } from "@/features/auth/model/use-register-flow";
import { OtpInputGroup } from "@/features/auth/ui/otp-input-group";
import { RegisterProfileSubform } from "@/features/auth/ui/register-profile-subform";
import { Button } from "@/shared/ui/button";

export function RegisterForm() {
  const {
    subStep,
    isOtpSent,
    identifier,
    setIdentifier,
    errorMessage,
    setErrorMessage,
    isPending,
    isIdentifierValid,
    mailUrl,
    handleSendOtp,
    handleVerifyOtp,
    handleProfileSubmit,
    resetToIdentifier,
  } = useRegisterFlow();

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
                  <Button
                    className="auth-change-identifier-btn"
                    disabled={isPending}
                    onClick={resetToIdentifier}
                    size="medium"
                    type="button"
                    variant="quiet"
                  >
                    Sửa
                  </Button>
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
                onResend={handleSendOtp}
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
