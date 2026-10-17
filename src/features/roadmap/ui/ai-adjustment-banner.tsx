"use client";

import { CheckCircle2, Eye, RefreshCw, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";

import { useAIAdjustmentSync } from "@/features/roadmap/hooks/use-ai-adjustment-sync";
import { clearAIAdjustment } from "@/features/roadmap/model/ai-adjustment-store";
import { AIChangesModal } from "@/features/roadmap/ui/ai-changes-modal";

const LIVE_STAGES = [
  "Assessing biomechanics & injury constraints...",
  "Scanning active roadmap & upcoming workout sessions...",
  "Applying BR-AC-09 Guardrail: Substituting affected exercises...",
  "Finalizing personalized roadmap adaptation...",
];

export function AIAdjustmentBanner() {
  const { context, refreshNow } = useAIAdjustmentSync();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);

  // Derived state without useEffect: retain last non-null context across unmount/close
  const lastContextRef = useRef(context);
  if (context) {
    lastContextRef.current = context;
  }
  const activeContext = context || lastContextRef.current;

  const getTargetTitle = () => {
    if (!activeContext) return "AI Coach Recalibrating";
    if (activeContext.status === "completed") {
      return "Roadmap Updated & Aligned";
    }
    switch (activeContext.reason) {
      case "injury_reported":
        return `Protecting ${activeContext.muscleGroup || "Reported Area"}`;
      case "injury_recovered":
        return `Restoring ${activeContext.muscleGroup || "Recovered Area"}`;
      case "profile_updated":
        return "Recalibrating Goals";
      default:
        return "AI Coach Recalibrating";
    }
  };

  const getDynamicMessage = () => {
    if (!activeContext) return "";
    if (activeContext.status === "completed") {
      return "Your upcoming workouts have been recalibrated to ensure safety and continuous progress.";
    }
    return LIVE_STAGES[currentStageIndex];
  };

  const isCompleted = context?.status === "completed";

  return (
    <>
      {context && (
        <div
          ref={(el) => {
            if (!el || context.status !== "in_progress") return;
            const interval = setInterval(() => {
              setCurrentStageIndex((prev) => (prev + 1) % LIVE_STAGES.length);
            }, 2500);
            return () => clearInterval(interval);
          }}
          role="status"
          aria-live="polite"
          className={`mb-4 w-full rounded-[var(--radius-card)] p-4 transition-all duration-300 border shadow-xs ${
            isCompleted
              ? "bg-[var(--color-recovery-soft)] border-[color-mix(in_srgb,var(--color-recovery-strong)_30%,transparent)] text-[var(--color-text)]"
              : "bg-[var(--color-action-soft)] border-[color-mix(in_srgb,var(--color-action)_30%,transparent)] text-[var(--color-text)]"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`p-2.5 rounded-[var(--radius-input)] shrink-0 ${
                  isCompleted
                    ? "bg-[var(--color-surface)] text-[var(--color-recovery-strong)] border border-[color-mix(in_srgb,var(--color-recovery-strong)_20%,transparent)]"
                    : "bg-[var(--color-surface)] text-[var(--color-action)] border border-[color-mix(in_srgb,var(--color-action)_20%,transparent)]"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Sparkles className="h-5 w-5 animate-pulse" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-85">
                    AI Coach: {getTargetTitle()}
                  </span>
                  {!isCompleted && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-action)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-action)]"></span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium mt-0.5 transition-all duration-300">
                  {getDynamicMessage()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {isCompleted ? (
                <button
                  type="button"
                  onClick={() => setIsChangesModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-input)] bg-[var(--color-surface)] border border-[color-mix(in_srgb,var(--color-recovery-strong)_40%,transparent)] text-[var(--color-recovery-strong)] hover:bg-[var(--color-recovery-soft)] transition-colors cursor-pointer shadow-xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Changes</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={refreshNow}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-input)] bg-[var(--color-surface)] border border-[color-mix(in_srgb,var(--color-action)_40%,transparent)] text-[var(--color-action)] hover:bg-[var(--color-action-soft)] transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Check status</span>
                </button>
              )}

              <button
                type="button"
                onClick={clearAIAdjustment}
                aria-label="Dismiss notification"
                className="p-1.5 rounded-[var(--radius-input)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AIChangesModal
        isOpen={isChangesModalOpen}
        onClose={() => setIsChangesModalOpen(false)}
        context={activeContext}
      />
    </>
  );
}
