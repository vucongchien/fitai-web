import { CheckCircle2, Dumbbell } from "lucide-react";

interface WeeklyGoalRingProps {
  completed: number;
  target: number;
  percentage: number;
}

export function WeeklyGoalRing({ completed, target, percentage }: WeeklyGoalRingProps) {
  const remaining = Math.max(0, target - completed);
  const isComplete = target > 0 && completed >= target;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  const motivationText = isComplete
    ? "Weekly goal complete — great consistency!"
    : remaining === 1
      ? "1 more workout to hit your weekly goal"
      : `${remaining} workouts left to hit your weekly goal`;

  return (
    <section
      aria-label="Weekly workout goal"
      className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 flex items-center gap-4 sm:gap-5"
    >
      <div className="relative shrink-0 size-24 flex items-center justify-center">
        <svg
          aria-label={`${completed} of ${target} weekly workouts completed (${percentage}%)`}
          role="img"
          viewBox="0 0 96 96"
          className="size-24 -rotate-90"
        >
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          {clampedPct > 0 && (
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke={
                isComplete ? "var(--color-recovery, #10b981)" : "var(--color-action, #4f46e5)"
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          )}
        </svg>
        <span
          aria-hidden="true"
          className={`absolute inset-0 m-auto size-11 rounded-full flex items-center justify-center ${
            isComplete
              ? "bg-[var(--color-recovery-soft)] text-[var(--color-recovery-ink)]"
              : "bg-[var(--color-action-soft)] text-[var(--color-action-ink)]"
          }`}
        >
          {isComplete ? <CheckCircle2 size={22} /> : <Dumbbell size={22} />}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Weekly Goal
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              isComplete
                ? "bg-[var(--color-recovery-soft)] text-[var(--color-recovery-ink)]"
                : "bg-[var(--color-action-soft)] text-[var(--color-action-ink)]"
            }`}
          >
            {percentage}%
          </span>
        </div>

        <p className="mt-1 font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[var(--color-text)] tabular-nums">
          {completed}{" "}
          <span className="text-base font-medium text-neutral-400">/ {target} workouts</span>
        </p>

        <p className="mt-1 text-xs sm:text-[13px] text-neutral-600 leading-snug">
          {motivationText}
        </p>
      </div>
    </section>
  );
}
