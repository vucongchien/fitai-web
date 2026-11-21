"use client";

import { Check, Info, Plus, RefreshCw, X } from "lucide-react";
import { useState } from "react";

import type { AdhocExercise } from "@/features/workout/model/adhoc-types";
import type { AdhocAiRecommendationOutput } from "@/features/workout/server/workout-actions";
import { AiChatInput } from "@/features/workout/ui/ai-generator/ai-chat-input";
import {
  WORKOUT_PRESETS,
  type WorkoutPreset,
} from "@/features/workout/ui/ai-generator/ai-generator-presets";
import { AiPlanTrace } from "@/features/workout/ui/ai-generator/ai-plan-trace";
import {
  AiResultPreview,
  type EditableAiExercise,
} from "@/features/workout/ui/ai-generator/ai-result-preview";
import { FitAiMascotSvg } from "@/shared/ui/fitai-mascot-svg";
import { toast } from "@/shared/ui/toast";

interface AdhocAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExercises: (exercises: AdhocExercise[], mode: "replace" | "append") => void;
  currentExerciseCount: number;
}

const EQUIPMENT_SUFFIX: Record<string, string> = {
  dumbbells: "using dumbbells only",
  bodyweight: "bodyweight only, no equipment",
};

function extractDurationFromPrompt(text: string): number | null {
  const match = text.match(/\b(\d{1,3})\s*(?:p|ph[uú]t|m|min|mins|minutes)\b/i);
  if (!match) {
    return null;
  }
  const mins = Number(match[1]);
  if (!Number.isFinite(mins) || mins < 10 || mins > 120) {
    return null;
  }
  return mins;
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
      currentExerciseCount={currentExerciseCount}
      key="adhoc-ai-generator-open"
      onApplyExercises={onApplyExercises}
      onClose={onClose}
    />
  );
}

