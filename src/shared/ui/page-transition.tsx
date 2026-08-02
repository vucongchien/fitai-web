import { ViewTransition, type ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <ViewTransition
      default="none"
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        "nav-lateral": "nav-lateral",
        "workout-complete": "workout-complete",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        "nav-lateral": "nav-lateral",
        "workout-complete": "workout-complete",
        default: "none",
      }}
    >
      <div className={className}>{children}</div>
    </ViewTransition>
  );
}
