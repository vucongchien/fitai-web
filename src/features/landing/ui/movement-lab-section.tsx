"use client";

import { useState } from "react";

import {
  BIOMECHANICAL_EXERCISES,
  SKELETON_BONE_PAIRS,
} from "@/features/landing/model/landing-data";
import type {
  ExercisePhaseFrame,
  ExerciseRuleId,
  JointPoint,
} from "@/features/landing/model/landing-data";
import { cn } from "@/shared/lib/cn";

const GRID_PATH =
  "M40 16V196M80 16V196M120 16V196M160 16V196M200 16V196M240 16V196M280 16V196M20 40H300M20 80H300M20 120H300M20 160H300";

function PoseFigureSvg({
  frame,
  exerciseName,
  isWarning,
}: {
  frame: ExercisePhaseFrame;
  exerciseName: string;
  isWarning: boolean;
}) {
  const joints = isWarning ? frame.jointsWarning : frame.jointsClean;
  const jointMap = new Map(joints.map((j) => [j.id, j]));
  const pt = (id: number): JointPoint | undefined => jointMap.get(id);

  return (
    <svg
      aria-label={`${exerciseName} biomechanical pose`}
      className="h-auto w-full max-w-[340px] select-none"
      role="img"
      viewBox="0 0 320 212"
    >
      <rect fill="#ffffff" height="212" rx="12" width="320" x="0" y="0" />
      <path d={GRID_PATH} stroke="#e6ecff" strokeDasharray="2 4" strokeWidth="1" />
      <line stroke="#c7d4ff" strokeWidth="1.5" x1="20" x2="300" y1="184" y2="184" />

      <g>
        {SKELETON_BONE_PAIRS.map(([a, b]) => {
          const j1 = pt(a);
          const j2 = pt(b);
          if (!j1 || !j2) {
            return null;
          }
          const warnBone =
            isWarning && (frame.warningJointIds.includes(a) || frame.warningJointIds.includes(b));
          return (
            <line
              className="fl-skeleton-bone"
              key={`${a}-${b}`}
              style={warnBone ? { stroke: "var(--color-danger)" } : undefined}
              x1={j1.x}
              x2={j2.x}
              y1={j1.y}
              y2={j2.y}
            />
          );
        })}

        {joints.map((j) => (
          <circle className="fl-skeleton-joint" cx={j.x} cy={j.y} key={j.id} r={4.5} />
        ))}

        <g transform={`translate(${frame.angleArc.bx + 14}, ${frame.angleArc.by - 12})`}>
          <rect
            fill="#ffffff"
            height="22"
            rx="6"
            stroke={isWarning ? "var(--color-danger)" : "var(--color-action)"}
            strokeWidth="1"
            width="48"
            x="0"
            y="0"
          />
          <text
            fill="var(--color-text)"
            fontFamily="var(--font-mono)"
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
            x="24"
            y="15"
          >
            {frame.primaryAngleDeg}°
          </text>
        </g>
      </g>
    </svg>
  );
}

export function MovementLabSection() {
  const [exerciseId, setExerciseId] = useState<ExerciseRuleId>("squat");
  const [isWarning, setIsWarning] = useState(false);

  const exercise =
    BIOMECHANICAL_EXERCISES.find((item) => item.id === exerciseId) ?? BIOMECHANICAL_EXERCISES[0];
  if (!exercise) {
    return null;
  }

  const frame = exercise.phases.ACTIVE;
  const cue = isWarning ? frame.warningCue : frame.cleanCue;

  return (
    <section aria-labelledby="movement-lab-heading" className="fl-section" id="movement-lab">
      <div className="fl-container fl-compact-row">
        <div className="fl-section-head">
          <span className="fl-kicker">FORM ASSESSMENT</span>
          <h2 className="fl-h2" id="movement-lab-heading">
            Real-time joint tracking, or manual logging.
          </h2>
          <div className="fl-pill-row">
            <div aria-label="Exercise" className="fl-seg-group" role="group">
              {BIOMECHANICAL_EXERCISES.map((ex) => (
                <button
                  aria-pressed={exerciseId === ex.id}
                  className={cn(
                    "fl-seg-btn min-h-11",
                    exerciseId === ex.id && "fl-seg-btn--active",
                  )}
                  key={ex.id}
                  onClick={() => setExerciseId(ex.id)}
                  type="button"
                >
                  {ex.name}
                </button>
              ))}
            </div>
            <div aria-label="Form state" className="fl-seg-group" role="group">
              <button
                aria-pressed={!isWarning}
                className={cn("fl-seg-btn min-h-11", !isWarning && "fl-seg-btn--active")}
                onClick={() => setIsWarning(false)}
                type="button"
              >
                Clean
              </button>
              <button
                aria-pressed={isWarning}
                className={cn("fl-seg-btn min-h-11", isWarning && "fl-seg-btn--active")}
                onClick={() => setIsWarning(true)}
                type="button"
              >
                Alert
              </button>
            </div>
          </div>
          <p className={cn("fl-cue-pill", isWarning && "fl-cue-pill--warn")}>{cue}</p>
        </div>

        <div className="fl-stage-card fl-stage-card--compact">
          <PoseFigureSvg exerciseName={exercise.name} frame={frame} isWarning={isWarning} />
        </div>
      </div>
    </section>
  );
}
