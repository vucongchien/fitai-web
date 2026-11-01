import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { getSessionPlanPageData } from "@/features/roadmap/server/get-session-plan-page-data";
import { SessionPlanView } from "@/features/roadmap/ui/session-plan-view";
import { BrandMark } from "@/shared/ui/brand-mark";
import { HeaderActions } from "@/shared/ui/header-actions";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Prepare for your session" };

/** Hoisted so the array identity is stable across renders. */
const NAV_BACK = ["nav-back"];

async function PrepContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ sessionPlanId: string }>;
}) {
  const { sessionPlanId } = await paramsPromise;
  const data = await getSessionPlanPageData(sessionPlanId);
  return <SessionPlanView data={data} />;
}

function PrepSkeleton() {
  return (
    <div className="workout-prep-skeleton px-4 py-8">
      <div className="skeleton-box h-[180px] w-full rounded-[var(--radius-card)] mb-4 bg-[var(--color-surface-subtle)]" />
      <div className="skeleton-box h-60 w-full rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)]" />
    </div>
  );
}

/** Static element, hoisted so the fallback identity is stable across renders. */
const PREP_FALLBACK = <PrepSkeleton />;

export default function WorkoutPreparationPage({
  params,
}: {
  params: Promise<{ sessionPlanId: string }>;
}) {
  return (
    <PageTransition className="min-h-screen bg-white sm:bg-canvas">
      <header className="focused-header">
        <Link
          aria-label="Back to roadmap"
          className="focused-header__back"
          href="/roadmap"
          transitionTypes={NAV_BACK}
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <BrandMark />
        <HeaderActions />
      </header>

      <div className="w-full max-w-[640px] mx-auto px-0 sm:px-4 pt-0 sm:pt-4 pb-8 sm:pb-12">
        <main className="w-full bg-white overflow-hidden shadow-none rounded-none border-0 sm:rounded-[24px] sm:border sm:border-neutral-300 p-5 sm:p-6 space-y-6">
          <Suspense fallback={PREP_FALLBACK}>
            <PrepContent paramsPromise={params} />
          </Suspense>
        </main>
      </div>
    </PageTransition>
  );
}
