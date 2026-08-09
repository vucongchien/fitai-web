"use client";

import { Check, Clock, Info, Loader2, Plus, Sparkles, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import type { AdhocExercise } from "@/features/workout/model/adhoc-types";
import type { AdhocAiRecommendationOutput } from "@/features/workout/server/workout-actions";

interface AdhocAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExercises: (exercises: AdhocExercise[], mode: "replace" | "append") => void;
  currentExerciseCount: number;
}

const QUICK_PROMPTS = [
  {
    label: "💪 Push Day",
    text: "Tập ngực, vai trước và tay sau với tạ đơn",
    duration: 45,
  },
  {
    label: "⚡ Pull & Core",
    text: "Tập lưng xô, tay trước và bụng trong 45 phút",
    duration: 45,
  },
  {
    label: "🦵 Legs Thân Dưới",
    text: "Tập đùi trước, đùi sau và cơ mông",
    duration: 40,
  },
  {
    label: "🔥 Full Body 30m",
    text: "Toàn thân nhanh gọn, kích hoạt mọi nhóm cơ chính",
    duration: 30,
  },
  {
    label: "🏨 Phòng Khách / Khách Sạn",
    text: "Không cần dụng cụ phức tạp, tận dụng bodyweight và tạ đơn nhẹ",
    duration: 30,
  },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

export function AdhocAiGeneratorModal({
  isOpen,
  onClose,
  onApplyExercises,
  currentExerciseCount,
}: AdhocAiGeneratorModalProps) {
  const [promptText, setPromptText] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<AdhocAiRecommendationOutput | null>(null);

  // Keyboard shortcut: Escape để đóng modal
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

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
      setErrorMsg(err?.message || "Không thể tạo gợi ý lúc này. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPromptClick = (text: string, duration: number) => {
    setPromptText(text);
    setDurationMinutes(duration);
    handleGenerate(text, duration);
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

  return (
    <div className="exercise-edit-modal-backdrop ai-generator-modal-backdrop">
      <button
        aria-label="Close AI Generator"
        className="exercise-edit-modal__scrim"
        onClick={onClose}
        type="button"
      />

      <div
        aria-label="AI Coach Workout Generator"
        aria-modal="true"
        className="exercise-edit-modal ai-generator-modal"
        role="dialog"
      >
        {/* Header */}
        <div className="exercise-edit-modal__header">
          <div className="ai-modal-title">
            <span className="ai-modal-badge">
              <Sparkles size={16} />
              AI Coach Copilot
            </span>
            <h2>Generate Adhoc Workout</h2>
          </div>
          <button
            aria-label="Close modal"
            className="exercise-edit-modal__close"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="exercise-edit-modal__body ai-generator-modal__body">
          {/* Prompt Section */}
          <div className="ai-generator-field">
            <label htmlFor="ai-prompt-input">
              <span>Bạn muốn tập gì hôm nay? (Nhập tự do)</span>
            </label>
            <div className="ai-textarea-wrapper">
              <textarea
                id="ai-prompt-input"
                className="ai-prompt-textarea"
                placeholder="Ví dụ: Hôm nay tôi muốn tập ngực và tay sau trong 45 phút với tạ đơn, vai đang hơi mỏi nên tránh bài ép tạ qua đầu..."
                rows={3}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Duration Selector */}
          <div className="ai-duration-section">
            <div className="ai-duration-header">
              <Clock size={15} />
              <span>Thời lượng buổi tập:</span>
              <strong>{durationMinutes} phút</strong>
            </div>
            <div className="ai-duration-pills">
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

          {/* Quick Prompts Inspiration */}
          <div className="ai-quick-prompts-section">
            <span className="ai-section-label">
              <Zap size={13} /> Gợi ý nhanh 1-chạm:
            </span>
            <div className="ai-quick-prompts-list">
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="ai-quick-prompt-btn"
                  onClick={() => handleQuickPromptClick(item.text, item.duration)}
                  disabled={isLoading}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trigger Generate Button */}
          <div className="ai-generate-action-row">
            <button
              type="button"
              className="ui-button ui-button--primary ui-button--large ai-submit-button"
              onClick={() => handleGenerate()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>AI Coach đang phân tích & lên giáo án...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>{result ? "Tạo lại giáo án (Regenerate)" : "Tạo giáo án thông minh"}</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="ai-error-banner" role="alert">
              <Info size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result Preview Box */}
          {result && (
            <div className="ai-result-preview-box">
              {/* Reasoning Card */}
              <div className="ai-reasoning-card">
                <div className="ai-reasoning-header">
                  <span className="ai-coach-tag">
                    <Sparkles size={14} /> AI Coach Reasoning
                  </span>
                  {result.estimatedRpe && (
                    <span className="ai-rpe-badge">RPE ~{result.estimatedRpe}</span>
                  )}
                </div>
                <p className="ai-reasoning-text">{result.reasoning}</p>

                {result.muscleGroups && result.muscleGroups.length > 0 && (
                  <div className="ai-target-muscles">
                    <span>Nhóm cơ kích hoạt:</span>
                    <div className="ai-muscle-tags">
                      {result.muscleGroups.map((m) => (
                        <span key={m} className="ai-muscle-tag">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Exercises Preview List */}
              <div className="ai-preview-list-header">
                <h3>Danh sách bài tập gợi ý ({result.exercises.length} bài)</h3>
              </div>

              <div className="ai-preview-exercise-list">
                {result.exercises.map((ex, idx) => (
                  <div key={ex.exerciseId + idx} className="ai-preview-item">
                    <span className="ai-preview-item__index">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="ai-preview-item__info">
                      <strong>{ex.exerciseName}</strong>
                      <span>
                        {ex.targetSets} hiệp × {ex.targetReps} reps
                        {ex.targetWeight ? ` · ${ex.targetWeight} kg` : ""} · Nghỉ {ex.restSetSec}s
                      </span>
                      {ex.notes && <p className="ai-preview-item__note">{ex.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="exercise-edit-modal__footer ai-generator-modal__footer">
          <button
            className="ui-button ui-button--secondary ui-button--medium"
            onClick={onClose}
            type="button"
          >
            Đóng
          </button>

          {result && result.exercises.length > 0 && (
            <div className="ai-apply-actions">
              {currentExerciseCount > 0 && (
                <button
                  className="ui-button ui-button--secondary ui-button--medium"
                  onClick={() => handleApply("append")}
                  type="button"
                >
                  <Plus size={16} />
                  Thêm tiếp ({result.exercises.length})
                </button>
              )}

              <button
                className="ui-button ui-button--primary ui-button--medium"
                onClick={() => handleApply("replace")}
                type="button"
              >
                <Check size={16} />
                Áp dụng toàn bộ ({result.exercises.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
