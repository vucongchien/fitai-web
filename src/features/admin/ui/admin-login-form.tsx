"use client";

import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { adminLoginAction } from "@/features/auth/server/auth-actions";

interface AdminLoginFormProps {
  redirectTo?: string;
}

export function AdminLoginForm({ redirectTo }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter your admin email and password.");
      return;
    }

    setErrorMessage(null);
    setIsPending(true);
    try {
      const result = await adminLoginAction(trimmedEmail, password, redirectTo);
      if (result.success) {
        router.push(result.data.redirectUrl);
        router.refresh();
      } else {
        setErrorMessage(result.error);
      }
    } catch {
      setErrorMessage("Unexpected error occurred while signing in. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)] flex items-center justify-center p-6 font-sans antialiased selection:bg-[var(--color-action-soft)]">
      <div className="max-w-md w-full rounded-[var(--radius-hero)] bg-[var(--color-surface)] border border-[var(--color-border)] p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex size-14 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-action)] text-[var(--color-action-contrast)] shadow-md shadow-[var(--color-action-soft)]">
            <ShieldCheck className="size-7" />
          </div>
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-bold tracking-widest text-[var(--color-action)] uppercase bg-[var(--color-action-soft)] px-3 py-1 rounded-full border border-[color-mix(in_srgb,var(--color-action)_25%,transparent)]">
              Control Panel
            </span>
            <h1 className="text-2xl font-black font-display tracking-tight text-[var(--color-text)] pt-1">
              FITAI Admin Sign In
            </h1>
            <p className="text-xs text-[var(--color-text-muted)]">
              Sign in with an administrator account to access the management console.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage ? (
          <div
            className="rounded-[var(--radius-input)] bg-[var(--color-danger-soft)] border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)] px-4 py-3 text-xs font-medium text-[var(--color-danger)]"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              className="block text-xs font-semibold text-[var(--color-text)]"
              htmlFor="admin-email"
            >
              Admin email
            </label>
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--color-text-muted)]"
              />
              <input
                autoComplete="username"
                autoFocus
                className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-action)] focus:outline-none disabled:opacity-60"
                disabled={isPending}
                id="admin-email"
                name="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="admin@fitai.local"
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className="block text-xs font-semibold text-[var(--color-text)]"
              htmlFor="admin-password"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--color-text-muted)]"
              />
              <input
                autoComplete="current-password"
                className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] pl-10 pr-10 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-action)] focus:outline-none disabled:opacity-60"
                disabled={isPending}
                id="admin-password"
                name="password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="••••••••"
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
                type="button"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            className="w-full rounded-[var(--radius-input)] bg-[var(--color-action)] hover:opacity-90 disabled:opacity-60 text-[var(--color-action-contrast)] font-bold text-sm py-3 px-4 transition-all shadow-md shadow-[var(--color-action-soft)] cursor-pointer"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Signing in..." : "Sign in to Admin Panel"}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <Link
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            href="/login"
          >
            <ArrowLeft className="size-3.5" />
            <span>Athlete Login</span>
          </Link>
          <span>Restricted access</span>
        </div>
      </div>
    </div>
  );
}
