"use client";

import { CheckCircle2, ChevronDown, Circle, GitBranch, Loader2 } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

interface AiPlanTraceProps {
  durationMinutes: number;
  isLoading: boolean;
}

function subscribeTraceTimer(onStoreChange: () => void) {
  const t1 = window.setTimeout(onStoreChange, 1600);
  const t2 = window.setTimeout(onStoreChange, 3600);
  return () => {
    window.clearTimeout(t1);
    window.clearTimeout(t2);
  };
}

function useTraceCompletedCount(isLoading: boolean) {
  const mountedAt = useMemo(() => (isLoading ? Date.now() : 0), [isLoading]);
  return useSyncExternalStore(
    isLoading ? subscribeTraceTimer : () => () => {},
    () => {
      if (!isLoading) return 3;
      const elapsed = Date.now() - mountedAt;
      if (elapsed >= 3600) return 2;
      if (elapsed >= 1600) return 1;
      return 0;
    },
    () => (isLoading ? 0 : 3),
  );
}

export function AiPlanTrace({ durationMinutes, isLoading }: AiPlanTraceProps) {
  const [expanded, setExpanded] = useState(true);
  const completedCount = useTraceCompletedCount(isLoading);

  const steps = [
    "Analyze target muscles & equipment",
    `Balance sets, reps & rest for ${durationMinutes} min`,
    "Select & order biomechanically safe exercises",
  ];

  return (
    <div className="space-y-2 text-xs">
      <button
        aria-expanded={expanded}
        className="inline-flex items-center gap-1.5 text-xs! font-medium! text-[var(--color-text)] hover:opacity-80 cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
        type="button"
      >
        <GitBranch size={13} className="text-[var(--color-text-muted)]" aria-hidden="true" />
        <span>Plan: build {durationMinutes}m workout</span>
        <span className="text-[var(--color-text-muted)]">
          {completedCount} of {steps.length} done
        </span>
        <ChevronDown
          size={13}
          className={`text-[var(--color-text-muted)] transition-transform ${expanded ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <ul className="ml-1.5 space-y-1.5 border-l border-[var(--color-border)] pl-3.5">
          {steps.map((label, idx) => {
            const isDone = idx < completedCount;
            const isActive = isLoading && idx === completedCount;
            return (
              <li
                className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]"
                key={label}
              >
                {isDone ? (
                  <CheckCircle2
                    size={13}
                    className="shrink-0 text-[var(--color-text-muted)]"
                    aria-hidden="true"
                  />
                ) : isActive ? (
                  <Loader2
                    size={13}
                    className="shrink-0 animate-spin text-[var(--color-action)]"
                    aria-hidden="true"
                  />
                ) : (
                  <Circle size={13} className="shrink-0 opacity-40" aria-hidden="true" />
                )}
                <span className={isActive ? "text-[var(--color-text)] font-medium" : ""}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
