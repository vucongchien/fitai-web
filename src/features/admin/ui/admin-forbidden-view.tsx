"use client";

import { ArrowLeft, KeyRound, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface AdminForbiddenViewProps {
  userName?: string;
  role?: string;
}

export function AdminForbiddenView({ userName, role }: AdminForbiddenViewProps) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full rounded-[var(--radius-hero)] bg-[var(--color-surface)] border border-[var(--color-border)] p-8 shadow-2xl text-center space-y-6">
        {/* Shield Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-danger-soft)] border border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)] text-[var(--color-danger)]">
          <ShieldAlert className="h-10 w-10" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold tracking-widest text-[var(--color-danger)] uppercase bg-[var(--color-danger-soft)] px-3 py-1 rounded-full border border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)]">
            403 Forbidden
          </span>
          <h1 className="text-2xl font-black font-display tracking-tight text-[var(--color-text)] pt-2">
            Access Denied
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Administrative privileges are required to access the FITAI Control Plane and Exercise
            Management Console.
          </p>
        </div>

        {/* Current Identity Banner */}
        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] p-4 text-left space-y-1.5">
          <div className="text-[11px] font-medium text-[var(--color-text-muted)]">Current Session:</div>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[var(--color-text)] truncate">{userName || "Athlete User"}</span>
            <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] font-mono text-[10px]">
              Role: {role || "USER"}
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-recovery)] pt-1">
            ✓ Your workout and training session remains active and safe.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/home"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:opacity-90 text-[var(--color-action-contrast)] font-bold text-xs transition-all shadow-md shadow-[var(--color-action-soft)] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Athlete Dashboard</span>
          </Link>

          <Link
            href="/login?redirect=/admin"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold text-xs transition-all cursor-pointer"
          >
            <KeyRound className="h-4 w-4" />
            <span>Switch to Admin Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
