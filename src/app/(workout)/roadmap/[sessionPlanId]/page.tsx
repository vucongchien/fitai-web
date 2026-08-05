import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Suspense, ViewTransition } from "react";

import { getSessionPlanPageData } from "@/shared/api/bff/roadmap/queries";
import { BrandMark } from "@/shared/ui/brand-mark";
import { buttonVariants } from "@/shared/ui/button";
import { HeaderActions } from "@/shared/ui/header-actions";
import { PageTransition } from "@/shared/ui/page-transition";
import { TripleLane } from "@/shared/ui/triple-lane";

export const metadata = { title: "Prepare for your session" };

const featureIconMap = {
  camera: Camera,
  zap: Gauge, // fallback
  info: ShieldCheck, // fallback
} as const;

async function PrepContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ sessionPlanId: string }>;
}) {
  const { sessionPlanId } = await paramsPromise;
  const data = await getSessionPlanPageData(sessionPlanId);

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
            name={`session-plan-${sessionPlanId}`}
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
          transitionTypes={["nav-forward"]}
        >
          Begin session
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </footer>
    </>
  );
}

function PrepSkeleton() {
  return (
    <div className="workout-prep-skeleton" style={{ padding: "2rem 1rem" }}>
      <div
        className="skeleton-box"
        style={{
          height: "180px",
          width: "100%",
          borderRadius: "12px",
          marginBottom: "1rem",
          background: "var(--color-surface-hover, #eee)",
        }}
      />
      <div
        className="skeleton-box"
        style={{
          height: "240px",
          width: "100%",
          borderRadius: "12px",
          background: "var(--color-surface-hover, #eee)",
        }}
      />
    </div>
  );
}

export default function WorkoutPreparationPage({
  params,
}: {
  params: Promise<{ sessionPlanId: string }>;
}) {
  return (
    <PageTransition className="workout-prep-page">
      <header className="focused-header">
        <Link
          aria-label="Back to roadmap"
          className="focused-header__back"
          href="/roadmap"
          transitionTypes={["nav-back"]}
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <BrandMark />
        <HeaderActions />
      </header>

      <Suspense fallback={<PrepSkeleton />}>
        <PrepContent paramsPromise={params} />
      </Suspense>
    </PageTransition>
  );
}
