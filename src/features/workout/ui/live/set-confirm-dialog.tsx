"use client";

import { Check, Clock, Dumbbell, Minus, Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { getFatigueLevel } from "@/features/workout/domain/pose-metrics";
import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { Button } from "@/shared/ui/button";

export interface SetConfirmData {
  actualReps: number;
  actualSeconds: number;
  weightKg: number;
  rpe: number;
}

export function SetConfirmDialog(props: {
  exercise: LiveExercise;
  currentSet: number;
  totalSets: number;
  aiCountedReps?: number;
  secondsElapsed?: number;
  onConfirm: (data: SetConfirmData) => void;
  onClose: () => void;
}) {
  const dialogKey = `${props.exercise.exerciseId}-${props.currentSet}-${props.aiCountedReps ?? 0}-${props.secondsElapsed ?? 0}`;
  return <SetConfirmDialogContent key={dialogKey} {...props} />;
}

function SetConfirmDialogContent({
  exercise,
  currentSet,
  totalSets,
  aiCountedReps = 0,
  secondsElapsed = 0,
  onConfirm,
  onClose,
}: {
  exercise: LiveExercise;
  currentSet: number;
  totalSets: number;
  aiCountedReps?: number;
  secondsElapsed?: number;
  onConfirm: (data: SetConfirmData) => void;
  onClose: () => void;
}) {
  const timed = exercise.durationSeconds > 0;

  const initialReps = aiCountedReps > 0 ? aiCountedReps : exercise.targetReps || 10;
  const initialSeconds = secondsElapsed > 0 ? secondsElapsed : exercise.durationSeconds || 30;
  const initialWeight = exercise.targetWeightKg || 0;

  const [reps, setReps] = useState<number>(initialReps);
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [weightKg, setWeightKg] = useState<number>(initialWeight);
  const [fatiguePercent, setFatiguePercent] = useState<number>(80); // Default 80% fatigue (RPE 8.0)

  const [isClosing, setIsClosing] = useState(false);

  const triggerClose = (action?: () => void) => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      if (action) {
        action();
      } else {
        onClose();
      }
    }, 220);
  };

  const handleConfirm = () => {
    triggerClose(() => {
      onConfirm({
        actualReps: Math.max(1, reps),
        actualSeconds: Math.max(1, seconds),
        weightKg: Math.max(0, weightKg),
        rpe: fatiguePercent / 10,
      });
    });
  };

  return (
    <div
      aria-label="Confirm completed set"
      aria-modal="true"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 cursor-pointer ${isClosing ? "opacity-0 transition-opacity duration-200" : ""}`}
      role="dialog"
      onClick={() => triggerClose()}
    >
      <div
        className="w-full max-w-[440px] p-6 rounded-[var(--radius-hero)] bg-[var(--color-surface)] shadow-[var(--shadow-float,0_20px_25px_-5px_rgba(0,0,0,0.3))] border border-[var(--color-border)] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-action)]">
              Companion · Set {currentSet}/{totalSets}
            </span>
            <h2 className="text-xl font-bold mt-1 text-[var(--color-text)]">
              {exercise.name}
            </h2>
          </div>
          <button
            onClick={() => triggerClose()}
            type="button"
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* AI Badge if AI tracked */}
        {aiCountedReps > 0 && !timed && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)] text-xs font-semibold mb-4">
            <Sparkles size={14} />
            AI counted: {aiCountedReps} reps
          </div>
        )}

        {/* Quantity Controls */}
        <div className="bg-[var(--color-surface-subtle)] rounded-[var(--radius-card)] p-5 mb-4 border border-[var(--color-border)]">
          {!timed ? (
            /* Reps Input */
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell size={18} className="text-[var(--color-action)]" />
                <span className="font-semibold text-sm text-[var(--color-text)]">
                  Actual Completed Reps
                </span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setReps((r) => Math.max(1, r - 1))}
                  className="w-11 h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-[var(--color-surface-subtle)]"
                  aria-label="Decrease reps"
                >
                  <Minus size={18} />
                </button>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value, 10) || 0)}
                  className="w-[90px] h-12 text-2xl font-bold text-center rounded-[var(--radius-input)] border-2 border-[var(--color-action)] bg-[var(--color-surface)] text-[var(--color-text)] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setReps((r) => r + 1)}
                  className="w-11 h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-[var(--color-surface-subtle)]"
                  aria-label="Increase reps"
                >
                  <Plus size={18} />
                </button>
              </div>
              {/* Quick Rep Adjustments */}
              <div className="flex justify-center gap-2 mt-3">
                {[-5, -1, 1, 5].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => setReps((r) => Math.max(1, r + delta))}
                    className="px-3 py-1 rounded-[var(--radius-input)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold cursor-pointer hover:border-[var(--color-action)]"
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Time Input */
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={18} className="text-[var(--color-recovery)]" />
                <span className="font-semibold text-sm text-[var(--color-text)]">
                  Actual Duration (seconds)
                </span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setSeconds((s) => Math.max(1, s - 5))}
                  className="w-11 h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] flex items-center justify-center cursor-pointer hover:bg-[var(--color-surface-subtle)]"
                  aria-label="Decrease seconds"
                >
                  <Minus size={18} />
                </button>
                <input
                  type="number"
                  value={seconds}
                  onChange={(e) => setSeconds(parseInt(e.target.value, 10) || 0)}
                  className="w-[90px] h-12 text-2xl font-bold text-center rounded-[var(--radius-input)] border-2 border-[var(--color-recovery)] bg-[var(--color-surface)] text-[var(--color-text)] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setSeconds((s) => s + 5)}
                  className="w-11 h-11 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] flex items-center justify-center cursor-pointer hover:bg-[var(--color-surface-subtle)]"
                  aria-label="Increase seconds"
                >
                  <Plus size={18} />
                </button>
              </div>
              {/* Quick Seconds Adjustments */}
              <div className="flex justify-center gap-2 mt-3">
                {[-10, -5, 5, 10].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => setSeconds((s) => Math.max(1, s + delta))}
                    className="px-3 py-1 rounded-[var(--radius-input)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold cursor-pointer hover:border-[var(--color-action)]"
                  >
                    {delta > 0 ? `+${delta}s` : `${delta}s`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weight Input */}
        {!timed && (
          <div className="bg-[var(--color-surface-subtle)] rounded-[var(--radius-card)] p-4 mb-4 border border-[var(--color-border)]">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm text-[var(--color-text)]">
                Weight (kg)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeightKg((w) => Math.max(0, parseFloat((w - 1).toFixed(1))))}
                  className="w-8 h-8 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] flex items-center justify-center font-bold cursor-pointer hover:bg-[var(--color-surface-subtle)]"
                  aria-label="Decrease weight"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-[70px] h-9 text-base font-bold text-center rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setWeightKg((w) => parseFloat((w + 1).toFixed(1)))}
                  className="w-8 h-8 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] flex items-center justify-center font-bold cursor-pointer hover:bg-[var(--color-surface-subtle)]"
                  aria-label="Increase weight"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fatigue Level (0% - 100% scale) */}
        {(() => {
          const { color, label } = getFatigueLevel(fatiguePercent);
          return (
            <div className="bg-[var(--color-surface-subtle)] rounded-[var(--radius-card)] p-4 mb-5 border border-[var(--color-border)]">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-semibold text-sm text-[var(--color-text)]">
                  Perceived Exertion
                </span>
                <span className="font-extrabold text-sm font-mono" style={{ color }}>
                  {fatiguePercent}% ({label})
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={fatiguePercent}
                onChange={(e) => setFatiguePercent(parseInt(e.target.value, 10))}
                className="w-full accent-[var(--color-action)] cursor-pointer mb-2.5"
              />

              {/* Quick Presets */}
              <div className="flex justify-between gap-1.5">
                {[
                  { label: "Light (40%)", val: 40 },
                  { label: "Moderate (60%)", val: 60 },
                  { label: "High (80%)", val: 80 },
                  { label: "Max (100%)", val: 100 },
                ].map((p) => {
                  const isActive = fatiguePercent === p.val;
                  return (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setFatiguePercent(p.val)}
                      className={`flex-1 py-1.5 px-0.5 rounded-[var(--radius-input)] text-xs font-semibold cursor-pointer border transition-colors ${
                        isActive
                          ? "border-[var(--color-action)] bg-[var(--color-action-soft)] text-[var(--color-action)] font-bold"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-action)]"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => triggerClose()}
            className="flex-1 h-12 rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-semibold text-sm cursor-pointer hover:bg-[var(--color-surface-subtle)]"
          >
            Retry Set
          </button>
          <Button
            onClick={handleConfirm}
            size="large"
            className="flex-2 h-12 rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] font-bold text-sm flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Confirm & Save Set
          </Button>
        </div>
      </div>
    </div>
  );
}
