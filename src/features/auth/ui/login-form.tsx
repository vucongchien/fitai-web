"use client";

import { maskIdentifier } from "@/features/auth/model/auth-validation";
import { useLoginFlow } from "@/features/auth/model/use-login-flow";
import { OtpInputGroup } from "@/features/auth/ui/otp-input-group";
import { PasswordLoginSubform } from "@/features/auth/ui/password-login-subform";
import { GoogleMark } from "@/features/auth/ui/provider-marks";
import { Button } from "@/shared/ui/button";

export function LoginForm() {
  const {
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
  } = useLoginFlow();

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
            variant="secondary"
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
            <Button
              className="auth-link-btn"
              disabled={isPending}
              onClick={switchToPassword}
              size="medium"
              type="button"
              variant="quiet"
            >
              Đăng nhập bằng mật khẩu
            </Button>
          </div>
        </div>
      )}

      {subStep === "OTP" && (
        <div className="auth-step-otp">
          <div className="auth-step-header">
            <h3 className="auth-step-title">Xác thực mã OTP</h3>
            <p className="auth-step-desc">
              Mã xác thực đã gửi tới <strong>{maskIdentifier(identifier)}</strong>
              <Button
                className="auth-change-identifier-btn"
                disabled={isPending}
                onClick={switchToIdentifier}
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

          <div className="auth-alt-actions">
            <Button
              className="auth-link-btn"
              disabled={isPending}
              onClick={switchToIdentifier}
              size="medium"
              type="button"
              variant="quiet"
            >
              Quay lại bước trước
            </Button>
          </div>
        </div>
      )}

      {subStep === "PASSWORD" && (
        <PasswordLoginSubform
          identifier={identifier}
          isPending={isPending}
          onIdentifierChange={setIdentifier}
          onSubmit={handlePasswordSubmit}
          onSwitchToOtp={switchToIdentifier}
        />
      )}
    </div>
  );
}
