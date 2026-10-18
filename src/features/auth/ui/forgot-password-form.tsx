"use client";

import { CheckCircle, Eye, EyeOff, Pencil } from "lucide-react";
import { useRef, useState } from "react";

import { useForgotPasswordFlow } from "@/features/auth/model/use-forgot-password-flow";
import { useOtpCountdown } from "@/features/auth/model/use-otp-countdown";
import { OtpInputGroup } from "@/features/auth/ui/otp-input-group";
import { Button } from "@/shared/ui/button";

interface ForgotPasswordFormProps {
  onBackToLogin: (prefillIdentifier?: string) => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const {
    step,
    identifier,
    setIdentifier,
    identifierType,
    isIdentifierValid,
    maskedIdentifier,
    emailProviderUrl,
    errorMessage,
    setErrorMessage,
    isPending,
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
    handleResendOtp,
    goToIdentifierStep,
  } = useForgotPasswordFlow();

  const mailTargetUrl =
    emailProviderUrl ||
    (identifierType === "email" && identifier.includes("@")
      ? `https://${identifier.split("@")[1]?.trim()}`
      : null);

  if (step === "SUCCESS") {
    return (
      <SuccessScreen onBackToLogin={() => onBackToLogin(identifier)} />
    );
  }

  if (step === "VERIFY_OTP") {
    return (
      <div className="auth-otp-screen">
        <div className="auth-otp-header">
          <h2 id="sign-in-title">
            {identifierType === "email" ? "Check your email" : "Check your phone"}
          </h2>
          <p className="auth-step-instruction">
            Enter the 6-digit code sent to
          </p>
          <div className="auth-recipient-center">
            <div className="auth-recipient-row">
              {mailTargetUrl ? (
                <a
                  className="auth-identifier-badge auth-identifier-link"
                  href={mailTargetUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="Open inbox in new tab"
                >
                  <span>{maskedIdentifier}</span>
                </a>
              ) : (
                <span className="auth-identifier-badge">
                  <span>{maskedIdentifier}</span>
                </span>
              )}
              <button
                aria-label="Change phone or email"
                className="auth-inline-change-btn"
                disabled={isPending}
                onClick={goToIdentifierStep}
                title="Change phone or email"
                type="button"
              >
                <Pencil aria-hidden="true" size={13} />
              </button>
            </div>
          </div>
        </div>

        <OtpInputGroup
          disabled={isPending}
          errorMessage={errorMessage}
          expiresInSeconds={60}
          onComplete={handleVerifyOtp}
          onResend={handleResendOtp}
        />

        <div className="auth-otp-footer">
          <button
            className="auth-switch-link"
            onClick={() => onBackToLogin()}
            type="button"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  if (step === "NEW_PASSWORD") {
    return (
      <NewPasswordStep
        errorMessage={errorMessage}
        isPending={isPending}
        onBackToLogin={() => onBackToLogin()}
        onStartOver={goToIdentifierStep}
        onSubmit={handleResetPassword}
        setErrorMessage={setErrorMessage}
      />
    );
  }

  // Step: IDENTIFIER (default)
  return (
    <div className="auth-step-register-verify">
      <div className="login-form-header">
        <h2 id="sign-in-title">Reset password</h2>
      </div>

      {errorMessage && (
        <div className="auth-alert auth-alert--error" role="alert">
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="auth-field">
        <label className="auth-label" htmlFor="forgot-identifier">
          Email or phone
        </label>
        <input
          autoComplete="username"
          className={`auth-input ${identifier && !isIdentifierValid ? "auth-input--invalid" : ""}`}
          disabled={isPending}
          id="forgot-identifier"
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
          <button
            className="auth-switch-link"
            onClick={() => onBackToLogin()}
            type="button"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function NewPasswordStep({
  errorMessage,
  isPending,
  onBackToLogin,
  onStartOver,
  onSubmit,
  setErrorMessage,
}: {
  errorMessage: string | null;
  isPending: boolean;
  onBackToLogin: () => void;
  onStartOver: () => void;
  onSubmit: (newPassword: string, confirmPassword: string) => Promise<void>;
  setErrorMessage: (msg: string | null) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmRef = useRef<HTMLInputElement>(null);

  const isSessionExpired = errorMessage?.toLowerCase().includes("expired");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(newPassword, confirmPassword);
  };

  return (
    <div className="auth-step-register-verify">
      <div className="login-form-header">
        <h2 id="sign-in-title">Set new password</h2>
      </div>

      <p className="auth-step-instruction">
        Create a new password for your account. Must be at least 8 characters.
      </p>

      {errorMessage && (
        <div className="auth-alert auth-alert--error" role="alert">
          <span>{errorMessage}</span>
          {isSessionExpired && (
            <button
              className="auth-switch-link"
              onClick={onStartOver}
              style={{ marginTop: "0.5rem", display: "block" }}
              type="button"
            >
              Start over →
            </button>
          )}
        </div>
      )}

      <form className="auth-form-body" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="new-password">
            New password
          </label>
          <div className="auth-input-wrapper">
            <input
              autoComplete="new-password"
              className="auth-input"
              disabled={isPending}
              id="new-password"
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrorMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmRef.current?.focus();
                }
              }}
              placeholder="••••••••"
              type={showNew ? "text" : "password"}
              value={newPassword}
            />
            <button
              aria-label={showNew ? "Hide password" : "Show password"}
              className="auth-input-adornment"
              onClick={() => setShowNew(!showNew)}
              type="button"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {newPassword && newPassword.length < 8 && (
            <p className="auth-field-hint auth-field-hint--error">
              Password must be at least 8 characters.
            </p>
          )}
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="confirm-password">
            Confirm password
          </label>
          <div className="auth-input-wrapper">
            <input
              ref={confirmRef}
              autoComplete="new-password"
              className="auth-input"
              disabled={isPending}
              id="confirm-password"
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="••••••••"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
            />
            <button
              aria-label={showConfirm ? "Hide password" : "Show password"}
              className="auth-input-adornment"
              onClick={() => setShowConfirm(!showConfirm)}
              type="button"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="auth-field-hint auth-field-hint--error">
              Passwords do not match.
            </p>
          )}
        </div>

        <div className="auth-submit-wrapper">
          <Button
            className="auth-submit-btn auth-submit-btn--primary"
            disabled={isPending || newPassword.length < 8 || !confirmPassword}
            loading={isPending}
            size="large"
            type="submit"
          >
            Reset password
          </Button>
        </div>

        <div className="auth-switch-footer">
          <button
            className="auth-switch-link"
            onClick={onBackToLogin}
            type="button"
          >
            ← Back to login
          </button>
        </div>
      </form>
    </div>
  );
}

function SuccessScreen({
  onBackToLogin,
}: {
  onBackToLogin: () => void;
}) {
  const { remainingSeconds } = useOtpCountdown(3);
  const redirectTriggeredRef = useRef(false);

  if (remainingSeconds === 0 && !redirectTriggeredRef.current) {
    redirectTriggeredRef.current = true;
    queueMicrotask(() => {
      onBackToLogin();
    });
  }

  return (
    <div className="auth-success-screen">
      <div className="auth-success-icon">
        <CheckCircle size={48} strokeWidth={1.5} />
      </div>
      <h2 id="sign-in-title">Password reset successful</h2>
      <p className="auth-step-instruction">
        You can now sign in with your new password.
      </p>
      <p className="auth-success-countdown">
        Redirecting to login in <strong>{remainingSeconds}s</strong>...
      </p>
      <button
        className="auth-switch-link"
        onClick={onBackToLogin}
        type="button"
      >
        Back to login now
      </button>
    </div>
  );
}
