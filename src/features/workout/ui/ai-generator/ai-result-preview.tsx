"use client";

import { Check, Sparkles } from "lucide-react";

import type { AdhocAiRecommendationOutput } from "@/features/workout/server/workout-actions";
import { cn } from "@/shared/lib/cn";

export interface EditableAiExercise {
  exerciseId: string;
  exerciseName: string;
  phase?: "warmup" | "main" | "cooldown";
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  durationSeconds?: number;
  restSetSec: number;
  notes?: string;
}

interface AiResultPreviewProps {
  result: AdhocAiRecommendationOutput;
  exercises: EditableAiExercise[];
  durationMinutes: number;
  selectedIndices: number[];
  onToggleExercise: (index: number) => void;
  onToggleAll: () => void;
  onUpdateExercise: (index: number, patch: Partial<EditableAiExercise>) => void;
}

export function AiResultPreview({
  result,
  exercises,
  durationMinutes,
  selectedIndices,
  onToggleExercise,
  onToggleAll,
  onUpdateExercise,
}: AiResultPreviewProps) {
  const allSelected = selectedIndices.length === exercises.length;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-action)]">
            <Sparkles size={12} aria-hidden="true" />
            Coach Strategy
          </span>
          <div className="flex items-center gap-1.5">
            {result.estimatedRpe ? (
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-text-muted)]">
                RPE ~{result.estimatedRpe}
              </span>
            ) : null}
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-action)]">
              ~{durationMinutes} min
            </span>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-[var(--color-text)]">{result.reasoning}</p>
        {result.muscleGroups && result.muscleGroups.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {result.muscleGroups.map((muscle) => (
              <span
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]"
                key={muscle}
              >
                {muscle}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)]">
            Exercises ({selectedIndices.length}/{exercises.length} selected)
          </h3>
          <button
            className="text-xs! font-semibold! text-[var(--color-action)] hover:underline cursor-pointer"
            onClick={onToggleAll}
            type="button"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        </div>

        <div className="space-y-1.5">
          {exercises.map((ex, idx) => {
            const isSelected = selectedIndices.includes(idx);
            return (
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border p-2.5 transition-all",
                  isSelected
                    ? "border-[var(--color-action)]/40 bg-[var(--color-surface)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface-subtle)] opacity-55",
                )}
                key={`${ex.exerciseId}-${idx}`}
              >
                <button
                  aria-label={`Toggle ${ex.exerciseName}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border! transition-colors cursor-pointer",
                    isSelected
                      ? "border-[var(--color-action)]! bg-[var(--color-action)] text-white"
                      : "border-[var(--color-border)]! bg-[var(--color-surface)]",
                  )}
                  onClick={() => onToggleExercise(idx)}
                  type="button"
                >
                  {isSelected && <Check size={11} strokeWidth={3} aria-hidden="true" />}
                </button>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <strong className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {ex.exerciseName}
                    </strong>
                    {ex.phase && ex.phase !== "main" && (
                      <span className="shrink-0 rounded-md bg-[var(--color-surface-subtle)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-text-muted)]">
                        {ex.phase === "warmup" ? "Warm-up" : "Cool-down"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <label className="inline-flex items-center gap-1">
                      <span>Sets</span>
                      <input
                        aria-label={`${ex.exerciseName} sets`}
                        className="w-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-1.5 py-0.5 text-center text-xs font-semibold text-[var(--color-text)] outline-none! focus:border-[var(--color-action)]"
                        max={20}
                        min={1}
                        onChange={(e) =>
                          onUpdateExercise(idx, {
                            targetSets: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        type="number"
                        value={ex.targetSets}
                      />
                    </label>

                    {(ex.durationSeconds ?? 0) > 0 ? (
                      <label className="inline-flex items-center gap-1">
                        <span>Duration</span>
                        <input
                          aria-label={`${ex.exerciseName} duration seconds`}
                          className="w-14 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-1.5 py-0.5 text-center text-xs font-semibold text-[var(--color-text)] outline-none! focus:border-[var(--color-action)]"
                          max={600}
                          min={5}
                          onChange={(e) =>
                            onUpdateExercise(idx, {
                              durationSeconds: Math.max(5, Number(e.target.value) || 30),
                            })
                          }
                          step={5}
                          type="number"
                          value={ex.durationSeconds}
                        />
                        <span>s</span>
                      </label>
                    ) : (
                      <label className="inline-flex items-center gap-1">
                        <span>Reps</span>
                        <input
                          aria-label={`${ex.exerciseName} reps`}
                          className="w-12 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-1.5 py-0.5 text-center text-xs font-semibold text-[var(--color-text)] outline-none! focus:border-[var(--color-action)]"
                          max={100}
                          min={1}
                          onChange={(e) =>
                            onUpdateExercise(idx, {
                              targetReps: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          type="number"
                          value={ex.targetReps}
                        />
                      </label>
                    )}

                    <label className="inline-flex items-center gap-1">
                      <span>Rest</span>
                      <input
                        aria-label={`${ex.exerciseName} rest seconds`}
                        className="w-14 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-1.5 py-0.5 text-center text-xs font-semibold text-[var(--color-text)] outline-none! focus:border-[var(--color-action)]"
                        max={300}
                        min={10}
                        onChange={(e) =>
                          onUpdateExercise(idx, {
                            restSetSec: Math.max(10, Number(e.target.value) || 30),
                          })
                        }
                        step={5}
                        type="number"
                        value={ex.restSetSec}
                      />
                      <span>s</span>
                    </label>
                  </div>

                  {ex.notes && (
                    <p className="text-xs leading-snug text-[var(--color-text-muted)]">
                      {ex.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
