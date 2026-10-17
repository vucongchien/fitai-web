"use client";

import { useState } from "react";

import type { AuthTab } from "@/features/auth/model/auth.types";
import { LoginForm } from "@/features/auth/ui/login-form";
import { RegisterForm } from "@/features/auth/ui/register-form";

const isDev = process.env.NODE_ENV === "development";

export function AuthPanel() {
  const [activeTab, setActiveTab] = useState<AuthTab>("login");

  return (
    <div className="auth-panel">
      <div className="auth-tab-switcher" role="tablist">
        <button
          aria-selected={activeTab === "login"}
          className={`auth-tab-btn ${activeTab === "login" ? "auth-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("login")}
          role="tab"
          type="button"
        >
          Đăng nhập
        </button>
        <button
          aria-selected={activeTab === "register"}
          className={`auth-tab-btn ${activeTab === "register" ? "auth-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("register")}
          role="tab"
          type="button"
        >
          Đăng ký
        </button>
      </div>

      <div className="auth-panel-body">
        {activeTab === "login" ? <LoginForm /> : <RegisterForm />}
      </div>

      {isDev && (
        <div className="auth-dev-panel">
          <span className="auth-dev-label">Chế độ Nhà phát triển (Bypass nhanh):</span>
          <div className="auth-dev-buttons">
            <button
              className="auth-dev-btn"
              onClick={() => window.location.assign("/api/auth/dev-login?target=new")}
              type="button"
            >
              User Mới (/onboarding)
            </button>
            <button
              className="auth-dev-btn"
              onClick={() => window.location.assign("/api/auth/dev-login?target=existing")}
              type="button"
            >
              Hội viên cũ (/home)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
