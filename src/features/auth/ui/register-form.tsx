"use client";

import { maskIdentifier } from "@/features/auth/model/auth-validation";
import { useRegisterFlow } from "@/features/auth/model/use-register-flow";
import { OtpInputGroup } from "@/features/auth/ui/otp-input-group";
import { RegisterProfileSubform } from "@/features/auth/ui/register-profile-subform";
import { Button } from "@/shared/ui/button";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
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
                Email or phone
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
                placeholder="name@example.com or 09..."
                type="text"
                value={identifier}
              />
              {identifier && !isIdentifierValid && (
                <p className="auth-field-hint auth-field-hint--error">
                  Please enter a valid email or 10-digit phone number.
                </p>
              )}

              <Button
                className="auth-submit-btn auth-submit-btn--primary"
                disabled={!isIdentifierValid || isPending}
                loading={isPending}
                onClick={handleSendOtp}
                size="large"
                type="button"
              >
                Send verification code
              </Button>

              <div className="auth-switch-footer">
                <span>Already have an account?</span>
                <button
                  className="auth-switch-link"
                  onClick={onSwitchToLogin}
                  type="button"
                >
                  Log in
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-step-otp">
              <div className="auth-step-header">
                <h3 className="auth-step-title">Verify your account</h3>
                <p className="auth-step-desc">
                  Verification code sent to <strong>{maskIdentifier(identifier)}</strong>
                  <Button
                    className="auth-change-identifier-btn"
                    disabled={isPending}
                    onClick={resetToIdentifier}
                    size="medium"
                    type="button"
                    variant="quiet"
                  >
                    Change
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
                    Open email app
                  </a>
                  <span className="auth-shortcut-tip">
                    Be sure to check your Spam folder if you don&apos;t see the code.
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

              <div className="auth-switch-footer">
                <button
                  className="auth-switch-link"
                  onClick={resetToIdentifier}
                  type="button"
                >
                  ← Back to phone / email
                </button>
              </div>
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
