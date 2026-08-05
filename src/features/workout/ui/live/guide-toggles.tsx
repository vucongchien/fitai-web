"use client";

import { memo } from "react";
import { BookOpen, Ear, Eye } from "lucide-react";

export const GuideToggles = memo(function GuideToggles({
  listening,
  onOpenInstructions,
  onToggleListening,
  onToggleWatching,
  watching,
}: {
  watching: boolean;
  listening: boolean;
  onToggleWatching: () => void;
  onToggleListening: () => void;
  onOpenInstructions: () => void;
}) {
  return (
    <div className="guide-toggles" role="group" aria-label="Exercise guidance">
      <button
        aria-pressed={watching}
        className="guide-toggle"
        data-active={watching || undefined}
        onClick={onToggleWatching}
        type="button"
      >
        <Eye aria-hidden="true" size={14} />
        <span>Watch</span>
      </button>

      <button
        aria-pressed={listening}
        className="guide-toggle"
        data-active={listening || undefined}
        onClick={onToggleListening}
        type="button"
      >
        <Ear aria-hidden="true" size={14} />
        <span>Listen</span>
      </button>

      <button className="guide-toggle" onClick={onOpenInstructions} type="button">
        <BookOpen aria-hidden="true" size={14} />
        <span>Read</span>
      </button>
    </div>
  );
});
