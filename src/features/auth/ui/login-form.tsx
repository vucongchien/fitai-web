"use client";

import { Eye, EyeOff } from "lucide-react";

import { useLoginFlow } from "@/features/auth/model/use-login-flow";
import { FacebookMark, GoogleMark } from "@/features/auth/ui/provider-marks";
import { Button } from "@/shared/ui/button";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const {
    identifier,
    setIdentifier,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    errorMessage,
    setErrorMessage,
    isPending,
    isIdentifierValid,
    handlePasswordSubmit,
    handleGoogleLogin,
    handleFacebookLogin,
  } = useLoginFlow();

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="login-form-container">
      {errorMessage ? (
        <div className="auth-alert auth-alert--error" role="alert">
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="auth-social-stack">
        <Button
          className="login-provider auth-provider-btn"
          disabled={isPending}
          id="login-google"
          onClick={handleGoogleLogin}
          size="large"
          type="button"
          variant="secondary"
        >
          <span aria-hidden="true" className="auth-provider-icon">
            <GoogleMark />
          </span>
          <span>Continue with Google</span>
        </Button>

        <Button
          className="login-provider auth-provider-btn"
          disabled={isPending}
          id="login-facebook"
          onClick={handleFacebookLogin}
          size="large"
          type="button"
          variant="secondary"
        >
          <span aria-hidden="true" className="auth-provider-icon">
            <FacebookMark />
          </span>
          <span>Continue with Facebook</span>
        </Button>
      </div>

      <div className="auth-divider">
        <span className="auth-divider__line" />
        <span className="auth-divider__text">OR</span>
        <span className="auth-divider__line" />
      </div>

      <form className="auth-form-body" onSubmit={handlePasswordSubmit}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-identifier">
            Email or phone
          </label>
          <input
            autoComplete="username"
            className={`auth-input ${identifier && !isIdentifierValid ? "auth-input--invalid" : ""}`}
            disabled={isPending}
            id="login-identifier"
            onChange={(e) => {
              setIdentifier(e.target.value);
              setErrorMessage(null);
            }}
            placeholder="name@example.com or 09..."
            type="text"
            value={identifier}
          />
          {identifier && !isIdentifierValid ? (
            <p className="auth-field-hint auth-field-hint--error">
              Please enter a valid email or 10-digit phone number.
            </p>
          ) : null}
        </div>

        <div className="auth-field">
          <div className="auth-label-row">
            <label className="auth-label" htmlFor="login-password">
              Password
            </label>
            <button
              className="auth-forgot-link"
              onClick={() => alert("Password reset link will be sent to your email or phone.")}
              type="button"
            >
              Forgot password?
            </button>
          </div>
          <div className="auth-input-wrapper">
            <input
              autoComplete="current-password"
              className="auth-input"
              disabled={isPending}
              id="login-password"
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="auth-input-adornment"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="auth-submit-wrapper">
          <Button
            className="auth-submit-btn auth-submit-btn--dark"
            disabled={!identifier || !password || !isIdentifierValid || isPending}
            loading={isPending}
            size="large"
            type="submit"
          >
            Log in
          </Button>
          <span className="auth-last-used-badge">Last used</span>
        </div>

        <div className="auth-switch-footer">
          <span>Don&apos;t have an account?</span>
          <button
            className="auth-switch-link"
            onClick={onSwitchToRegister}
            type="button"
          >
            Create your account
          </button>
        </div>

        {isDev && (
          <div className="auth-dev-strip">
            <span className="auth-dev-label">DEV BYPASS:</span>
            <button
              className="auth-dev-chip"
              onClick={() => window.location.assign("/api/auth/dev-login?target=new")}
              type="button"
            >
              ⚡ New User (/onboarding)
            </button>
            <button
              className="auth-dev-chip"
              onClick={() => window.location.assign("/api/auth/dev-login?target=existing")}
              type="button"
            >
              ⚡ Existing User (/home)
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
