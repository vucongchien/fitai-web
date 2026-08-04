import { Check, ChevronRight, Moon, Play, SkipForward } from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";

import { cn } from "@/shared/lib/cn";
import type { SessionSummary } from "@/shared/lib/demo-data";

type WeekRouteProps = {
  morphNextSession?: boolean;
  sessions: SessionSummary[];
};

const statusLabel = {
  complete: "Completed",
  next: "Next session",
  planned: "Planned",
  rest: "Recovery",
  skipped: "Skipped",
} as const;

function StatusIcon({ status }: { status: SessionSummary["status"] }) {
  if (status === "complete") return <Check aria-hidden="true" size={15} />;
  if (status === "rest") return <Moon aria-hidden="true" size={14} />;
  if (status === "skipped") return <SkipForward aria-hidden="true" size={14} />;
  if (status === "next") return <Play aria-hidden="true" size={14} />;
  return <span aria-hidden="true" className="week-route__planned-dot" />;
}

export function WeekRoute({ morphNextSession = true, sessions }: WeekRouteProps) {
  return (
    <ol className="week-route">
      {sessions.map((session) => {
        const content = (
          <>
            <span className="week-route__marker">
              <StatusIcon status={session.status} />
            </span>
            <div className="week-route__date">
              <strong>{session.day}</strong>
              <span>{session.date}</span>
            </div>
            <div className="week-route__session">
              <ViewTransition
                default="none"
                name={
                  morphNextSession && session.status === "next"
                    ? `session-plan-${session.id}`
                    : undefined
                }
                share={morphNextSession && session.status === "next" ? "session-morph" : undefined}
              >
                <strong>{session.title}</strong>
              </ViewTransition>
              <span>
                {statusLabel[session.status]} · {session.time}
              </span>
            </div>
            {session.status !== "rest" ? (
              <ChevronRight aria-hidden="true" className="week-route__chevron" size={18} />
            ) : null}
          </>
        );

        return (
          <li
            className={cn("week-route__item", `week-route__item--${session.status}`)}
            key={session.id}
          >
            {session.status === "rest" ? (
              <div className="week-route__row">{content}</div>
            ) : (
              <Link
                aria-label={`View ${session.title}`}
                className="week-route__row"
                href={`/roadmap/${session.id}`}
                transitionTypes={["nav-forward"]}
              >
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
