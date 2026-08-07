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
      <div className="skeleton-box h-[180px] w-full rounded-[14px] mb-4 bg-[var(--color-surface-hover,#eee)]" />
      <div className="skeleton-box h-60 w-full rounded-[14px] bg-[var(--color-surface-hover,#eee)]" />
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
    <PageTransition className="workout-prep-page">
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

      <Suspense fallback={PREP_FALLBACK}>
        <PrepContent paramsPromise={params} />
      </Suspense>
    </PageTransition>
  );
}
