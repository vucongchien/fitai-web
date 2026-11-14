"use client";

import { BACK_MUSCLES, FRONT_MUSCLES } from "body-muscles";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import {
  BACK_CALLOUTS,
  formatMuscleLabel,
  FRONT_CALLOUTS,
  type MuscleCallout,
  resolveGoalMuscleIds,
  resolveZoneForMuscleId,
  ZONE_COLORS,
} from "../model/body-muscles";
import { classifyBmi, computeBmi, computeBodyComposition } from "../model/progress-aggregator";
import type { ActiveInjurySummary, BodyZoneId } from "../model/types";

type BodySex = "male" | "female";
type MuscleViewSide = "front" | "back";

interface BodySilhouetteCardProps {
  weightKg: number;
  heightCm: number;
  bodyFatPercent: number;
  preferredMuscleGroups: readonly string[];
  activeInjuries: readonly ActiveInjurySummary[];
  gender?: string;
}

const ZONE_MUSCLES: Record<Exclude<BodyZoneId, "full">, string[]> = {
  upper: ["CHEST", "BACK", "SHOULDERS", "ARMS", "BICEPS", "TRICEPS", "TRAPS", "LATS", "DELT"],
  core: ["ABS", "CORE", "OBLIQUES", "LOWER_BACK", "SERRATUS"],
  lower: ["LEGS", "QUADS", "HAMSTRINGS", "GLUTES", "CALVES", "ADDUCTORS", "ABDUCTORS", "HIP"],
};

function resolveSexFromGender(gender?: string): BodySex {
  return gender?.trim().toUpperCase() === "FEMALE" ? "female" : "male";
}

