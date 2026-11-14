import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LAB_EXERCISES_META } from "@/features/lab/model/lab-catalog";
import { loadLabExerciseBySlug } from "@/features/lab/server/load-lab-catalog";
import { JsonLdScript } from "@/features/lab/ui/json-ld-script";
import { PublicLabShell } from "@/features/lab/ui/public-lab-shell";
import {
  buildBreadcrumbJsonLd,
  buildExerciseHowToJsonLd,
  buildFaqPageJsonLd,
} from "@/shared/seo/structured-data";

interface ExercisePageProps {
  params: Promise<{ slug: string }>;
}

function generateStaticParams() {
  return LAB_EXERCISES_META.map((item) => ({ slug: item.slug }));
}

async function generateMetadata({ params }: ExercisePageProps): Promise<Metadata> {
  const { slug } = await params;
  const exercise = await loadLabExerciseBySlug(slug);
  if (!exercise) {
    return {};
  }

  const title = `${exercise.displayName} Biomechanical Form Rules & Angles`;
  return {
    title,
    description: exercise.answerSummary,
    alternates: {
      canonical: `/lab/${exercise.slug}`,
    },
    openGraph: {
      url: `/lab/${exercise.slug}`,
      title: `${title} · FITAI`,
      description: exercise.answerSummary,
    },
  };
}

function formatRangeBounds(min: number | null, max: number | null): string {
  if (min !== null && max !== null) {
    return `${min} – ${max}`;
  }
  if (min !== null) {
    return `>= ${min}`;
  }
  if (max !== null) {
    return `<= ${max}`;
  }
  return "N/A";
}

