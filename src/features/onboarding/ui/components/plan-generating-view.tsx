"use client";

import { ArrowRight, Check, Loader2, RefreshCw } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";

import type { OnboardingValues } from "@/features/onboarding/domain/onboarding-schema";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { FitAiMascotSvg } from "@/shared/ui/fitai-mascot-svg";

interface PlanGeneratingViewProps {
  values: OnboardingValues;
  status: "generating" | "error";
  errorMessage?: string | null;
  onRetry: () => void;
  onContinueAnyway: () => void;
}

const GOAL_LABELS: Record<string, string> = {
  "lose-fat": "fat-loss",
  "build-muscle": "hypertrophy",
  "get-stronger": "strength",
  "improve-endurance": "endurance",
  "stay-active": "active lifestyle",
};

function subscribeStageTimer(onStoreChange: () => void) {
  const timer1 = window.setTimeout(onStoreChange, 2600);
  const timer2 = window.setTimeout(onStoreChange, 5800);
  return () => {
    window.clearTimeout(timer1);
    window.clearTimeout(timer2);
  };
}

function useGeneratingStage(isGenerating: boolean) {
  const mountedAt = useMemo(() => (isGenerating ? Date.now() : 0), [isGenerating]);

  return useSyncExternalStore(
    isGenerating ? subscribeStageTimer : () => () => {},
    () => {
      if (!isGenerating) return 2;
      const elapsed = Date.now() - mountedAt;
      if (elapsed >= 5800) return 3;
      if (elapsed >= 2600) return 2;
      return 1;
    },
    () => 1,
  );
}

export function PlanGeneratingView({
  values,
  status,
  errorMessage,
  onRetry,
  onContinueAnyway,
}: PlanGeneratingViewProps) {
  const activeStage = useGeneratingStage(status === "generating");

  const primaryGoal = values.goals?.[0] || "build-muscle";
  const goalLabel = GOAL_LABELS[primaryGoal] || "personalized fitness";
  const rawTimes = values.preferredWorkoutTimes;
  const totalSessions = Array.isArray(rawTimes)
    ? rawTimes.length
    : rawTimes
      ? Object.values(rawTimes).reduce((sum, slots) => sum + (slots?.length ?? 0), 0)
      : 0;
  const sessionText = totalSessions > 0 ? `${totalSessions} sessions/week` : "your weekly schedule";
  const hasInjury = values.injuryStatus && values.injuryStatus !== "none" && values.injuryMuscleGroup;

  const stages = useMemo(
    () => [
      {
        label: "Health profile saved",
        mascotLine: "Got your profile! Let me build your 4-week plan.",
      },
      {
        label: `Calculating calorie & macro targets for ${goalLabel}`,
        mascotLine: `Crunching your daily calories & protein targets for your ${goalLabel} goal...`,
      },
      {
        label: hasInjury
          ? `Filtering exercises to protect your ${values.injuryMuscleGroup}`
          : "Matching exercises to your available equipment",
        mascotLine: hasInjury
          ? `Making sure every movement stays safe around your ${values.injuryMuscleGroup} while keeping progress strong!`
          : `Picking evidence-based exercises that fit your equipment and experience level...`,
      },
      {
        label: `Scheduling your 4-week roadmap (${sessionText})`,
        mascotLine: `Almost there — locking in ${sessionText} with progressive overload for the next 4 weeks!`,
      },
    ],
    [goalLabel, hasInjury, sessionText, values.injuryMuscleGroup],
  );

  const progressPercent =
    status === "error" ? 75 : activeStage === 1 ? 35 : activeStage === 2 ? 65 : 90;

  return (
    <div className="onboarding-flow" role="status" aria-live="polite">
      <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <FitAiMascotSvg className="h-28 w-28" mood={status === "generating" ? "loading" : "idle"} />
          <div className="space-y-2.5 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {status === "error"
                ? "Your profile is saved — plan hit a snag"
                : "Building your 4-week plan..."}
            </h1>
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {status === "error"
                ? errorMessage ||
                  "I couldn't finish generating your 4-week roadmap right now. You can retry without re-entering your details."
                : stages[activeStage]?.mascotLine}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                status === "error" ? "bg-amber-500" : "bg-[var(--color-action)]",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <ul className="space-y-3">
          {stages.map((stage, index) => {
            const isDone = index < activeStage;
            const isCurrent = index === activeStage && status === "generating";
            return (
              <li
                className={cn(
                  "flex items-center gap-3 text-sm transition-opacity",
                  isDone || isCurrent ? "opacity-100" : "opacity-45",
                )}
                key={stage.label}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isCurrent
                        ? "border-[var(--color-action)] bg-[var(--color-surface-subtle)] text-[var(--color-action)]"
                        : "border-slate-200 bg-slate-50 text-slate-400",
                  )}
                >
                  {isDone ? (
                    <Check size={14} aria-hidden="true" />
                  ) : isCurrent ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>
                <span className={cn(isCurrent && "font-medium")}>{stage.label}</span>
              </li>
            );
          })}
        </ul>

        {status === "error" ? (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={onRetry} type="button" variant="primary">
              <RefreshCw size={16} aria-hidden="true" />
              Retry generating plan
            </Button>
            <Button onClick={onContinueAnyway} type="button" variant="secondary">
              Continue to Home
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            This usually takes 5–15 seconds while your AI coach tailors workouts and meals.
          </p>
        )}
      </div>
    </div>
  );
}