export function BodySilhouetteCard({
  weightKg,
  heightCm,
  bodyFatPercent,
  preferredMuscleGroups,
  activeInjuries,
  gender,
}: BodySilhouetteCardProps) {
  const [selectedZone, setSelectedZone] = useState<BodyZoneId>("full");
  const [viewSide, setViewSide] = useState<MuscleViewSide>("front");
  const [sex, setSex] = useState<BodySex>(() => resolveSexFromGender(gender));
  const [selectedCallout, setSelectedCallout] = useState<string | null>(null);
  const [hoveredCallout, setHoveredCallout] = useState<string | null>(null);

  const hasRealisticMetrics = weightKg >= 20 && heightCm >= 100;
  const bmi = hasRealisticMetrics ? computeBmi(weightKg, heightCm) : 0;
  const bmiInfo = classifyBmi(bmi);
  const { leanMassKg, fatMassKg } = computeBodyComposition(weightKg, bodyFatPercent);
  const leanPct =
    weightKg > 0 && bodyFatPercent > 0 ? Math.round((100 - bodyFatPercent) * 10) / 10 : 0;

  const zoneInjuries =
    selectedZone === "full"
      ? activeInjuries
      : activeInjuries.filter((inj) =>
          ZONE_MUSCLES[selectedZone].some((zm) => inj.muscleGroup.toUpperCase().includes(zm)),
        );

  const goalMuscleIds = resolveGoalMuscleIds(preferredMuscleGroups);
  const injuryMuscleIds = resolveGoalMuscleIds(activeInjuries.map((inj) => inj.muscleGroup));
  const muscles = viewSide === "front" ? FRONT_MUSCLES : BACK_MUSCLES;
  const callouts = viewSide === "front" ? FRONT_CALLOUTS : BACK_CALLOUTS;

  const activeCalloutId = hoveredCallout ?? selectedCallout;
  const activeCalloutObj: MuscleCallout | undefined = callouts.find(
    (c) => c.id === activeCalloutId,
  );
  const activeCalloutIds = new Set(activeCalloutObj?.muscleIds ?? []);

  const viewBox = viewSide === "front" ? "0 0 86 93" : "37 0 86 93";
  const centerX = viewSide === "front" ? 17.5 : 54.5;
  const elbowX = viewSide === "front" ? 41 : 78;
  const pillX = viewSide === "front" ? 48 : 85;
  const figureTransform =
    sex === "female"
      ? `translate(${centerX}, 0) scale(0.93, 1) translate(${-centerX}, 0)`
      : undefined;

  return (
    <section
      aria-label="Body composition and silhouette"
      className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-[var(--color-text)]">
            Body Composition
          </h2>
          <p className="text-xs text-neutral-500">
            Target focus &amp; injury status across body regions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-0.5 rounded-xl bg-neutral-100 p-1"
            role="group"
            aria-label="Body model"
          >
            {(["male", "female"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                aria-pressed={sex === s}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  sex === s
                    ? "bg-white text-[var(--color-text)] shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div
            className="flex items-center gap-0.5 rounded-xl bg-neutral-100 p-1"
            role="group"
            aria-label="Body view"
          >
            {(["front", "back"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => {
                  setViewSide(side);
                  setSelectedCallout(null);
                  setHoveredCallout(null);
                }}
                aria-pressed={viewSide === side}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  viewSide === side
                    ? "bg-white text-[var(--color-text)] shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {side}
              </button>
            ))}
          </div>

          <div
            className="flex items-center gap-1 rounded-xl bg-neutral-100 p-1"
            role="tablist"
            aria-label="Body zone filter"
          >
            {(
              [
                { id: "full", label: "Full" },
                { id: "upper", label: "Upper" },
                { id: "core", label: "Core" },
                { id: "lower", label: "Lower" },
              ] as const
            ).map((tab) => {
              const active = selectedZone === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setSelectedZone(tab.id);
                    setSelectedCallout(null);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? "bg-white text-[var(--color-text)] shadow-xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[270px_1fr] gap-6 items-center">
        <div className="flex flex-col items-center justify-center rounded-xl bg-neutral-50/70 px-3 py-4 border border-neutral-100">
          <svg
            viewBox={viewBox}
            className="w-full max-w-[260px] h-64 select-none"
            role="img"
            aria-label={`Human body ${sex} ${viewSide} anatomy`}
          >
            <g transform={figureTransform}>
              {muscles.map((m) => {
                const zone = resolveZoneForMuscleId(m.id);
                const isNeutral = zone === "neutral";
                if (isNeutral) {
                  return (
                    <path
                      key={m.id}
                      d={m.path}
                      fill={ZONE_COLORS.neutral}
                      fillOpacity={0.38}
                      stroke="#ffffff"
                      strokeWidth={0.14}
                      strokeOpacity={0.7}
                      pointerEvents="none"
                    />
                  );
                }

                const color = ZONE_COLORS[zone];
                const isGoal = goalMuscleIds.has(m.id);
                const isCalloutActive = activeCalloutIds.has(m.id);
                const matchesZone = selectedZone === "full" || zone === selectedZone;

                let fillOpacity = matchesZone ? 0.56 : 0.14;
                if (isGoal && matchesZone) fillOpacity = 0.86;
                if (activeCalloutObj) {
                  fillOpacity = isCalloutActive ? 1 : 0.16;
                }

                return (
                  <path
                    key={m.id}
                    d={m.path}
                    fill={color}
                    fillOpacity={fillOpacity}
                    stroke={isCalloutActive ? "#0f172a" : isGoal ? color : "#ffffff"}
                    strokeWidth={isCalloutActive ? 0.42 : isGoal ? 0.28 : 0.14}
                    strokeOpacity={isCalloutActive ? 0.95 : 0.7}
                    className="cursor-pointer transition-opacity duration-150"
                    onClick={() => {
                      setSelectedCallout(null);
                      setSelectedZone((prev) => (prev === zone ? "full" : zone));
                    }}
                  />
                );
              })}
            </g>

            {callouts.map((c) => {
              const color = ZONE_COLORS[c.zone];
              const isSelected = activeCalloutId === c.id;
              const matchesZone = selectedZone === "full" || c.zone === selectedZone;
              const hasGoal = c.muscleIds.some((id) => goalMuscleIds.has(id));
              const hasInjury = c.muscleIds.some((id) => injuryMuscleIds.has(id));
              const [ax, ay] = c.anchor;
              const py = c.pillY;

              return (
                <g
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Highlight ${c.label}`}
                  className="cursor-pointer outline-none"
                  opacity={matchesZone || isSelected ? 1 : 0.38}
                  onMouseEnter={() => setHoveredCallout(c.id)}
                  onMouseLeave={() => setHoveredCallout(null)}
                  onClick={() => setSelectedCallout((prev) => (prev === c.id ? null : c.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCallout((prev) => (prev === c.id ? null : c.id));
                    }
                  }}
                >
                  <polyline
                    points={`${ax},${ay} ${elbowX},${py} ${pillX},${py}`}
                    fill="none"
                    stroke={isSelected ? color : "#cbd5e1"}
                    strokeWidth={isSelected ? 0.55 : 0.35}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx={ax} cy={ay} r={isSelected ? 0.95 : 0.65} fill={color} />
                  <rect
                    x={pillX}
                    y={py - 4.4}
                    width={36}
                    height={8.8}
                    rx={4.4}
                    fill={isSelected ? color : "#ffffff"}
                    stroke={hasInjury ? "#f59e0b" : isSelected ? color : "#e2e8f0"}
                    strokeWidth={hasInjury || isSelected ? 0.5 : 0.35}
                  />
                  {(hasGoal || hasInjury) && (
                    <circle
                      cx={pillX + 4}
                      cy={py}
                      r={1.35}
                      fill={isSelected ? "#ffffff" : hasInjury ? "#f59e0b" : color}
                    />
                  )}
                  <text
                    x={pillX + (hasGoal || hasInjury ? 7.2 : 4.2)}
                    y={py + 1.35}
                    fontSize={3.9}
                    fontWeight={isSelected ? 700 : 600}
                    fill={isSelected ? "#ffffff" : "#1e293b"}
                  >
                    {c.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-4">
          {zoneInjuries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {zoneInjuries.map((inj, idx) => (
                <span
                  key={`${inj.muscleGroup}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--color-effort-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-effort-ink)]"
                >
                  <AlertTriangle size={12} />
                  Active injury: {formatMuscleLabel(inj.muscleGroup)}
                </span>
              ))}
            </div>
          )}

          {preferredMuscleGroups.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-neutral-500 mr-1">Focus:</span>
              {preferredMuscleGroups.map((group) => (
                <span
                  key={group}
                  className="rounded-full bg-[var(--color-action-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-action-ink)]"
                >
                  {formatMuscleLabel(group)}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3">
              <span className="text-[11px] font-medium text-neutral-500">Weight</span>
              <p className="mt-0.5 font-display text-base font-bold text-[var(--color-text)] tabular-nums">
                {weightKg >= 20 ? `${weightKg} kg` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3">
              <span className="text-[11px] font-medium text-neutral-500">Height</span>
              <p className="mt-0.5 font-display text-base font-bold text-[var(--color-text)] tabular-nums">
                {heightCm >= 100 ? `${heightCm} cm` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-neutral-500">BMI</span>
                {bmi > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      bmiInfo.tone === "recovery"
                        ? "bg-[var(--color-recovery-soft)] text-[var(--color-recovery-ink)]"
                        : bmiInfo.tone === "effort"
                          ? "bg-[var(--color-effort-soft)] text-[var(--color-effort-ink)]"
                          : "bg-[var(--color-action-soft)] text-[var(--color-action-ink)]"
                    }`}
                  >
                    {bmiInfo.label}
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-display text-base font-bold text-[var(--color-text)] tabular-nums">
                {bmi > 0 ? bmi : "—"}
              </p>
            </div>
          </div>

          {weightKg > 0 && bodyFatPercent > 0 ? (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-neutral-600">Estimated Composition</span>
                <span className="text-[11px] text-neutral-500">
                  Lean {leanMassKg} kg · Fat {fatMassKg} kg
                </span>
              </div>
              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="bg-[var(--color-action)] transition-all"
                  style={{ width: `${leanPct}%` }}
                  title={`Lean mass: ${leanMassKg} kg (${leanPct}%)`}
                />
                <div
                  className="bg-[var(--color-effort)] transition-all"
                  style={{ width: `${bodyFatPercent}%` }}
                  title={`Fat mass: ${fatMassKg} kg (${bodyFatPercent}%)`}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500">
              Log weight &amp; body fat % to see your lean vs. fat mass breakdown.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
