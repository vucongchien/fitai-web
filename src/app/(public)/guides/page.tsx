import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { KNOWLEDGE_GUIDES } from "@/features/lab/model/guides-data";
import { JsonLdScript } from "@/features/lab/ui/json-ld-script";
import { PublicLabShell } from "@/features/lab/ui/public-lab-shell";
import { buildBreadcrumbJsonLd } from "@/shared/seo/structured-data";

export const metadata: Metadata = {
  title: "Training & AI Architecture Guides",
  description:
    "Deep dives into FITAI's 4-week adaptive training roadmap, on-device YOLOv8/YOLO11 pose estimation, and Injury Guard load management.",
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    url: "/guides",
    title: "FITAI Guides — Adaptive Training & On-Device Biomechanics",
    description:
      "Learn how FITAI plans 4-week workouts, evaluates pose angles locally, and protects sore joints.",
  },
};

const BREADCRUMB_DATA = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
]);

export default function GuidesIndexPage() {
  return (
    <PublicLabShell>
      <JsonLdScript data={BREADCRUMB_DATA} />

      <div className="space-y-10">
        <header className="space-y-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-action)]">
            FITAI KNOWLEDGE BASE
          </p>
          <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Evidence-based training design and on-device coaching mechanics.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Clear explanations of how FITAI builds four-week schedules, runs 17-keypoint pose
            checking locally in the browser, and adapts load when injury or fatigue appears.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-3">
          {KNOWLEDGE_GUIDES.map((guide) => (
            <Link
              className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 transition-colors hover:border-[var(--color-action)]"
              href={`/guides/${guide.slug}`}
              key={guide.slug}
            >
              <div className="space-y-3">
                <p className="font-mono text-xs font-semibold text-neutral-500">{guide.kicker}</p>
                <h2 className="font-display text-xl font-bold group-hover:text-[var(--color-action)]">
                  {guide.title}
                </h2>
                <p className="text-sm leading-relaxed text-neutral-600">{guide.description}</p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3 font-mono text-xs text-neutral-500">
                <span>{guide.readTime}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-action)]">
                  Read guide <ArrowRight aria-hidden="true" size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicLabShell>
  );
}
