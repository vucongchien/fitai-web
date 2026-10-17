"use client";

import { useState } from "react";

import { Button } from "@/shared/ui/button";

interface PasswordLoginSubformProps {
  identifier: string;
  isPending: boolean;
  onIdentifierChange: (val: string) => void;
  onSubmit: (e: React.FormEvent, pwd: string) => void;
  onSwitchToOtp: () => void;
}

export function PasswordLoginSubform({
  identifier,
  isPending,
  onIdentifierChange,
  onSubmit,
  onSwitchToOtp,
}: PasswordLoginSubformProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="auth-step-password" onSubmit={(e) => onSubmit(e, password)}>
      <div className="auth-field">
        <label className="auth-label" htmlFor="password-identifier">
          Số điện thoại hoặc Email
        </label>
        <input
          id="password-identifier"
          autoComplete="username"
          className="auth-input"
          disabled={isPending}
          onChange={(e) => onIdentifierChange(e.target.value)}
          placeholder="VD: 0912 345 678 hoặc user@gmail.com"
          type="text"
          value={identifier}
        />
      </div>

      <div className="auth-field">
        <div className="auth-label-row">
          <label className="auth-label" htmlFor="login-password">
            Mật khẩu
          </label>
          <button
            className="auth-toggle-pwd-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            type="button"
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
        <input
          id="login-password"
          autoComplete="current-password"
          className="auth-input"
          disabled={isPending}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu của bạn"
          type={showPassword ? "text" : "password"}
          value={password}
        />
      </div>

      <Button
        className="auth-submit-btn"
        disabled={!identifier || !password || isPending}
        loading={isPending}
        size="large"
        type="submit"
      >
        Đăng nhập
      </Button>

      <div className="auth-alt-actions">
        <button
          className="auth-link-btn"
          disabled={isPending}
          onClick={onSwitchToOtp}
          type="button"
        >
          Đăng nhập bằng mã OTP
        </button>
      </div>
    </form>
  );
}
