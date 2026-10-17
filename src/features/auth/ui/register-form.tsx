"use client";

import { maskIdentifier } from "@/features/auth/model/auth-validation";
import { useRegisterFlow } from "@/features/auth/model/use-register-flow";
import { OtpInputGroup } from "@/features/auth/ui/otp-input-group";
import { GmailMark } from "@/features/auth/ui/provider-marks";
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
    handleSendOtp,
    handleVerifyOtp,
    handleProfileSubmit,
    resetToIdentifier,
  } = useRegisterFlow();

  return (
    <div className="register-form-container">
      {subStep === "VERIFY_IDENTIFIER" && !isOtpSent && (
        <div className="login-form-header">
          <h2 id="sign-in-title">Create your account</h2>
        </div>
      )}

      {subStep === "VERIFY_IDENTIFIER" && isOtpSent && (
        <div className="login-form-header">
          <h2 id="sign-in-title">
            {identifier.includes("@") ? "Check your email" : "Check your phone"}
          </h2>
          <p className="auth-step-desc">
            Enter the 6-digit code sent to{" "}
            <span className="auth-identifier-badge">
              <strong>{maskIdentifier(identifier)}</strong>
              {identifier.toLowerCase().includes("@") && <GmailMark size={16} />}
            </span>
            {" · "}
            <button
              className="auth-inline-change-btn"
              disabled={isPending}
              onClick={resetToIdentifier}
              type="button"
            >
              Change
            </button>
          </p>
        </div>
      )}

      {subStep === "PROFILE_DETAILS" && (
        <div className="login-form-header">
          <h2 id="sign-in-title">Complete your profile</h2>
        </div>
      )}

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
