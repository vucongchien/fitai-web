"use client";

import { AlertTriangle, Check, ShieldCheck } from "lucide-react";

export type InjuryConstraintsManagerProps = {
  injuryAreas: string[];
  injuryReported: boolean;
  onChangeInjuryAreas: (areas: string[]) => void;
  onToggleInjuryReported: (reported: boolean) => void;
  disabled?: boolean;
};

const INJURY_PRESETS = [
  { key: "shoulder", label: "Shoulder" },
  { key: "lower_back", label: "Lower Back" },
  { key: "knee", label: "Knee" },
  { key: "wrist", label: "Wrist" },
  { key: "ankle", label: "Ankle" },
  { key: "neck", label: "Neck" },
] as const;

export function InjuryConstraintsManager({
  disabled = false,
  injuryAreas,
  injuryReported,
  onChangeInjuryAreas,
  onToggleInjuryReported,
}: InjuryConstraintsManagerProps) {
  function toggleArea(areaKey: string) {
    if (disabled) return;
    if (injuryAreas.includes(areaKey)) {
      const updated = injuryAreas.filter((a) => a !== areaKey);
      onChangeInjuryAreas(updated);
      if (updated.length === 0) {
        onToggleInjuryReported(false);
      }
    } else {
      const updated = [...injuryAreas, areaKey];
      onChangeInjuryAreas(updated);
      onToggleInjuryReported(true);
    }
  }

  return (
    <div className="injury-constraints-manager space-y-4 p-4 rounded-[14px] bg-[var(--color-clear-white,#FFFFFF)] border border-[var(--color-mist,#ECEEF0)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className={`w-5 h-5 ${
              injuryReported
                ? "text-[var(--color-danger,#C92F42)]"
                : "text-[var(--color-field-green,#25C77A)]"
            }`}
          />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)]">
              Safety & Health Constraints
            </h3>
            <p className="text-xs text-[var(--color-graphite,#50565C)]">
              FITAI adapts your roadmap to protect active injuries.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Status Banner */}
      <div
        className={`p-3.5 rounded-[10px] flex items-center justify-between border ${
          injuryReported
            ? "bg-[var(--color-coral-tint,#FFF0ED)] border-[var(--color-sprint-coral,#FF5A47)] text-[var(--color-true-ink,#101214)]"
            : "bg-[var(--color-green-tint,#EAFBF2)] border-[var(--color-field-green,#25C77A)] text-[var(--color-true-ink,#101214)]"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {injuryReported ? (
            <AlertTriangle className="w-5 h-5 text-[var(--color-danger,#C92F42)] shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-[var(--color-field-green,#25C77A)] shrink-0" />
          )}
          <div>
            <strong className="text-xs block font-bold">
              {injuryReported ? "Active Injury Constraints" : "No Active Injury Constraints"}
            </strong>
            <span className="text-[11px] text-[var(--color-graphite,#50565C)]">
              {injuryReported
                ? "Future sessions stay conservative on affected joints."
                : "Your roadmap can continue as planned."}
            </span>
          </div>
        </div>

        <button
          className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all border ${
            injuryReported
              ? "bg-[var(--color-clear-white,#FFFFFF)] text-[var(--color-field-green,#25C77A)] border-[var(--color-field-green,#25C77A)]"
              : "bg-[var(--color-danger,#C92F42)] text-[var(--color-clear-white,#FFFFFF)] border-[var(--color-danger,#C92F42)]"
          }`}
          disabled={disabled}
          onClick={() => {
            if (injuryReported) {
              onToggleInjuryReported(false);
              onChangeInjuryAreas([]);
            } else {
              onToggleInjuryReported(true);
            }
          }}
          type="button"
        >
          {injuryReported ? "Mark as Recovered" : "Report Injury"}
        </button>
      </div>

      {/* Specific Injury Area Pills */}
      <div className="space-y-2 pt-2 border-t border-[var(--color-mist,#ECEEF0)]">
        <label className="text-xs font-semibold text-[var(--color-graphite,#50565C)] block">
          Affected body areas ({injuryAreas.length} selected):
        </label>
        <div aria-label="Select affected body areas" className="flex flex-wrap gap-2" role="group">
          {INJURY_PRESETS.map((area) => {
            const active = injuryAreas.includes(area.key);
            return (
              <button
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-[999px] text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                  active
                    ? "bg-[var(--color-coral-tint,#FFF0ED)] text-[var(--color-danger,#C92F42)] border-[var(--color-sprint-coral,#FF5A47)]"
                    : "bg-[var(--color-clear-white,#FFFFFF)] text-[var(--color-graphite,#50565C)] border-[var(--color-mist,#ECEEF0)] hover:bg-[var(--color-soft-paper,#F7F8F6)]"
                }`}
                disabled={disabled}
                key={area.key}
                onClick={() => toggleArea(area.key)}
                type="button"
              >
                {active && <Check className="w-3 h-3 stroke-[3]" />}
                <span>{area.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
