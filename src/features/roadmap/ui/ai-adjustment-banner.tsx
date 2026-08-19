"use client";

import { CheckCircle2, Eye, RefreshCw, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [lastContext, setLastContext] = useState(context);

  useEffect(() => {
    if (context) {
      setLastContext(context);
    }
  }, [context]);

  // Live stage progression animation when in progress
  useEffect(() => {
    if (!context || context.status !== "in_progress") {
      return;
    }
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev + 1) % LIVE_STAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [context]);

  const activeContext = context || lastContext;

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
          role="status"
          aria-live="polite"
          className={`mb-4 w-full rounded-2xl p-4 transition-all duration-300 border shadow-xs ${
            isCompleted
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
              : "bg-indigo-50/90 border-indigo-200/80 text-indigo-950"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
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
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 transition-colors cursor-pointer shadow-xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Changes</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={refreshNow}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Check status</span>
                </button>
              )}

              <button
                type="button"
                onClick={clearAIAdjustment}
                aria-label="Dismiss notification"
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
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
