import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getGuideBySlug, KNOWLEDGE_GUIDES } from "@/features/lab/model/guides-data";
import { JsonLdScript } from "@/features/lab/ui/json-ld-script";
import { PublicLabShell } from "@/features/lab/ui/public-lab-shell";
import {
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildTechArticleJsonLd,
} from "@/shared/seo/structured-data";

interface GuideDetailProps {
  params: Promise<{ slug: string }>;
}

function generateStaticParams() {
  return KNOWLEDGE_GUIDES.map((g) => ({ slug: g.slug }));
}

async function generateMetadata({ params }: GuideDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) {
    return {};
  }

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: `/guides/${guide.slug}`,
    },
    openGraph: {
      type: "article",
      url: `/guides/${guide.slug}`,
      title: `${guide.title} · FITAI`,
      description: guide.description,
    },
  };
}

export default async function GuideDetailPage({ params }: GuideDetailProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) {
    notFound();
  }

  const breadcrumbData = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: guide.title, path: `/guides/${guide.slug}` },
  ]);
  const articleData = buildTechArticleJsonLd(guide);
  const faqData = buildFaqPageJsonLd(guide.faqs);

  return (
    <PublicLabShell>
      <JsonLdScript data={breadcrumbData} />
      <JsonLdScript data={articleData} />
      <JsonLdScript data={faqData} />

      <article className="mx-auto max-w-3xl space-y-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-neutral-600">
          <Link
            className="inline-flex items-center gap-1 hover:text-[var(--color-action)]"
            href="/guides"
          >
            <ArrowLeft aria-hidden="true" size={14} /> Guides
          </Link>
          <span>/</span>
          <span className="truncate font-medium text-neutral-900">{guide.lane}</span>
        </nav>

        <header className="space-y-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-action)]">
            {guide.kicker} · {guide.readTime}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {guide.title}
          </h1>
          <p className="text-base leading-relaxed text-neutral-600 sm:text-lg">
            {guide.description}
          </p>
        </header>

        <section
          aria-label="Key specifications"
          className="grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 sm:grid-cols-2"
        >
          {guide.summaryPoints.map((point) => (
            <div className="rounded-xl bg-neutral-50 p-3" key={point.label}>
              <p className="font-mono text-xs uppercase text-neutral-500">{point.label}</p>
              <p className="mt-1 font-semibold text-neutral-900">{point.value}</p>
            </div>
          ))}
        </section>

        <div className="space-y-8">
          {guide.sections.map((section) => (
            <section className="space-y-3" key={section.questionHeading}>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {section.questionHeading}
              </h2>
              <p className="leading-relaxed text-neutral-700">{section.directAnswer}</p>
              {section.bullets ? (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-neutral-700">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <section
          aria-labelledby="guide-faq-heading"
          className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8"
        >
          <h2 className="font-display text-2xl font-bold" id="guide-faq-heading">
            Frequently Asked Questions
          </h2>
          <dl className="mt-5 divide-y divide-neutral-100">
            {guide.faqs.map((faq) => (
              <div className="py-4 first:pt-0 last:pb-0" key={faq.question}>
                <dt className="font-semibold text-neutral-900">{faq.question}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-neutral-600">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6">
          <div>
            <p className="font-semibold text-neutral-900">Explore live biomechanical specs</p>
            <p className="text-sm text-neutral-600">
              See exact angle thresholds for all 12 supported exercises.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[var(--color-action)] px-4 text-sm font-semibold text-white hover:opacity-90"
            href="/lab"
          >
            <span>Open Movement Lab</span>
            <ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>
      </article>
    </PublicLabShell>
  );
}

export { generateMetadata, generateStaticParams };
