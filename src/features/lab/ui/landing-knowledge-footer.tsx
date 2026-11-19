import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { KNOWLEDGE_GUIDES } from "@/features/lab/model/guides-data";
import { LAB_EXERCISES_META } from "@/features/lab/model/lab-catalog";
import { LANDING_FAQS } from "@/features/lab/model/landing-faqs";
import { BrandMark } from "@/shared/ui/brand-mark";

function LandingKnowledgeFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="fl-container space-y-10 py-12">
        <section aria-labelledby="landing-faq-heading" className="space-y-4">
          <p className="fl-kicker">COMMON QUESTIONS</p>
          <h2
            className="font-display text-2xl font-bold tracking-tight text-neutral-900"
            id="landing-faq-heading"
          >
            How FITAI works in practice
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {LANDING_FAQS.map((faq) => (
              <article
                className="rounded-2xl border border-neutral-200 bg-[var(--color-canvas)] p-5"
                key={faq.question}
              >
                <h3 className="text-sm font-bold text-neutral-900">{faq.question}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 pt-8">
          <div className="space-y-1">
            <p className="fl-kicker">OPEN KNOWLEDGE &amp; MOVEMENT LAB</p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
              Inspect every biomechanical rule behind FITAI.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 hover:border-[var(--color-action)]"
              href="/lab/glossary"
            >
              <span>Biomechanics Glossary</span>
            </Link>
            <Link
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 hover:border-[var(--color-action)]"
              href="/lab"
            >
              <span>Browse all 12 exercises</span>
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
        </div>

        <div className="grid gap-8 border-t border-neutral-100 pt-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Biomechanical Form Specs (12 Exercises)
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              {LAB_EXERCISES_META.map((item) => (
                <li key={item.slug}>
                  <Link
                    className="capitalize text-neutral-700 hover:text-[var(--color-action)] hover:underline"
                    href={`/lab/${item.slug}`}
                  >
                    {item.slug.replaceAll("-", " ")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Architecture Guides &amp; Feeds
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {KNOWLEDGE_GUIDES.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    className="text-neutral-700 hover:text-[var(--color-action)] hover:underline"
                    href={`/guides/${guide.slug}`}
                  >
                    {guide.title}
                  </Link>
                </li>
              ))}
              <li className="flex flex-wrap gap-3 pt-1 font-mono text-xs text-neutral-500">
                <Link className="hover:text-[var(--color-action)] hover:underline" href="/guides">
                  All Guides
                </Link>
                <Link
                  className="hover:text-[var(--color-action)] hover:underline"
                  href="/feed.xml"
                  prefetch={false}
                >
                  RSS
                </Link>
                <Link
                  className="hover:text-[var(--color-action)] hover:underline"
                  href="/knowledge.json"
                  prefetch={false}
                >
                  knowledge.json
                </Link>
                <Link
                  className="hover:text-[var(--color-action)] hover:underline"
                  href="/llms-full.txt"
                  prefetch={false}
                >
                  llms-full.txt
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 pt-6">
          <BrandMark href="/" />
          <p className="text-xs text-neutral-600">
            FITAI provides AI-assisted training guidance, not medical diagnosis.
          </p>
        </div>
      </div>
    </footer>
  );
}

export { LandingKnowledgeFooter };
