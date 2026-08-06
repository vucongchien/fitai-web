"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export type HeaderAction = {
  key: string;
  /** Accessible name — icon-only buttons have no visible text. */
  label: string;
  icon: ReactNode;
  active?: boolean;
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

      <div className="live-screen__actions">
        {actions.slice(0, 3).map((action) => (
          <button
            aria-label={action.label}
            aria-pressed={action.active === undefined ? undefined : action.active}
            className="workout-close"
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
