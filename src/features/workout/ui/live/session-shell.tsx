"use client";

import { ArrowLeft, Bell } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

import type { ProtectionNote } from "@/features/workout/model/live-session.types";
import { toast } from "@/shared/ui/toast";

export function SessionShell({
  children,
  durationWarning,
  elapsedSec: _elapsedSec,
  online,
  pendingSyncCount: _pendingSyncCount,
  phaseLabel,
  progress,
  protectionNote,
  onEnd,
  stepLabel,
}: {
  phaseLabel: string;
  stepLabel: string;
  progress: number;
  elapsedSec: number;
  online: boolean;
  pendingSyncCount: number;
  durationWarning: string | null;
  protectionNote?: ProtectionNote;
  onEnd: () => void;
  children: ReactNode;
}) {
  // Trigger toasts for warnings/notices cleanly without spamming
  useEffect(() => {
    if (!online) {
      toast.info("Offline Mode: You're offline. Sets are saved locally.");
    }
  }, [online]);

  useEffect(() => {
    if (durationWarning) {
      toast.info(`Session Duration: ${durationWarning}`);
    }
  }, [durationWarning]);

  useEffect(() => {
    if (protectionNote) {
      toast.info(`${protectionNote.title}: ${protectionNote.description}`);
    }
  }, [protectionNote]);

  return (
    <div className="live-workout">
      <header className="live-workout__header">
        <button aria-label="Back" className="workout-close" onClick={onEnd} type="button">
          <ArrowLeft aria-hidden="true" size={20} />
        </button>

        <div className="live-workout__crumbs">
          <span className="font-medium text-xs text-[var(--color-text-muted,#50565c)]">
            {phaseLabel} · {stepLabel}
          </span>
        </div>

        <button aria-label="Notifications" className="workout-close" type="button">
          <Bell aria-hidden="true" size={18} />
        </button>
      </header>

      <div
        aria-label={`Session ${Math.round(progress * 100)}% complete`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(progress * 100)}
        className="workout-progress"
        role="progressbar"
      >
        <span
          className="workout-progress__fill"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <main className="live-workout__main">{children}</main>
    </div>
  );
}
