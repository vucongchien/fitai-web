import { ArrowRight, Clock3, Gauge } from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";

import type { SessionSummary } from "@/shared/lib/demo-data";
import { buttonVariants } from "@/shared/ui/button";
import { TripleLane } from "@/shared/ui/triple-lane";

type NextSessionPanelProps = {
  session: SessionSummary;
};

export function NextSessionPanel({ session }: NextSessionPanelProps) {
  return (
    <section className="next-session-panel">
      <div className="next-session-panel__route">
        <TripleLane labelled morph />
      </div>
      <div className="next-session-panel__content">
        <p className="utility-label">Week 2 · Build capacity</p>
        <ViewTransition default="none" name={`session-plan-${session.id}`} share="session-morph">
          <h1>{session.title}</h1>
        </ViewTransition>
        <div className="session-facts" aria-label="Session details">
          <span>
            <Clock3 aria-hidden="true" size={17} />
            {session.duration} min
          </span>
          <span>
            <Gauge aria-hidden="true" size={17} />
            Target {session.targetRpe} RPE
          </span>
        </div>
        <p className="next-session-panel__muscles">{session.muscles.join(" · ")}</p>
        <Link
          className={buttonVariants({ size: "large", variant: "primary" })}
          href={`/roadmap/${session.id}`}
          transitionTypes={["nav-forward"]}
        >
          Begin session
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </div>
    </section>
  );
}
