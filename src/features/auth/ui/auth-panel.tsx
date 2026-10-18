"use client";

import { Suspense, useCallback, useState } from "react";

import { ForgotPasswordForm } from "@/features/auth/ui/forgot-password-form";
import { LoginForm } from "@/features/auth/ui/login-form";
import { LoginErrorAlert } from "@/features/auth/ui/login-error-alert";
import { RegisterForm } from "@/features/auth/ui/register-form";

export type AuthMode = "login" | "register" | "forgot-password";

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [prefillIdentifier, setPrefillIdentifier] = useState("");

  const handleResetSuccess = useCallback((identifier?: string) => {
    if (identifier) {
      setPrefillIdentifier(identifier);
    }
    setMode("login");
  }, []);

  return (
    <div className="auth-panel">
      <Suspense fallback={null}>
        <LoginErrorAlert />
      </Suspense>
      {mode === "login" && (
        <LoginForm
          defaultIdentifier={prefillIdentifier}
          onForgotPassword={() => setMode("forgot-password")}
          onSwitchToRegister={() => setMode("register")}
        />
      )}
      {mode === "register" && (
        <RegisterForm onSwitchToLogin={() => setMode("login")} />
      )}
      {mode === "forgot-password" && (
        <ForgotPasswordForm onBackToLogin={handleResetSuccess} />
      )}
    </div>
  );
}

