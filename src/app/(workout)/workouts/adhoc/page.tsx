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
    <PageTransition className="min-h-screen bg-white sm:bg-canvas">
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

      <div className="w-full max-w-[640px] mx-auto px-0 sm:px-4 pt-0 sm:pt-4 pb-8 sm:pb-12">
        <main className="w-full bg-white overflow-hidden shadow-none rounded-none border-0 sm:rounded-[24px] sm:border sm:border-neutral-300 p-5 sm:p-6 space-y-6">
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
      </div>
    </PageTransition>
  );
}
