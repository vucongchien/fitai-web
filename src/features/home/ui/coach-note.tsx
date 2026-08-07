"use client";

import { Sparkles, X } from "lucide-react";
import { useState } from "react";

type CoachNoteProps = {
  message?: string | null;
  type?: "info" | "recovery" | "warning";
};

export function CoachNote({ message, type = "recovery" }: CoachNoteProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!message || dismissed) return null;

  return (
    <output className="coach-note-banner" data-type={type}>
      <span aria-hidden="true" className="coach-note-banner__icon">
        <Sparkles size={18} />
      </span>
      <div className="coach-note-banner__content">
        <strong>AI Coach Note</strong>
        <p>{message}</p>
      </div>
      <button
        aria-label="Dismiss note"
        className="coach-note-banner__close"
        onClick={() => setDismissed(true)}
        type="button"
      >
        <X size={15} />
      </button>
    </output>
  );
}
