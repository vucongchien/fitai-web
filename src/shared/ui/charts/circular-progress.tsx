import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/cn";

type CircularProgressTone = "action" | "effort" | "recovery";

type CircularProgressProps = {
  /** Accessible sentence carrying the real reading, e.g. "1,420 of 2,050 kcal logged". */
  ariaLabel: string;
  /** Sits at the centre of the ring. The value itself reads below it. */
  Icon: LucideIcon;
  max: number;
  tone?: CircularProgressTone;
  value: number;
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function toPercentage(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

/**
 * The dominant reading on Nutrition and Workout: an arc carrying the ratio, with the
 * subject's icon at the centre. The value reads below the ring, so the arc is never
 * duplicated by a percentage caption.
 *
 * Authored as inline SVG on purpose: `@tanstack/charts` ships a cartesian mark set
 * (lineY / barY / areaY / dot / rect / hexagon / link / arrow / frame) with no arc,
 * radial or gauge mark, so a ring cannot be expressed in that grammar.
 */
export function CircularProgress({
  ariaLabel,
  Icon,
  max,
  tone = "action",
  value,
}: CircularProgressProps) {
  const percentage = toPercentage(value, max);
  const hasTarget = Number.isFinite(max) && max > 0;

  return (
    <div className={cn("progress-ring", `progress-ring--${tone}`)}>
      <svg aria-label={ariaLabel} role="img" viewBox="0 0 120 120">
        <circle className="progress-ring__track" cx="60" cy="60" r={RADIUS} />
        {hasTarget && percentage > 0 ? (
          <circle
            className="progress-ring__value"
            cx="60"
            cy="60"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - percentage / 100)}
          />
        ) : null}
      </svg>

      <span aria-hidden="true" className="progress-ring__icon">
        <Icon size={34} strokeWidth={1.9} />
      </span>
    </div>
  );
}
