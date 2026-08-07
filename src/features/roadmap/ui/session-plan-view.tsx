import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Gauge,
  Info,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";

import type { SessionPlanPageData } from "@/features/roadmap/model/roadmap-page.types";
import { buttonVariants } from "@/shared/ui/button";
import { NAV_FORWARD } from "@/shared/ui/transition-types";
import { TripleLane } from "@/shared/ui/triple-lane";

type SessionPlanViewProps = {
  data: SessionPlanPageData;
};

const featureIconMap = {
  camera: Camera,
  zap: Zap,
  info: Info,
} as const;

export function SessionPlanView({ data }: SessionPlanViewProps) {
  return (
    <>
      <main className="workout-prep-main">
        <section className="workout-prep-hero">
          <TripleLane active="move" morph />
          <p className="utility-label">
            {data.day ? `${data.day} · ${data.date}` : "Planned session"}
          </p>
          <ViewTransition
            default="none"
            name={`session-plan-${data.sessionPlanId}`}
            share="session-morph"
          >
            <h1>{data.title}</h1>
          </ViewTransition>
          <p>{data.sessionDescription}</p>
          <div className="session-facts">
            <span>
              <Clock3 aria-hidden="true" size={17} />
              {data.duration} min
            </span>
            <span>
              <Gauge aria-hidden="true" size={17} />
              Target {data.targetRpe} RPE
            </span>
          </div>
        </section>

        <div className="workout-prep-grid">
          <section className="exercise-list">
            <div className="content-section__header">
              <h2>Today&rsquo;s exercises</h2>
              <p>{data.exercises.length} movements</p>
            </div>
            <ol>
              {data.exercises.map((exercise, index) => (
                <li key={exercise.exerciseId}>
                  <span className="data-value">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{exercise.name}</strong>
                    <span>
                      {exercise.prescription} · {exercise.rest} rest
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="prep-aside">
            <section
              className={`prep-note${data.readinessNote.variant === "safe" ? " prep-note--safe" : ""}`}
            >
              <ShieldCheck aria-hidden="true" size={22} />
              <div>
                <h2>{data.readinessNote.title}</h2>
                <p>{data.readinessNote.description}</p>
              </div>
            </section>

            {data.featureNotes.map((note) => {
              const Icon = featureIconMap[note.icon] ?? Camera;
              return (
                <section className="prep-note" key={note.id}>
                  <Icon aria-hidden="true" size={22} />
                  <div>
                    <h2>{note.title}</h2>
                    <p>{note.description}</p>
                  </div>
                </section>
              );
            })}

            {data.preSessionChecks.length > 0 && (
              <section className="prep-checks">
                <h2>Before you begin</h2>
                {data.preSessionChecks.map((check, i) => (
                  <p key={i}>
                    <CheckCircle2 aria-hidden="true" size={17} /> {check}
                  </p>
                ))}
              </section>
            )}
          </aside>
        </div>
      </main>

      <footer className="workout-prep-action">
        <Link
          className={buttonVariants({ size: "large", variant: "primary" })}
          href={data.startWorkoutHref}
          transitionTypes={NAV_FORWARD}
        >
          Begin session
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </footer>
    </>
  );
}
