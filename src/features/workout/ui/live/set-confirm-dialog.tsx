"use client";

import { Check, Clock, Dumbbell, Minus, Plus, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { getFatigueLevel } from "@/features/workout/domain/pose-metrics";
import { Button } from "@/shared/ui/button";

export interface SetConfirmData {
  actualReps: number;
  actualSeconds: number;
  weightKg: number;
  rpe: number;
}

export function SetConfirmDialog({
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

  // Initial values:
  // Reps: AI counted if > 0, otherwise targetReps (or default 10)
  // Seconds: elapsed seconds if > 0, otherwise target durationSeconds
  const initialReps = aiCountedReps > 0 ? aiCountedReps : exercise.targetReps || 10;
  const initialSeconds = secondsElapsed > 0 ? secondsElapsed : exercise.durationSeconds || 30;
  const initialWeight = exercise.targetWeightKg || 0;

  const [reps, setReps] = useState<number>(initialReps);
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [weightKg, setWeightKg] = useState<number>(initialWeight);
  const [fatiguePercent, setFatiguePercent] = useState<number>(80); // Default 80% fatigue (RPE 8.0)

  useEffect(() => {
    setReps(initialReps);
    setSeconds(initialSeconds);
    setWeightKg(initialWeight);
  }, [initialReps, initialSeconds, initialWeight]);

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
      className={`live-sheet live-sheet--dialog ${isClosing ? "live-sheet--closing" : ""}`}
      role="dialog"
      onClick={() => triggerClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        padding: "16px",
        cursor: "pointer",
      }}
    >
      <div
        className="end-dialog set-confirm-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "440px", width: "100%", padding: "24px", background: "var(--color-surface)", borderRadius: "20px", boxShadow: "var(--shadow-float, 0 20px 25px -5px rgba(0, 0, 0, 0.3))", cursor: "default" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-action)",
              }}
            >
              Companion · Set {currentSet}/{totalSets}
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "4px 0 0 0", color: "var(--color-text)" }}>{exercise.name}</h2>
          </div>
          <button
            onClick={() => triggerClose()}
            type="button"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--color-text-muted)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* AI Badge if AI tracked */}
        {aiCountedReps > 0 && !timed && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "20px",
              background: "var(--color-action-soft)",
              color: "var(--color-action)",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            <Sparkles size={14} />
            AI counted: {aiCountedReps} reps
          </div>
        )}

        {/* Quantity Controls */}
        <div style={{ background: "var(--color-surface-subtle)", borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
          {!timed ? (
            /* Reps Input */
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Dumbbell size={18} style={{ color: "var(--color-action)" }} />
                <span style={{ fontWeight: 600, fontSize: "15px", color: "var(--color-text)" }}>Actual Completed Reps</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
                <button
                  type="button"
                  onClick={() => setReps((r) => Math.max(1, r - 1))}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Minus size={18} />
                </button>
                <input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value, 10) || 0)}
                  style={{
                    width: "90px",
                    height: "48px",
                    fontSize: "26px",
                    fontWeight: 800,
                    textAlign: "center",
                    borderRadius: "12px",
                    border: "2px solid var(--color-action)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setReps((r) => r + 1)}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>
              {/* Quick Rep Adjustments */}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px" }}>
                {[-5, -1, 1, 5].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => setReps((r) => Math.max(1, r + delta))}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "8px",
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Time Input */
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Clock size={18} style={{ color: "var(--color-recovery)" }} />
                <span style={{ fontWeight: 600, fontSize: "15px", color: "var(--color-text)" }}>Actual Duration (seconds)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
                <button
                  type="button"
                  onClick={() => setSeconds((s) => Math.max(1, s - 5))}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Minus size={18} />
                </button>
                <input
                  type="number"
                  value={seconds}
                  onChange={(e) => setSeconds(parseInt(e.target.value, 10) || 0)}
                  style={{
                    width: "90px",
                    height: "48px",
                    fontSize: "26px",
                    fontWeight: 800,
                    textAlign: "center",
                    borderRadius: "12px",
                    border: "2px solid var(--color-recovery)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSeconds((s) => s + 5)}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>
              {/* Quick Seconds Adjustments */}
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px" }}>
                {[-10, -5, 5, 10].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => setSeconds((s) => Math.max(1, s + delta))}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "8px",
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {delta > 0 ? `+${delta}s` : `${delta}s`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Optional Weight Input if Weighted */}
        {(exercise.isWeighted || exercise.targetWeightKg > 0) && (
          <div
            style={{
              background: "var(--color-surface-subtle)",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--color-text)" }}>Weight (kg)</span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setWeightKg((w) => Math.max(0, parseFloat((w - 1).toFixed(1))))}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    cursor: "pointer",
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  style={{
                    width: "70px",
                    height: "36px",
                    fontSize: "16px",
                    fontWeight: 700,
                    textAlign: "center",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setWeightKg((w) => parseFloat((w + 1).toFixed(1)))}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    cursor: "pointer",
                  }}
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
            <div
              style={{
                background: "var(--color-surface-subtle)",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "20px",
                border: "1px solid var(--color-border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--color-text)" }}>
                  Perceived Exertion
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "15px",
                    color,
                  }}
                >
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
                style={{
                  width: "100%",
                  accentColor: "var(--color-action)",
                  cursor: "pointer",
                  marginBottom: "10px",
                }}
              />

              {/* Quick Presets */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}>
                {[
                  { label: "Light (40%)", val: 40 },
                  { label: "Moderate (60%)", val: 60 },
                  { label: "High (80%)", val: 80 },
                  { label: "Max (100%)", val: 100 },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setFatiguePercent(p.val)}
                    style={{
                      flex: 1,
                      padding: "6px 2px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: fatiguePercent === p.val ? "2px solid var(--color-action)" : "1px solid var(--color-border)",
                      background: fatiguePercent === p.val ? "var(--color-action-soft)" : "var(--color-surface)",
                      color: fatiguePercent === p.val ? "var(--color-action-ink)" : "var(--color-text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => triggerClose()}
            style={{
              flex: 1,
              height: "48px",
              borderRadius: "12px",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              fontWeight: 600,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Retry Set
          </button>
          <Button
            onClick={handleConfirm}
            size="large"
            style={{
              flex: 2,
              height: "48px",
              borderRadius: "12px",
              background: "var(--color-action)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Check size={18} />
            Confirm & Save Set
          </Button>
        </div>
      </div>
    </div>
  );
}
