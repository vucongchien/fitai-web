import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LAB_GLOSSARY_FAQS, LAB_GLOSSARY_TERMS } from "@/features/lab/model/glossary-data";
import { JsonLdScript } from "@/features/lab/ui/json-ld-script";
import { PublicLabShell } from "@/features/lab/ui/public-lab-shell";
import {
  buildBreadcrumbJsonLd,
  buildDefinedTermSetJsonLd,
  buildFaqPageJsonLd,
} from "@/shared/seo/structured-data";

const metadata: Metadata = {
  title: "Biomechanics & Pose AI Glossary",
  description:
    "Canonical definitions for FITAI's 3-phase rep state machine, One-Euro Filter, Epley 1RM, 250% anomalous load guard, and 50% PR recovery rules.",
  alternates: {
    canonical: "/lab/glossary",
  },
  openGraph: {
    url: "/lab/glossary",
    title: "Biomechanics & Pose AI Glossary · FITAI",
    description:
      "Inspect exact biomechanical formulas, threshold definitions, and safety guardrails behind FITAI.",
  },
};

const BREADCRUMB_DATA = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Movement Lab", path: "/lab" },
  { name: "Glossary", path: "/lab/glossary" },
]);

const TERM_SET_DATA = buildDefinedTermSetJsonLd(LAB_GLOSSARY_TERMS);
const FAQ_DATA = buildFaqPageJsonLd(LAB_GLOSSARY_FAQS);

function LabGlossaryPage() {
  return (
    <PublicLabShell>
      <JsonLdScript data={BREADCRUMB_DATA} />
      <JsonLdScript data={TERM_SET_DATA} />
      <JsonLdScript data={FAQ_DATA} />

      <div className="space-y-12">
        <div className="space-y-4">
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-[var(--color-action)]"
            href="/lab"
          >
            <ArrowLeft aria-hidden="true" size={14} />
            <span>Back to Movement Lab</span>
          </Link>

          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-action)]">
            OPEN BIOMECHANICS GLOSSARY
          </p>
          <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Key terms, formulas, and guardrails behind FITAI.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Deterministic definitions shared across FITAI&apos;s browser pose referee, 4-week
            roadmap planner, and safety recovery rules.
          </p>
        </div>

        <section aria-labelledby="glossary-terms-heading" className="grid gap-4 md:grid-cols-2">
          <h2 className="sr-only" id="glossary-terms-heading">
            Defined biomechanical and training engineering terms
          </h2>
          {LAB_GLOSSARY_TERMS.map((item) => (
            <article
              className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6"
              id={item.id}
              key={item.id}
            >
              <div className="space-y-2.5">
                <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-neutral-600">
                  {item.category}
                </span>
                <h3 className="font-display text-lg font-bold text-neutral-900">{item.term}</h3>
                <p className="text-sm leading-relaxed text-neutral-700">{item.definition}</p>
              </div>
              <div className="mt-4 space-y-2 border-t border-neutral-100 pt-3">
                <p className="font-mono text-xs text-neutral-700">{item.formulaOrThreshold}</p>
                <Link
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-action)] hover:underline"
                  href={item.relatedPath}
                >
                  <span>{item.relatedLabel}</span>
                  <ArrowRight aria-hidden="true" size={12} />
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section aria-labelledby="glossary-faq-heading" className="space-y-4">
          <h2 className="font-display text-2xl font-bold" id="glossary-faq-heading">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {LAB_GLOSSARY_FAQS.map((faq) => (
              <article
                className="rounded-2xl border border-neutral-200 bg-white p-5"
                key={faq.question}
              >
                <h3 className="text-sm font-bold text-neutral-900">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PublicLabShell>
  );
}

export { LabGlossaryPage as default, metadata };
