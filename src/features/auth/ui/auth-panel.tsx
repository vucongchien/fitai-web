"use client";

import { Suspense, useState } from "react";

import { LoginForm } from "@/features/auth/ui/login-form";
import { LoginErrorAlert } from "@/features/auth/ui/login-error-alert";
import { RegisterForm } from "@/features/auth/ui/register-form";

export type AuthMode = "login" | "register";

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <div className="auth-panel">
      <div className="login-form-header">
        <h2 id="sign-in-title">
          {mode === "login" ? "Log in" : "Create your account"}
        </h2>
      </div>
      <Suspense fallback={null}>
        <LoginErrorAlert />
      </Suspense>
      {mode === "login" ? (
        <LoginForm onSwitchToRegister={() => setMode("register")} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setMode("login")} />
      )}
    </div>
  );
}

