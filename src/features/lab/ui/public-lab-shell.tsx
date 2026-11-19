import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { KNOWLEDGE_GUIDES } from "@/features/lab/model/guides-data";
import { LAB_EXERCISES_META } from "@/features/lab/model/lab-catalog";
import { BrandMark } from "@/shared/ui/brand-mark";

interface PublicLabShellProps {
  children: ReactNode;
}

function PublicLabShell({ children }: PublicLabShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-text)] font-sans">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <BrandMark href="/" />
            <nav
              aria-label="Public knowledge navigation"
              className="hidden items-center gap-5 sm:flex"
            >
              <Link
                className="text-sm font-medium text-neutral-700 hover:text-neutral-950"
                href="/"
              >
                Overview
              </Link>
              <Link
                className="text-sm font-medium text-neutral-700 hover:text-neutral-950"
                href="/lab"
              >
                Movement Lab
              </Link>
              <Link
                className="text-sm font-medium text-neutral-700 hover:text-neutral-950"
                href="/lab/glossary"
              >
                Glossary
              </Link>
              <Link
                className="text-sm font-medium text-neutral-700 hover:text-neutral-950"
                href="/guides"
              >
                Guides
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="inline-flex min-h-11 items-center rounded-xl px-3.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[var(--color-action)] px-4 text-sm font-semibold text-white hover:opacity-90"
              href="/login"
            >
              <span>Start 4-week plan</span>
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <BrandMark href="/" />
            <p className="text-xs text-neutral-600">
              FITAI provides AI-assisted training guidance, not medical diagnosis.
            </p>
          </div>

          <div className="grid gap-6 border-t border-neutral-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Movement Lab (12 Exercises)
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
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
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Training Architecture Guides
              </h2>
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
              </ul>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Machine-Readable &amp; Platform
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    className="text-neutral-700 hover:text-[var(--color-action)] hover:underline"
                    href="/lab"
                  >
                    Public Lab Directory
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-700 hover:text-[var(--color-action)] hover:underline"
                    href="/lab/glossary"
                  >
                    Biomechanics Glossary
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-700 hover:text-[var(--color-action)] hover:underline"
                    href="/guides"
                  >
                    Evidence &amp; Coaching Guides
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-700 hover:text-[var(--color-action)] hover:underline"
                    href="/knowledge.json"
                    prefetch={false}
                  >
                    knowledge.json
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-700 hover:text-[var(--color-action)] hover:underline"
                    href="/feed.xml"
                    prefetch={false}
                  >
                    RSS feed (/feed.xml)
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-700 hover:text-[var(--color-action)] hover:underline"
                    href="/llms.txt"
                    prefetch={false}
                  >
                    llms.txt
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-neutral-700 hover:text-[var(--color-action)] hover:underline"
                    href="/llms-full.txt"
                    prefetch={false}
                  >
                    llms-full.txt
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { PublicLabShell };
