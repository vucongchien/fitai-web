"use client";

import { CloudOff, ShieldCheck, Timer, WifiOff, X } from "lucide-react";
import type { ReactNode } from "react";

import type { ProtectionNote } from "@/features/workout/model/live-session.types";
import { formatClock } from "@/features/workout/model/use-session-timer";
import { BrandMark } from "@/shared/ui/brand-mark";

/**
 * Frame around the live session: where you are, how far in you are, and the
 * notices that must stay visible (offline, unsynced sets, long session, post-injury
 * protection). The end-session control is always reachable in the top right.
 */
export function SessionShell({
  children,
  durationWarning,
  elapsedSec,
  online,
  pendingSyncCount,
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
  return (
    <div className="live-workout">
      <header className="live-workout__header">
        <BrandMark />
        <div className="live-workout__crumbs">
          <span className="live-workout__phase">{phaseLabel}</span>
          <span className="live-workout__step">{stepLabel}</span>
        </div>
        <span className="live-workout__clock">
          <Timer aria-hidden="true" size={15} />
          {formatClock(elapsedSec)}
        </span>
        <button aria-label="End session" className="workout-close" onClick={onEnd} type="button">
          <X aria-hidden="true" size={20} />
        </button>
      </header>

      <div
        className="workout-progress"
        aria-label={`Session ${Math.round(progress * 100)}% complete`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      {!online ? (
        <div className="network-notice" role="status">
          <WifiOff aria-hidden="true" size={18} />
          You&rsquo;re offline. Sets are kept on this device and sent when you reconnect.
        </div>
      ) : pendingSyncCount > 0 ? (
        <div className="network-notice network-notice--quiet" role="status">
          <CloudOff aria-hidden="true" size={18} />
          {pendingSyncCount} {pendingSyncCount === 1 ? "set" : "sets"} waiting to sync.
        </div>
      ) : null}

      {durationWarning ? (
        <div className="network-notice network-notice--quiet" role="status">
          <Timer aria-hidden="true" size={18} />
          {durationWarning}
        </div>
      ) : null}

      {protectionNote ? (
        <div className="protection-note" role="status">
          <ShieldCheck aria-hidden="true" size={18} />
          <div>
            <strong>{protectionNote.title}</strong>
            <span>{protectionNote.description}</span>
          </div>
        </div>
      ) : null}

      <main className="live-workout__main">{children}</main>
    </div>
  );
}
