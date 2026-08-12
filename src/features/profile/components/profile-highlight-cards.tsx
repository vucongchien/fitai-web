import { Activity, Scale, Target } from "lucide-react";

import type { ProfileHighlightMetrics } from "../model/profile.types";

interface ProfileHighlightCardsProps {
  highlights: ProfileHighlightMetrics;
}

export function ProfileHighlightCards({ highlights }: ProfileHighlightCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {/* Current Weight */}
      <div
        className="flex flex-col items-center justify-center rounded-xl p-3 border text-center"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div
          className="mb-1 flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: "var(--color-action-soft)",
            color: "var(--color-action)",
          }}
        >
          <Scale className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-bold font-mono" style={{ color: "var(--color-text)" }}>
          {highlights.currentWeightKg}{" "}
          <span className="text-[11px] font-normal" style={{ color: "var(--color-text-muted)" }}>kg</span>
        </span>
        <span className="mt-0.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>Weight</span>
      </div>

      {/* Body Fat Percentage */}
      <div
        className="flex flex-col items-center justify-center rounded-xl p-3 border text-center"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div
          className="mb-1 flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: "var(--color-effort-soft)",
            color: "var(--color-effort)",
          }}
        >
          <Activity className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-bold font-mono" style={{ color: "var(--color-text)" }}>
          {highlights.bodyFatPercent}{" "}
          <span className="text-[11px] font-normal" style={{ color: "var(--color-text-muted)" }}>%</span>
        </span>
        <span className="mt-0.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>Body Fat</span>
      </div>

      {/* Target Weight */}
      <div
        className="flex flex-col items-center justify-center rounded-xl p-3 border text-center"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div
          className="mb-1 flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: "var(--color-recovery-soft)",
            color: "var(--color-recovery)",
          }}
        >
          <Target className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-bold font-mono" style={{ color: "var(--color-text)" }}>
          {highlights.targetWeightKg}{" "}
          <span className="text-[11px] font-normal" style={{ color: "var(--color-text-muted)" }}>kg</span>
        </span>
        <span className="mt-0.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>Target</span>
      </div>
    </div>
  );
}
