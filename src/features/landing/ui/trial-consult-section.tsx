"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { FitAiMascotSvg } from "@/shared/ui/fitai-mascot-svg";

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
            <FitAiMascotSvg className="h-28 w-28" />
            <div className="space-y-2 max-w-xl">
              <h1 className="fl-h2" id="trial-consult-heading">
                Ready for your 4-week plan?
              </h1>
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
