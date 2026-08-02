import { ViewTransition } from "react";

import { cn } from "@/shared/lib/cn";

type TripleLaneProps = {
  active?: "plan" | "move" | "recover" | "all";
  className?: string;
  compact?: boolean;
  labelled?: boolean;
  morph?: boolean;
};

export function TripleLane({
  active = "all",
  className,
  compact = false,
  labelled = false,
  morph = false,
}: TripleLaneProps) {
  const lane = (
    <div
      aria-label={labelled ? "Plan, move, recover" : undefined}
      aria-hidden={labelled ? undefined : true}
      className={cn("triple-lane", compact && "triple-lane--compact", className)}
      data-active={active}
      data-slot="triple-lane"
      role={labelled ? "img" : undefined}
    >
      <span
        className={cn(
          "triple-lane__row triple-lane__row--plan",
          !labelled && "triple-lane__row--plain",
        )}
      >
        {labelled ? <span className="triple-lane__label">Plan</span> : null}
        <span className="triple-lane__track" />
      </span>
      <span
        className={cn(
          "triple-lane__row triple-lane__row--move",
          !labelled && "triple-lane__row--plain",
        )}
      >
        {labelled ? <span className="triple-lane__label">Move</span> : null}
        <span className="triple-lane__track" />
      </span>
      <span
        className={cn(
          "triple-lane__row triple-lane__row--recover",
          !labelled && "triple-lane__row--plain",
        )}
      >
        {labelled ? <span className="triple-lane__label">Recover</span> : null}
        <span className="triple-lane__track" />
      </span>
      <span className="triple-lane__join" />
      <span className="triple-lane__marker" />
    </div>
  );

  if (!morph) return lane;

  return (
    <ViewTransition default="none" name="triple-lane" share="triple-lane-morph">
      {lane}
    </ViewTransition>
  );
}
