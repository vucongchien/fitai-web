"use client";

import { Check, Clock, Info, Loader2, Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";

import type { AdhocExercise } from "@/features/workout/model/adhoc-types";
import type { AdhocAiRecommendationOutput } from "@/features/workout/server/workout-actions";

interface AdhocAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExercises: (exercises: AdhocExercise[], mode: "replace" | "append") => void;
  currentExerciseCount: number;
}

interface WorkoutPreset {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  prompt: string;
  defaultDuration: number;
}

const WORKOUT_PRESETS: WorkoutPreset[] = [
  {
    id: "push",
    emoji: "💪",
    title: "Push Day",
    subtitle: "Chest, front delts & triceps",
    prompt: "Chest, front delts, and triceps with dumbbells",
    defaultDuration: 45,
  },
  {
    id: "pull",
    emoji: "⚡",
    title: "Pull & Core",
    subtitle: "Back, biceps & abs focus",
    prompt: "Back, biceps, and core in 45 minutes",
    defaultDuration: 45,
  },
  {
    id: "legs",
    emoji: "🔥",
    title: "Leg Hypertrophy",
    subtitle: "Quads, hamstrings & calves",
    prompt: "Quadriceps, hamstrings, and calves focus",
    defaultDuration: 50,
  },
  {
    id: "express",
    emoji: "⏱️",
    title: "30-Min Express",
    subtitle: "Full body burner",
    prompt: "High efficiency compound movements",
    defaultDuration: 30,
  },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

function FitAiCoachMascot({
  mood = "idle",
  className = "",
}: {
  mood?: "idle" | "loading" | "celebrating";
  className?: string;
}) {
  return (
    <div className={`ai-mascot-avatar ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <ellipse cx="50" cy="92" rx="30" ry="5.5" fill="#101214" opacity="0.1" />

        {/* Body - FITAI Relay Blue #4b57f2 */}
        <rect x="22" y="24" width="56" height="64" rx="28" fill="#4b57f2" />
        <path
          d="M22 60 C22 75, 34 88, 50 88 C66 88, 78 75, 78 60 L78 68 C78 80, 66 88, 50 88 C34 88, 22 80, 22 68 Z"
          fill="#3945dc"
        />

        {/* Headband - FITAI Sprint Coral #ff5a47 */}
        <rect x="21" y="26" width="58" height="15" rx="5" fill="#ff5a47" />
        <path d="M21 38 L79 38 L79 41 C79 43, 76 44, 74 44 L26 44 C24 44, 21 43, 21 41 Z" fill="#e04635" />
        <path d="M51 29 L47 34 L50 34 L48 39 L54 33 L51 33 Z" fill="#ffffff" />

        {/* Eyes */}
        {mood === "celebrating" ? (
          <>
            <path d="M34 50 Q41 42 48 50" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M52 50 Q59 42 66 50" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </>
        ) : mood === "loading" ? (
          <>
            <ellipse cx="40" cy="52" rx="7" ry="7" fill="#ffffff" />
            <circle cx="42" cy="52" r="4" fill="#101214" />
            <circle cx="43" cy="50" r="1.5" fill="#ffffff" />

            <ellipse cx="60" cy="52" rx="7" ry="7" fill="#ffffff" />
            <circle cx="62" cy="52" r="4" fill="#101214" />
            <circle cx="63" cy="50" r="1.5" fill="#ffffff" />
          </>
        ) : (
          <>
            <ellipse cx="39" cy="52" rx="8" ry="9" fill="#ffffff" />
            <ellipse cx="40" cy="52" rx="5" ry="6" fill="#101214" />
            <circle cx="42" cy="49" r="2.2" fill="#ffffff" />
            <circle cx="38" cy="54" r="1.1" fill="#ffffff" />

            <ellipse cx="61" cy="52" rx="8" ry="9" fill="#ffffff" />
            <ellipse cx="60" cy="52" rx="5" ry="6" fill="#101214" />
            <circle cx="62" cy="49" r="2.2" fill="#ffffff" />
            <circle cx="58" cy="54" r="1.1" fill="#ffffff" />
          </>
        )}

        {/* Blush */}
        <circle cx="28" cy="58" r="4" fill="#ff5a47" opacity="0.4" />
        <circle cx="72" cy="58" r="4" fill="#ff5a47" opacity="0.4" />

        {/* Smile */}
        {mood === "celebrating" ? (
          <g>
            <path d="M42 63 C42 70, 58 70, 58 63 Z" fill="#ffffff" />
            <path d="M45 66 C47 69, 53 69, 55 66 Z" fill="#ff5a47" />
          </g>
        ) : (
          <path d="M44 64 Q50 70 56 64" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        )}

        {/* Arms */}
        {mood === "celebrating" ? (
          <>
            <rect x="10" y="32" width="12" height="24" rx="6" fill="#4b57f2" transform="rotate(-30 10 32)" />
            <rect x="78" y="24" width="12" height="24" rx="6" fill="#4b57f2" transform="rotate(30 78 24)" />
          </>
        ) : (
          <>
            <circle cx="18" cy="62" r="7" fill="#4b57f2" />
            <circle cx="82" cy="62" r="7" fill="#4b57f2" />
          </>
        )}
      </svg>
    </div>
  );
}

export function AdhocAiGeneratorModal({
  isOpen,
  onClose,
  onApplyExercises,
  currentExerciseCount,
}: AdhocAiGeneratorModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <AdhocAiGeneratorModalContent
      key="adhoc-ai-generator-open"
      onClose={onClose}
      onApplyExercises={onApplyExercises}
      currentExerciseCount={currentExerciseCount}
    />
  );
}

function AdhocAiGeneratorModalContent({
  onClose,
  onApplyExercises,
  currentExerciseCount,
}: Omit<AdhocAiGeneratorModalProps, "isOpen">) {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>("push");
  const [promptText, setPromptText] = useState(WORKOUT_PRESETS[0].prompt);
  const [durationMinutes, setDurationMinutes] = useState(WORKOUT_PRESETS[0].defaultDuration);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<AdhocAiRecommendationOutput | null>(null);

  const containerRef = (node: HTMLDivElement | null) => {
    if (!node) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  };

  const handleSelectPreset = (preset: WorkoutPreset) => {
    setSelectedPresetId(preset.id);
    setPromptText(preset.prompt);
    setDurationMinutes(preset.defaultDuration);
  };

  const handleGenerate = async (customPrompt?: string, customDuration?: number) => {
    const textToUse = customPrompt !== undefined ? customPrompt : promptText;
    const durationToUse = customDuration !== undefined ? customDuration : durationMinutes;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { getAiRecommendation } = await import("@/features/workout/server/workout-actions");
      const res = await getAiRecommendation({
        freeText: textToUse.trim() || "Full Body Workout",
        durationMinutes: durationToUse,
      });
      setResult(res);
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Unable to generate workout recommendations right now. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (mode: "replace" | "append") => {
    if (!result || !result.exercises.length) {
      return;
    }

    const mappedExercises: AdhocExercise[] = result.exercises.map((ex, idx) => {
      const rootId = ex.exerciseId || `ex-${idx}`;
      return {
        id: `${rootId}__${Date.now()}_${idx}`,
        exerciseId: rootId,
        name: ex.exerciseName,
        prescription: `${ex.targetSets} × ${ex.targetReps}`,
        rest: `${ex.restSetSec} sec`,
        note: ex.notes || "AI Coach Prescribed",
        sets: ex.targetSets,
        reps: ex.targetReps,
        weightKg: ex.targetWeight,
      };
    });

    onApplyExercises(mappedExercises, mode);
    onClose();
  };

  const mascotMood = isLoading ? "loading" : result ? "celebrating" : "idle";

  return (
    <div ref={containerRef} className="ai-generator-modal-backdrop">
      <button
        aria-label="Close AI Generator"
        className="exercise-edit-modal__scrim"
        onClick={onClose}
        type="button"
      />

      <div
        aria-label="AI Coach Workout Generator"
        aria-modal="true"
        className="ai-generator-modal"
        role="dialog"
      >
        {/* Compact Header */}
        <div className="ai-modal-header">
          <div className="ai-modal-header-left">
            <FitAiCoachMascot
              mood={mascotMood}
              className="ai-mascot-avatar--compact"
            />
            <div className="ai-modal-title-group">
              <span className="ai-modal-badge">
                <Sparkles size={13} />
                AI Coach Copilot
              </span>
              <h2 className="ai-modal-title">Generate Adhoc Workout</h2>
            </div>
          </div>
          <button
            aria-label="Close modal"
            className="ai-modal-close-btn"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="ai-modal-body">
          {/* Subtle Coach Hint */}
          <p className="ai-coach-hint">
            {isLoading
              ? "⚡ Analyzing sports biomechanics & building your plan..."
              : result
                ? "🎯 Plan tailored and ready! Review your movements below:"
                : "Choose a target routine or describe custom movements below:"}
          </p>

          {/* Error Message */}
          {errorMsg && (
            <div className="ai-error-banner" role="alert">
              <Info size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {!result ? (
            <>
              {/* Focus Cards */}
              <div>
                <div className="ai-section-label">
                  <span>What’s the focus?</span>
                </div>
                <div className="ai-presets-grid">
                  {WORKOUT_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`ai-focus-card ${isSelected ? "is-selected" : ""}`}
                        onClick={() => handleSelectPreset(preset)}
                        disabled={isLoading}
                      >
                        <div className="ai-focus-card__header">
                          <span className="ai-focus-card__emoji">{preset.emoji}</span>
                          {isSelected && (
                            <span className="ai-focus-card__check">
                              <Check size={11} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="ai-focus-card__body">
                          <h4 className="ai-focus-card__title">{preset.title}</h4>
                          <p className="ai-focus-card__desc">{preset.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Pills */}
              <div>
                <div className="ai-section-label">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} /> Workout Duration
                  </span>
                  <span className="ai-section-highlight">{durationMinutes} min</span>
                </div>
                <div className="ai-duration-row">
                  {DURATION_OPTIONS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      className={`ai-duration-pill ${durationMinutes === mins ? "is-active" : ""}`}
                      onClick={() => setDurationMinutes(mins)}
                      disabled={isLoading}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input */}
              <div className="ai-input-wrapper">
                <div className="ai-section-label">
                  <label htmlFor="ai-prompt-input">
                    What do you want to train today? (Free text)
                  </label>
                </div>
                <textarea
                  id="ai-prompt-input"
                  className="ai-custom-textarea"
                  placeholder="e.g. 45 min chest and triceps with dumbbells, shoulder tight so avoid overhead..."
                  rows={2}
                  value={promptText}
                  onChange={(e) => {
                    setPromptText(e.target.value);
                    const match = WORKOUT_PRESETS.find((p) => p.prompt === e.target.value);
                    setSelectedPresetId(match ? match.id : null);
                  }}
                  disabled={isLoading}
                />
              </div>
            </>
          ) : (
            /* Result Preview Screen */
            <div className="ai-result-deck">
              <div className="ai-reasoning-card">
                <div className="ai-reasoning-header">
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-[var(--color-action)]">
                    <Sparkles size={13} /> Coach Strategy
                  </span>
                  {result.estimatedRpe && (
                    <span className="ai-rpe-badge">RPE ~{result.estimatedRpe}</span>
                  )}
                </div>
                <p className="ai-reasoning-text">{result.reasoning}</p>

                {result.muscleGroups && result.muscleGroups.length > 0 && (
                  <div className="ai-muscles-row">
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">Target:</span>
                    {result.muscleGroups.map((m) => (
                      <span key={m} className="ai-muscle-chip">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="ai-exercises-header">
                <h3>Recommended Routine ({result.exercises.length})</h3>
                <span className="text-xs font-bold text-[var(--color-action)]">
                  ~{durationMinutes} min
                </span>
              </div>

              <div className="ai-exercise-list">
                {result.exercises.map((ex, idx) => (
                  <div key={ex.exerciseId + idx} className="ai-exercise-item">
                    <span className="ai-exercise-index">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="ai-exercise-info">
                      <strong className="ai-exercise-title">{ex.exerciseName}</strong>
                      <span className="ai-exercise-meta">
                        {ex.targetSets} sets × {ex.targetReps} reps
                        {ex.targetWeight ? ` · ${ex.targetWeight} kg` : ""} · Rest {ex.restSetSec}s
                      </span>
                      {ex.notes && <p className="ai-exercise-note">{ex.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ai-modal-footer">
          {!result ? (
            <button
              type="button"
              className="ui-button ui-button--primary ui-button--large w-full"
              onClick={() => handleGenerate()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Creating plan...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Smart Workout</span>
                </>
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="ui-button ui-button--primary ui-button--large w-full"
                onClick={() => handleApply("replace")}
              >
                <Check size={16} />
                <span>Apply All ({result.exercises.length})</span>
              </button>

              {currentExerciseCount > 0 && (
                <button
                  type="button"
                  className="ui-button ui-button--secondary ui-button--medium w-full"
                  onClick={() => handleApply("append")}
                >
                  <Plus size={15} />
                  <span>Add to Routine ({result.exercises.length})</span>
                </button>
              )}

              <button
                type="button"
                className="ai-btn-ghost"
                onClick={() => setResult(null)}
              >
                ← Change focus or options
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
