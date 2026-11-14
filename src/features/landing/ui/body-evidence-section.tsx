"use client";

import { FRONT_MUSCLES } from "body-muscles";
import { MoveHorizontal } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { LANDING_MUSCLE_LOAD } from "@/features/landing/model/landing-data";
import {
  FRONT_CALLOUTS,
  type MuscleCallout,
  resolveMuscleIdsForGroup,
  resolveZoneForMuscleId,
  ZONE_COLORS,
} from "@/features/progress/model/body-muscles";

const LOAD_BY_SVG_ID = new Map<string, number>();
for (const entry of Object.values(LANDING_MUSCLE_LOAD)) {
  for (const svgId of resolveMuscleIdsForGroup(entry.muscleName)) {
    const existing = LOAD_BY_SVG_ID.get(svgId) ?? 0;
    if (entry.loadScore > existing) {
      LOAD_BY_SVG_ID.set(svgId, entry.loadScore);
    }
  }
}

export function BodyEvidenceSection() {
  const [selectedCallout, setSelectedCallout] = useState<string | null>(null);
  const [hoveredCallout, setHoveredCallout] = useState<string | null>(null);
  const [sliderPercent, setSliderPercent] = useState(50);

  const activeCalloutId = hoveredCallout ?? selectedCallout;
  const activeCalloutObj: MuscleCallout | undefined = FRONT_CALLOUTS.find(
    (c) => c.id === activeCalloutId,
  );
  const activeCalloutIds = new Set(activeCalloutObj?.muscleIds ?? []);

  return (
    <section aria-labelledby="body-evidence-heading" className="fl-section" id="body-evidence">
      <div className="fl-container fl-stack-lg">
        <div className="fl-section-head">
          <span className="fl-kicker">PROGRESS TRACKING</span>
          <h2 className="fl-h2" id="body-evidence-heading">
            Track every muscle and milestone.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-neutral-50/70 px-4 py-5 border border-neutral-200">
            <svg
              viewBox="0 0 86 93"
              className="w-full max-w-[320px] h-80 select-none"
              role="img"
              aria-label="Interactive human body muscle anatomy"
            >
              <g>
                {FRONT_MUSCLES.map((m) => {
                  const zone = resolveZoneForMuscleId(m.id);
                  if (zone === "neutral") {
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
                  const isCalloutActive = activeCalloutIds.has(m.id);
                  const muscleLoadScore = LOAD_BY_SVG_ID.get(m.id) ?? 0;
                  const baseOpacity = 0.25 + (muscleLoadScore / 10) * 0.75;
                  const fillOpacity = activeCalloutObj ? (isCalloutActive ? 1 : 0.16) : baseOpacity;

                  return (
                    <path
                      key={m.id}
                      d={m.path}
                      fill={color}
                      fillOpacity={fillOpacity}
                      stroke={isCalloutActive ? "#0f172a" : "#ffffff"}
                      strokeWidth={isCalloutActive ? 0.42 : 0.14}
                      strokeOpacity={isCalloutActive ? 0.95 : 0.7}
                      className="cursor-pointer transition-opacity duration-150"
                      onClick={() => {
                        const match = FRONT_CALLOUTS.find((c) => c.muscleIds.includes(m.id));
                        if (match) {
                          setSelectedCallout((prev) => (prev === match.id ? null : match.id));
                        }
                      }}
                    />
                  );
                })}
              </g>

              {FRONT_CALLOUTS.map((c) => {
                const color = ZONE_COLORS[c.zone];
                const isSelected = activeCalloutId === c.id;
                const [ax, ay] = c.anchor;
                const py = c.pillY;

                return (
                  <g
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Highlight ${c.label}`}
                    className="cursor-pointer outline-none"
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
                      points={`${ax},${ay} 41,${py} 48,${py}`}
                      fill="none"
                      stroke={isSelected ? color : "#cbd5e1"}
                      strokeWidth={isSelected ? 0.55 : 0.35}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx={ax} cy={ay} r={isSelected ? 0.95 : 0.65} fill={color} />
                    <rect
                      x={48}
                      y={py - 4.4}
                      width={36}
                      height={8.8}
                      rx={4.4}
                      fill={isSelected ? color : "#ffffff"}
                      stroke={isSelected ? color : "#e2e8f0"}
                      strokeWidth={isSelected ? 0.5 : 0.35}
                    />
                    <text
                      x={52.2}
                      y={py + 1.35}
                      fontSize={3.6}
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

          <section
            aria-label="Progress photo comparison"
            className="w-full max-w-[440px] justify-self-center md:justify-self-start rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-3"
          >
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[var(--color-text)]">
                Transformation Gallery
              </h3>
              <p className="text-xs text-neutral-500">
                Drag the slider to compare Before &amp; After check-ins
              </p>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-200 select-none">
              <Image
                src="/images/landing/after-checkin.jpg"
                alt="After photo from Week 8"
                fill
                unoptimized
                sizes="(max-width: 640px) 100vw, 440px"
                className="object-cover"
              />

              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPercent}% 0 0)` }}
              >
                <Image
                  src="/images/landing/before-checkin.jpg"
                  alt="Before photo from Week 1"
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 440px"
                  className="object-cover"
                />
              </div>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-white shadow-md"
                style={{ left: `${sliderPercent}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg ring-2 ring-neutral-900/10">
                  <MoveHorizontal size={16} />
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={sliderPercent}
                onChange={(e) => setSliderPercent(Number(e.target.value))}
                aria-label="Before and after comparison slider"
                className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
              />

              <div className="pointer-events-none absolute top-3 left-3 rounded-lg bg-neutral-900/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                Before · Week 1 (74.5 kg)
              </div>
              <div className="pointer-events-none absolute top-3 right-3 rounded-lg bg-[var(--color-action)]/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                After · Week 8 (70 kg)
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
