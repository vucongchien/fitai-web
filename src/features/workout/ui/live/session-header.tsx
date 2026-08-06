"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export type HeaderAction = {
  key: string;
  /** Accessible name — icon-only buttons have no visible text. */
  label: string;
  icon: ReactNode;
  active?: boolean;
  /** "alert" marks a safety control so it reads apart from the utilities. */
  tone?: "alert";
  onClick: () => void;
};

export function SessionHeader({
  actions,
  onBack,
  title,
}: {
  title: string;
  onBack: () => void;
  actions: HeaderAction[];
}) {
  return (
    <header className="live-screen__header">
      <button aria-label="Back" className="workout-close" onClick={onBack} type="button">
        <ArrowLeft aria-hidden="true" size={20} />
      </button>

      <h1 className="live-screen__title">{title}</h1>

      {/* No slice: every action passed here is one the screen decided to offer,
          and silently dropping the fourth would drop the pain control. */}
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