export default async function LabExerciseDetailPage({ params }: ExercisePageProps) {
  const { slug } = await params;
  const exercise = await loadLabExerciseBySlug(slug);
  if (!exercise) {
    notFound();
  }

  const breadcrumbData = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Movement Lab", path: "/lab" },
    { name: exercise.displayName, path: `/lab/${exercise.slug}` },
  ]);
  const howToData = buildExerciseHowToJsonLd(exercise);
  const faqData = buildFaqPageJsonLd(exercise.faqs);

  const related = LAB_EXERCISES_META.filter(
    (item) => item.slug !== exercise.slug && item.category === exercise.category,
  ).slice(0, 3);

  return (
    <PublicLabShell>
      <JsonLdScript data={breadcrumbData} />
      <JsonLdScript data={howToData} />
      <JsonLdScript data={faqData} />

      <div className="space-y-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-neutral-600">
          <Link
            className="inline-flex items-center gap-1 hover:text-[var(--color-action)]"
            href="/lab"
          >
            <ArrowLeft aria-hidden="true" size={14} /> Movement Lab
          </Link>
          <span>/</span>
          <span className="font-medium text-neutral-900">{exercise.displayName}</span>
        </nav>

        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="rounded-md bg-white px-2.5 py-1 font-semibold text-neutral-800 border border-neutral-200">
              {exercise.category}
            </span>
            <span className="rounded-md bg-white px-2.5 py-1 text-neutral-600 border border-neutral-200">
              Mode: {exercise.repType}
            </span>
            <span className="rounded-md bg-white px-2.5 py-1 text-neutral-600 border border-neutral-200">
              Camera: {exercise.cameraView}
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            {exercise.displayName} Form Rules &amp; Joint Angles
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-neutral-700 sm:text-lg">
            {exercise.answerSummary}
          </p>
          {exercise.notes ? (
            <p className="max-w-3xl rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
              {exercise.notes}
            </p>
          ) : null}
        </header>

        <section
          aria-labelledby="phase-detection-heading"
          className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8"
        >
          <h2 className="font-display text-2xl font-bold" id="phase-detection-heading">
            How does FITAI detect {exercise.displayName} rep phases?
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Primary metric: <code className="font-mono font-semibold">{exercise.phaseMetric}</code>{" "}
            using landmarks {exercise.phaseLandmarks.join(", ") || "body keypoints"}.
          </p>
          {exercise.phaseFormula ? (
            <pre className="mt-3 overflow-x-auto rounded-xl bg-neutral-100 p-3 font-mono text-xs text-neutral-800">
              {exercise.phaseFormula}
            </pre>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 font-mono text-xs uppercase text-neutral-500">
                  <th className="py-2.5 pr-4">Phase</th>
                  <th className="py-2.5 pr-4">Threshold</th>
                  <th className="py-2.5">Coaching Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {exercise.phases.map((phase) => (
                  <tr id={`phase-${phase.name.toLowerCase()}`} key={phase.name}>
                    <td className="py-3 pr-4 font-mono font-semibold text-neutral-900">
                      {phase.name}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[var(--color-action)]">
                      {phase.condition}
                    </td>
                    <td className="py-3 text-neutral-600">{phase.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="form-rules-heading" className="space-y-4">
          <h2 className="font-display text-2xl font-bold" id="form-rules-heading">
            Biomechanical Error Guardrails ({exercise.formRules.length} rules)
          </h2>

          <div className="grid gap-4">
            {exercise.formRules.map((rule) => (
              <article
                className="rounded-2xl border border-neutral-200 bg-white p-6"
                key={rule.metric}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-mono text-lg font-bold text-neutral-900">{rule.metric}</h3>
                  <span className="rounded-md bg-neutral-100 px-2.5 py-0.5 font-mono text-xs text-neutral-700">
                    View: {rule.view} · Phases: {rule.phases.join(", ")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-700">{rule.description}</p>
                {rule.formula ? (
                  <pre className="mt-3 overflow-x-auto rounded-xl bg-neutral-100 p-3 font-mono text-xs text-neutral-800">
                    {rule.formula}
                  </pre>
                ) : null}

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 font-mono text-xs uppercase text-neutral-500">
                        <th className="py-2 pr-4">Severity</th>
                        <th className="py-2 pr-4">Range</th>
                        <th className="py-2">Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {rule.ranges.map((range) => (
                        <tr key={`${rule.metric}-${range.status}-${range.severity}`}>
                          <td className="py-2.5 pr-4 font-mono font-semibold">{range.status}</td>
                          <td className="py-2.5 pr-4 font-mono">
                            {formatRangeBounds(range.min, range.max)}
                          </td>
                          <td className="py-2.5 text-neutral-600">{range.comment ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {rule.coachingCues.length > 0 ? (
                  <div className="mt-4 rounded-xl bg-neutral-50 p-3 text-sm text-neutral-700">
                    <p className="font-mono text-xs font-semibold uppercase text-neutral-500">
                      Real-time Voice Cues
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5">
                      {rule.coachingCues.map((cue) => (
                        <li key={cue}>{cue}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="exercise-faq-heading"
          className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8"
        >
          <h2 className="font-display text-2xl font-bold" id="exercise-faq-heading">
            {exercise.displayName} FAQ
          </h2>
          <dl className="mt-5 divide-y divide-neutral-100">
            {exercise.faqs.map((faq) => (
              <div className="py-4 first:pt-0 last:pb-0" key={faq.question}>
                <dt className="font-semibold text-neutral-900">{faq.question}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-neutral-600">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        {related.length > 0 ? (
          <section aria-labelledby="related-exercises-heading" className="space-y-4">
            <h2 className="font-display text-xl font-bold" id="related-exercises-heading">
              More {exercise.category} Specs
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 text-sm font-semibold hover:border-[var(--color-action)]"
                  href={`/lab/${item.slug}`}
                  key={item.slug}
                >
                  <span className="capitalize">{item.slug.replaceAll("-", " ")}</span>
                  <ArrowRight aria-hidden="true" size={14} />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PublicLabShell>
  );
}

export { generateMetadata, generateStaticParams };