function AdhocAiGeneratorModalContent({
  onClose,
  onApplyExercises,
  currentExerciseCount,
}: Omit<AdhocAiGeneratorModalProps, "isOpen">) {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState<string | null>(null);
  const [lastSubmittedDuration, setLastSubmittedDuration] = useState<number>(45);
  const [selectedEquipment, setSelectedEquipment] = useState("any");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<AdhocAiRecommendationOutput | null>(null);
  const [editableExercises, setEditableExercises] = useState<EditableAiExercise[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

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

  const handlePromptChange = (value: string) => {
    setPromptText(value);
    const match = WORKOUT_PRESETS.find((p) => p.prompt === value);
    setSelectedPresetId(match ? match.id : null);
  };

  const handleSend = async (overridePrompt?: string) => {
    const raw = (overridePrompt ?? promptText).trim() || "Balanced full body workout";
    const equipmentNote = EQUIPMENT_SUFFIX[selectedEquipment];
    const finalPrompt = equipmentNote ? `${raw} (${equipmentNote})` : raw;
    const parsedDuration = extractDurationFromPrompt(raw);
    const targetDuration = parsedDuration ?? durationMinutes;
    if (parsedDuration !== null) {
      setDurationMinutes(parsedDuration);
    }

    setLastSubmittedPrompt(raw);
    setLastSubmittedDuration(targetDuration);
    if (!overridePrompt) {
      setPromptText("");
      setSelectedPresetId(null);
    }
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);
    setEditableExercises([]);

    try {
      const { getAiRecommendation } = await import("@/features/workout/server/workout-actions");
      const res = await getAiRecommendation({
        freeText: finalPrompt,
        durationMinutes: targetDuration,
      });
      const combinedExercises: EditableAiExercise[] = [
        ...(res.warmUps ?? []).map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          phase: "warmup" as const,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          durationSeconds: ex.durationSeconds,
          restSetSec: ex.restSetSec,
          notes: ex.notes,
        })),
        ...res.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          phase: "main" as const,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          targetWeight: ex.targetWeight,
          durationSeconds: ex.durationSeconds,
          restSetSec: ex.restSetSec,
          notes: ex.notes,
        })),
        ...(res.coolDowns ?? []).map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          phase: "cooldown" as const,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          durationSeconds: ex.durationSeconds,
          restSetSec: ex.restSetSec,
          notes: ex.notes,
        })),
      ];
      setResult(res);
      setEditableExercises(combinedExercises);
      setSelectedIndices(combinedExercises.map((_, idx) => idx));
      toast.success(
        `AI Coach đã tạo xong buổi tập ${targetDuration} phút (${combinedExercises.length} bài)!`,
      );
    } catch (error: any) {
      const msg =
        error?.message || "Unable to generate workout recommendations right now. Please try again.";
      setErrorMsg(msg);
      toast.error("Chưa tạo được buổi tập, bạn bấm Replay để thử lại nhé.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExercise = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const handleToggleAll = () => {
    setSelectedIndices((prev) =>
      prev.length === editableExercises.length ? [] : editableExercises.map((_, idx) => idx),
    );
  };

  const handleUpdateExercise = (index: number, patch: Partial<EditableAiExercise>) => {
    setEditableExercises((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    );
  };

  const handleApply = (mode: "replace" | "append") => {
    if (!result || selectedIndices.length === 0) {
      return;
    }

    const mappedExercises: AdhocExercise[] = editableExercises
      .filter((_, idx) => selectedIndices.includes(idx))
      .map((ex, idx) => {
        const rootId = ex.exerciseId || `ex-${idx}`;
        const isTimeBased = (ex.durationSeconds ?? 0) > 0;
        return {
          id: `${rootId}__${Date.now()}_${idx}`,
          exerciseId: rootId,
          name: ex.exerciseName,
          prescription: isTimeBased
            ? `${ex.targetSets} × ${ex.durationSeconds}s`
            : `${ex.targetSets} × ${ex.targetReps}`,
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

  const hasConversation = Boolean(lastSubmittedPrompt);
  const mascotMood = isLoading ? "loading" : result ? "celebrating" : "idle";

  return (
    <div className="ai-generator-modal-backdrop" ref={containerRef}>
      <button
        aria-label="Close AI Generator"
        className="exercise-edit-modal__scrim"
        onClick={onClose}
        type="button"
      />

      <div
        aria-label="AI Coach Workout Generator"
        aria-modal="true"
        className="ai-generator-modal max-w-lg! rounded-2xl!"
        role="dialog"
      >
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2">
            <FitAiMascotSvg className="h-7 w-7" decorative mood={mascotMood} />
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-text)]">
              AI Coach
            </span>
          </div>
          <button
            aria-label="Close modal"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {!hasConversation ? (
            <div className="flex flex-col items-center justify-center text-center space-y-1.5 py-6">
              <FitAiMascotSvg className="h-14 w-14" decorative mood="idle" />
              <h2 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
                What are we training today?
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Pick a template or ask me to build your workout.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-[var(--color-surface-subtle)] px-3.5 py-2 text-sm text-[var(--color-text)]">
                  {lastSubmittedPrompt}
                </div>
              </div>

              <div className="space-y-3">
                <AiPlanTrace durationMinutes={lastSubmittedDuration} isLoading={isLoading} />

                {errorMsg && (
                  <div
                    className="space-y-2 rounded-xl bg-[var(--color-danger-soft)] px-3 py-2.5 text-xs text-[var(--color-danger)]"
                    role="alert"
                  >
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
                      <span>{errorMsg}</span>
                    </div>
                    <button
                      className="inline-flex items-center gap-1 rounded-full border! border-[var(--color-danger)]/30! bg-[var(--color-surface)] px-3 py-1 text-xs! font-semibold! text-[var(--color-danger)] transition-colors hover:opacity-90 cursor-pointer"
                      disabled={isLoading}
                      onClick={() => handleSend(lastSubmittedPrompt ?? undefined)}
                      type="button"
                    >
                      <RefreshCw size={12} aria-hidden="true" />
                      <span>Replay</span>
                    </button>
                  </div>
                )}

                {result && (
                  <div className="space-y-3">
                    <AiResultPreview
                      durationMinutes={lastSubmittedDuration}
                      exercises={editableExercises}
                      onToggleAll={handleToggleAll}
                      onToggleExercise={handleToggleExercise}
                      onUpdateExercise={handleUpdateExercise}
                      result={result}
                      selectedIndices={selectedIndices}
                    />

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-action)] px-3.5 py-1.5 text-xs! font-semibold! text-white transition-colors hover:bg-[var(--color-action-hover)] disabled:opacity-50 cursor-pointer"
                        disabled={selectedIndices.length === 0}
                        onClick={() => handleApply("replace")}
                        type="button"
                      >
                        <Check size={13} aria-hidden="true" />
                        <span>
                          {currentExerciseCount > 0
                            ? `Replace (${selectedIndices.length})`
                            : `Apply (${selectedIndices.length})`}
                        </span>
                      </button>

                      {currentExerciseCount > 0 && (
                        <button
                          className="inline-flex items-center gap-1 rounded-full border! border-[var(--color-border)]! bg-[var(--color-surface)] px-3 py-1.5 text-xs! font-medium! text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-subtle)] disabled:opacity-50 cursor-pointer"
                          disabled={selectedIndices.length === 0}
                          onClick={() => handleApply("append")}
                          type="button"
                        >
                          <Plus size={13} aria-hidden="true" />
                          <span>Add ({selectedIndices.length})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-2">
          <AiChatInput
            durationMinutes={durationMinutes}
            isLoading={isLoading}
            onDurationChange={setDurationMinutes}
            onEquipmentChange={setSelectedEquipment}
            onPromptChange={handlePromptChange}
            onSelectPreset={handleSelectPreset}
            onSend={() => handleSend()}
            promptText={promptText}
            selectedEquipment={selectedEquipment}
            selectedPresetId={selectedPresetId}
            showTemplates={!hasConversation}
          />
        </div>
      </div>
    </div>
  );
}
