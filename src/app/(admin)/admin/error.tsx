"use client";

import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="p-6 md:p-8 max-w-2xl mx-auto space-y-6"
      ref={(node) => {
        if (node) {
          console.error("[Admin Error Boundary]", {
            message: error.message,
            digest: error.digest,
          });
        }
      }}
    >
      <div className="rounded-[var(--radius-hero)] bg-[var(--color-surface)] border border-[var(--color-border)] p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-danger-soft)] border border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)] text-[var(--color-danger)] shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display text-[var(--color-text)]">
              Admin Workspace Error
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              An unexpected failure occurred while loading this administrative section.
            </p>
          </div>
        </div>

        {/* Error Detail */}
        <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--color-text)]">Diagnostic Information</span>
            {error.digest && (
              <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                Digest: {error.digest}
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-[var(--color-danger)] break-all bg-[var(--color-canvas)] p-2.5 rounded-[var(--radius-input)] border border-[var(--color-border)]">
            {error.message || "Unknown error encountered in Admin Console."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:opacity-90 text-[var(--color-action-contrast)] font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/admin/exercises"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)] hover:bg-[var(--color-border)] text-[var(--color-text)] font-semibold text-xs transition-all border border-[var(--color-border)] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
