import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { getAdhocConfig } from "@/features/workout/server/workout-actions";
import { AdhocWorkoutBuilder } from "@/features/workout/ui/adhoc-workout-builder";
import { BrandMark } from "@/shared/ui/brand-mark";
import { HeaderActions } from "@/shared/ui/header-actions";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Adhoc Workout — Custom Plan" };

/** Hoisted so the array identity is stable across renders. */
const NAV_BACK = ["nav-back"];

async function AdhocWorkoutContent() {
  const config = await getAdhocConfig();
  return <AdhocWorkoutBuilder initialConfig={config} />;
}

export default function AdhocWorkoutPage() {
  return (
    <PageTransition className="workout-prep-page adhoc-workout-page">
      <header className="focused-header">
        <Link
          aria-label="Back to home"
          className="focused-header__back"
          href="/home"
          transitionTypes={NAV_BACK}
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <BrandMark />
        <HeaderActions />
      </header>

      <main className="workout-prep-main">
        <Suspense
          fallback={
            <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
              Loading workout builder...
            </div>
          }
        >
          <AdhocWorkoutContent />
        </Suspense>
      </main>
    </PageTransition>
  );
}
