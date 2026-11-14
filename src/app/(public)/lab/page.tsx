import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { KNOWLEDGE_GUIDES } from "@/features/lab/model/guides-data";
import type { LabFaqItem } from "@/features/lab/model/lab-catalog";
import { loadAllLabExercises } from "@/features/lab/server/load-lab-catalog";
import { JsonLdScript } from "@/features/lab/ui/json-ld-script";
import { PublicLabShell } from "@/features/lab/ui/public-lab-shell";
import { buildBreadcrumbJsonLd, buildFaqPageJsonLd } from "@/shared/seo/structured-data";

export const metadata: Metadata = {
  title: "Movement Lab — 12 Biomechanical Exercise Specs",
  description:
    "Open biomechanical reference for 12 exercises in FITAI: joint-angle phase detection, mathematical formulas, form safety thresholds, and real-time coaching cues.",
  alternates: {
    canonical: "/lab",
  },
  openGraph: {
    url: "/lab",
    title: "FITAI Movement Lab — 12 Biomechanical Exercise Specs",
    description:
      "Explore joint-angle phase detection, mathematical formulas, and form rules used by FITAI.",
  },
};

const LAB_OVERVIEW_FAQS: readonly LabFaqItem[] = [
  {
    question: "How does FITAI evaluate exercise form in the Movement Lab?",
    answer:
      "FITAI runs on-device 17-keypoint pose detection via ONNX Runtime Web, smooths landmarks with a One-Euro Filter, and checks joint angles through a 3-phase rep state machine against deterministic Correct, Warning, and Danger thresholds.",
  },
  {
    question: "Which 12 exercises include full biomechanical rules?",
    answer:
      "The public Movement Lab documents Squat, Push-up, Plank, Deadlift, Lunge, Barbell Bench Press, Bicep Curl, Lateral Raise, Pull-up, Shoulder Press, Sit-up, and Triceps Dip.",
  },
  {
    question: "Is camera tracking mandatory to use FITAI?",
    answer:
      "No. Every FITAI workout preserves complete manual logging parity so you can track sets, reps, timed holds, and RPE even without camera permissions.",
  },
];

const BREADCRUMB_DATA = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Movement Lab", path: "/lab" },
]);

const FAQ_DATA = buildFaqPageJsonLd(LAB_OVERVIEW_FAQS);

export default async function MovementLabPage() {
  const exercises = await loadAllLabExercises();

  return (
    <PublicLabShell>
      <JsonLdScript data={BREADCRUMB_DATA} />
      <JsonLdScript data={FAQ_DATA} />

      <div className="space-y-12">
        <section className="space-y-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-action)]">
            PUBLIC BIOMECHANICAL LAB · 12 EXERCISES
          </p>
          <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
            How FITAI measures rep phases and joint-angle safety.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Every supported movement in FITAI runs against transparent geometric angle formulas and
            three-tier severity bands (Correct, Warning, Danger) inside the browser—with full manual
            logging parity whenever a camera is unavailable.
          </p>
        </section>

        <section aria-labelledby="lab-exercises-heading" className="space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              className="font-display text-2xl font-bold tracking-tight"
              id="lab-exercises-heading"
            >
              Exercise Rule Specifications
            </h2>
            <span className="font-mono text-xs text-neutral-500">
              {exercises.length} documented rulesets
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise) => (
              <Link
                className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-[var(--color-action)]"
                href={`/lab/${exercise.slug}`}
                key={exercise.slug}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-xs font-semibold text-neutral-700">
                      {exercise.category}
                    </span>
                    <span className="font-mono text-xs text-neutral-500">{exercise.repType}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold group-hover:text-[var(--color-action)]">
                    {exercise.displayName}
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {exercise.answerSummary}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 font-mono text-xs text-neutral-600">
                  <span>Metric: {exercise.phaseMetric}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-action)]">
                    Inspect <ArrowRight aria-hidden="true" size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="lab-guides-heading" className="space-y-5">
          <h2 className="font-display text-2xl font-bold tracking-tight" id="lab-guides-heading">
            Training &amp; AI Architecture Guides
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {KNOWLEDGE_GUIDES.map((guide) => (
              <Link
                className="rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-[var(--color-action)]"
                href={`/guides/${guide.slug}`}
                key={guide.slug}
              >
                <p className="font-mono text-xs font-semibold text-neutral-500">{guide.kicker}</p>
                <h3 className="mt-2 font-display text-lg font-bold">{guide.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{guide.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="lab-faq-heading"
          className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8"
        >
          <h2 className="font-display text-2xl font-bold tracking-tight" id="lab-faq-heading">
            Frequently Asked Questions
          </h2>
          <dl className="mt-5 divide-y divide-neutral-100">
            {LAB_OVERVIEW_FAQS.map((faq) => (
              <div className="py-4 first:pt-0 last:pb-0" key={faq.question}>
                <dt className="font-semibold text-neutral-900">{faq.question}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-neutral-600">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </PublicLabShell>
  );
}
