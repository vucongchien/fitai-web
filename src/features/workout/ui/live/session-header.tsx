"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export interface HeaderAction {
  key: string;
  /** Accessible name — icon-only buttons have no visible text. */
  label: string;
  icon: ReactNode;
  active?: boolean;
  /** "alert" marks a safety control so it reads apart from the utilities. */
  tone?: "alert";
  onClick: () => void;
}

export function SessionHeader({
  actions,
  onBack,
  subtitle,
  title,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  actions: HeaderAction[];
}) {
  return (
    <header className="live-screen__header">
      <button aria-label="Back" className="workout-close" onClick={onBack} type="button">
        <ArrowLeft aria-hidden="true" size={20} />
      </button>

      <div className="min-w-0 text-center">
        <h1 className="live-screen__title">{title}</h1>
        {subtitle ? (
          <span className="block font-mono text-[11px] font-semibold text-[var(--color-text-muted)]">
            {subtitle}
          </span>
        ) : null}
      </div>

      {/* Render every action so safety controls are never dropped. */}
      <div className="live-screen__actions">
        {actions.map((action) => (
          <button
            aria-label={action.label}
            aria-pressed={action.active === undefined ? undefined : action.active}
            className="workout-close"
            data-tone={action.tone}
            key={action.key}
            onClick={action.onClick}
            type="button"
          >
            {action.icon}
          </button>
        ))}
      </div>
    </header>
  );
}
