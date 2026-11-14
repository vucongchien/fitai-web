"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";

type GoalKey = "lose_fat" | "build_muscle" | "get_stronger";

const GOAL_DATA: Record<GoalKey, { label: string; mascotLine: string }> = {
  lose_fat: {
    label: "Lose Fat",
    mascotLine: "Let me generate your 4-week fat-loss plan & 1,850 kcal high-protein meals!",
  },
  build_muscle: {
    label: "Build Muscle",
    mascotLine: "Let me generate your 4-week hypertrophy plan & 2,350 kcal muscle-building meals!",
  },
  get_stronger: {
    label: "Get Stronger",
    mascotLine: "Let me generate your 4-week strength plan & 2,600 kcal recovery meals!",
  },
};

function FitAiMascotSvg() {
  return (
    <svg
      aria-label="FitAI waving mascot"
      className="h-28 w-28 shrink-0 select-none"
      role="img"
      viewBox="0 0 110 110"
    >
      <circle cx="55" cy="58" fill="#e6ecff" r="44" />
      <g className="fl-mascot-arm">
        <path
          d="M76 66 Q94 52 96 36"
          fill="none"
          stroke="#4b57f2"
          strokeLinecap="round"
          strokeWidth="10"
        />
        <circle cx="96" cy="34" fill="#25c77a" r="6.5" />
      </g>
      <path
        d="M34 66 Q20 72 22 82"
        fill="none"
        stroke="#4b57f2"
        strokeLinecap="round"
        strokeWidth="10"
      />
      <rect fill="#4b57f2" height="54" rx="26" width="52" x="29" y="34" />
      <rect fill="#25c77a" height="8" rx="4" width="52" x="29" y="42" />
      <circle cx="45" cy="58" fill="#ffffff" r="7" />
      <circle cx="65" cy="58" fill="#ffffff" r="7" />
      <circle cx="46" cy="58" fill="#0f172a" r="3.4" />
      <circle cx="66" cy="58" fill="#0f172a" r="3.4" />
      <path
        d="M47 71 Q55 78 63 71"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </svg>
  );
}

export function TrialConsultSection() {
  const [goal, setGoal] = useState<GoalKey>("build_muscle");

  return (
    <section
      aria-labelledby="trial-consult-heading"
      className="fl-section fl-section--surface"
      id="trial-consult"
    >
      <div className="fl-container fl-stack-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <FitAiMascotSvg />
            <div className="space-y-2 max-w-xl">
              <h2 className="fl-h2" id="trial-consult-heading">
                Ready for your 4-week plan?
              </h2>
              <div className="fl-speech-bubble" aria-live="polite">
                {GOAL_DATA[goal].mascotLine}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="fl-seg-group" role="group" aria-label="Consultation goal">
              {(Object.keys(GOAL_DATA) as GoalKey[]).map((key) => (
                <button
                  aria-pressed={goal === key}
                  className={cn(
                    "fl-seg-btn fl-duo-btn min-h-11",
                    goal === key && "fl-seg-btn--active",
                  )}
                  key={key}
                  onClick={() => setGoal(key)}
                  type="button"
                >
                  {GOAL_DATA[key].label}
                </button>
              ))}
            </div>

            <div className="fl-hero-actions">
              <Link className="fl-btn fl-btn-primary fl-duo-btn" href="/login">
                Start 4-week trial <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link className="fl-btn fl-btn-secondary fl-duo-btn" href="/home">
                Preview Today
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
