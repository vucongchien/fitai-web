import { ViewTransition } from "react";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Named transitions are symmetric: the class applied on the way in is the one
// Applied on the way out. Hoisted so the map is allocated once, not per render.
const NAMED_TRANSITIONS = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  "nav-lateral": "nav-lateral",
  "workout-complete": "workout-complete",
  default: "none",
};

export function PageTransition({ children, className }: PageTransitionProps) {
  if (!ViewTransition) {
    return <div className={className}>{children}</div>;
  }

  return (
    <ViewTransition default="none" enter={NAMED_TRANSITIONS} exit={NAMED_TRANSITIONS}>
      <div className={className}>{children}</div>
    </ViewTransition>
  );
}
