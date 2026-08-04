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
import { ViewTransition } from "react";

import { exercises, nextSession } from "@/shared/lib/demo-data";
import { BrandMark } from "@/shared/ui/brand-mark";
import { buttonVariants } from "@/shared/ui/button";
import { HeaderActions } from "@/shared/ui/header-actions";
import { PageTransition } from "@/shared/ui/page-transition";
import { TripleLane } from "@/shared/ui/triple-lane";

export const metadata = { title: "Prepare for your session" };

export default async function WorkoutPreparationPage({
  params,
}: {
  params: Promise<{ sessionPlanId: string }>;
}) {
  const { sessionPlanId } = await params;

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

      <main className="workout-prep-main">
        <section className="workout-prep-hero">
          <TripleLane active="move" morph />
          <p className="utility-label">Week 2 · Wednesday</p>
          <ViewTransition
            default="none"
            name={`session-plan-${sessionPlanId}`}
            share="session-morph"
          >
            <h1>{nextSession.title}</h1>
          </ViewTransition>
          <p>
            Build upper-body strength while keeping every rep steady enough to repeat next week.
          </p>
          <div className="session-facts">
            <span>
              <Clock3 aria-hidden="true" size={17} />
              {nextSession.duration} min
            </span>
            <span>
              <Gauge aria-hidden="true" size={17} />
              Target {nextSession.targetRpe} RPE
            </span>
          </div>
        </section>

        <div className="workout-prep-grid">
          <section className="exercise-list">
            <div className="content-section__header">
              <h2>Today&rsquo;s exercises</h2>
              <p>{exercises.length} movements</p>
            </div>
            <ol>
              {exercises.map((exercise, index) => (
                <li key={exercise.id}>
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
            <section className="prep-note prep-note--safe">
              <ShieldCheck aria-hidden="true" size={22} />
              <div>
                <h2>Ready to train</h2>
                <p>No active injury constraints affect today&rsquo;s exercise selection.</p>
              </div>
            </section>
            <section className="prep-note">
              <Camera aria-hidden="true" size={22} />
              <div>
                <h2>Manual logging is on</h2>
                <p>Camera coaching stays unavailable until its movement model is validated.</p>
              </div>
            </section>
            <section className="prep-checks">
              <h2>Before you begin</h2>
              <p>
                <CheckCircle2 aria-hidden="true" size={17} /> Clear enough space to move.
              </p>
              <p>
                <CheckCircle2 aria-hidden="true" size={17} /> Keep water within reach.
              </p>
              <p>
                <CheckCircle2 aria-hidden="true" size={17} /> Stop if new or sharp pain appears.
              </p>
            </section>
          </aside>
        </div>
      </main>

      <footer className="workout-prep-action">
        <Link
          className={buttonVariants({ size: "large", variant: "primary" })}
          href="/workouts/live/demo-session"
          transitionTypes={["nav-forward"]}
        >
          Begin session
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </footer>
    </PageTransition>
  );
}
