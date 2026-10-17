"use client";

import { useState } from "react";

export type AuthTab = "login" | "register";
import { LoginForm } from "@/features/auth/ui/login-form";
import { RegisterForm } from "@/features/auth/ui/register-form";
import { Button } from "@/shared/ui/button";

const isDev = process.env.NODE_ENV === "development";

export function AuthPanel() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");

  return (
    <div className="auth-panel">
      <div className="auth-tab-switcher" role="tablist">
        <Button
          aria-selected={activeTab === "login"}
          className={`auth-tab-btn ${activeTab === "login" ? "auth-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("login")}
          role="tab"
          size="medium"
          type="button"
          variant={activeTab === "login" ? "primary" : "quiet"}
        >
          Đăng nhập
        </Button>
        <Button
          aria-selected={activeTab === "register"}
          className={`auth-tab-btn ${activeTab === "register" ? "auth-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("register")}
          role="tab"
          size="medium"
          type="button"
          variant={activeTab === "register" ? "primary" : "quiet"}
        >
          Đăng ký
        </Button>
      </div>

      <div className="auth-panel-body">
        {activeTab === "login" ? <LoginForm /> : <RegisterForm />}
      </div>

      {isDev && (
        <div className="auth-dev-panel">
          <span className="auth-dev-label">Chế độ Nhà phát triển (Bypass nhanh):</span>
          <div className="auth-dev-buttons">
            <Button
              className="auth-dev-btn"
              onClick={() => window.location.assign("/api/auth/dev-login?target=new")}
              size="medium"
              type="button"
              variant="quiet"
            >
              User Mới (/onboarding)
            </Button>
            <Button
              className="auth-dev-btn"
              onClick={() => window.location.assign("/api/auth/dev-login?target=existing")}
              size="medium"
              type="button"
              variant="quiet"
            >
              Hội viên cũ (/home)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
