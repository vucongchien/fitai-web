"use client";

import { useLoginFlow } from "@/features/auth/model/use-login-flow";
import { GoogleMark } from "@/features/auth/ui/provider-marks";
import { Button } from "@/shared/ui/button";

export function LoginForm() {
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
  } = useLoginFlow();

  return (
    <div className="login-form-container">
      {errorMessage ? (
        <div className="auth-alert auth-alert--error" role="alert">
          <span>{errorMessage}</span>
        </div>
      ) : null}

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

      <form className="auth-step-password" onSubmit={handlePasswordSubmit}>
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
            placeholder="VD: 0912 345 678 hoặc user@gmail.com"
            type="text"
            value={identifier}
          />
          {identifier && !isIdentifierValid ? (
            <p className="auth-field-hint auth-field-hint--error">
              Định dạng chưa đúng (VD: SĐT 10 số 09... hoặc user@domain.com)
            </p>
          ) : null}
        </div>

        <div className="auth-field">
          <div className="auth-label-row">
            <label className="auth-label" htmlFor="login-password">
              Mật khẩu
            </label>
            <Button
              className="auth-toggle-pwd-btn"
              onClick={() => setShowPassword(!showPassword)}
              size="medium"
              tabIndex={-1}
              type="button"
              variant="quiet"
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </Button>
          </div>
          <input
            id="login-password"
            autoComplete="current-password"
            className="auth-input"
            disabled={isPending}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage(null);
            }}
            placeholder="Nhập mật khẩu của bạn"
            type={showPassword ? "text" : "password"}
            value={password}
          />
        </div>

        <Button
          className="auth-submit-btn"
          disabled={!identifier || !password || !isIdentifierValid || isPending}
          loading={isPending}
          size="large"
          type="submit"
        >
          Đăng nhập
        </Button>
      </form>
    </div>
  );
}
