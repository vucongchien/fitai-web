"use client";

import { Check, Circle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/shared/ui/button";
import { NAV_FORWARD } from "@/shared/ui/transition-types";
import { TripleLane } from "@/shared/ui/triple-lane";

const stages = [
  { color: "plan", label: "Profile ready" },
  { color: "move", label: "Sessions arranged" },
  { color: "recover", label: "First week ready" },
] as const;

export function PlanningSequence() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setActiveStage(1), 650),
      window.setTimeout(() => setActiveStage(2), 1450),
      window.setTimeout(() => setActiveStage(3), 2250),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <div className="planning-sequence">
      <TripleLane
        active={activeStage >= 3 ? "all" : stages[Math.min(activeStage, 2)].color}
        morph
      />
      <div className="planning-sequence__copy">
        <h1>{activeStage >= 3 ? "Your first week is ready." : "Building a route you can keep."}</h1>
        <p>
          {activeStage >= 3
            ? "Start with a controlled week. FITAI will adjust later sessions as evidence arrives."
            : "FITAI is matching your goal, available days, equipment, and safety constraints."}
        </p>
      </div>
      <ul className="planning-stages">
        {stages.map((stage, index) => {
          const complete = activeStage > index;
          return (
            <li
              data-state={complete ? "complete" : activeStage === index ? "active" : "pending"}
              key={stage.label}
            >
              <span aria-hidden="true">
                {complete ? <Check size={15} /> : <Circle size={13} />}
              </span>
              {stage.label}
            </li>
          );
        })}
      </ul>
      {activeStage >= 3 ? (
        <Link
          className={buttonVariants({ size: "large", variant: "primary" })}
          href="/home"
          transitionTypes={NAV_FORWARD}
        >
          See my next session
        </Link>
      ) : (
        <p aria-live="polite" className="planning-live-status">
          {stages[Math.min(activeStage, 2)].label}
        </p>
      )}
    </div>
  );
}
