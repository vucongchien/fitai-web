"use client";

import { BookOpen, Ear, Eye } from "lucide-react";

/**
 * Watch / Listen / Read.
 *
 * ux-flow-spec §5.3 is explicit that watching and listening are two independent
 * toggles and must not be merged into one "guidance" button. Reading is a sheet,
 * not a toggle — it is a one-off look at the cues.
 */
export function GuideToggles({
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
        <Eye aria-hidden="true" size={18} />
        Watch
      </button>
      <button
        aria-pressed={listening}
        className="guide-toggle"
        data-active={listening || undefined}
        onClick={onToggleListening}
        type="button"
      >
        <Ear aria-hidden="true" size={18} />
        Listen
      </button>
      <button className="guide-toggle" onClick={onOpenInstructions} type="button">
        <BookOpen aria-hidden="true" size={18} />
        Read
      </button>
    </div>
  );
}
