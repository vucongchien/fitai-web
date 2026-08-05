import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AdhocWorkoutBuilder } from "@/features/workout/ui/adhoc-workout-builder";
import { BrandMark } from "@/shared/ui/brand-mark";
import { HeaderActions } from "@/shared/ui/header-actions";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Adhoc Workout — Custom Plan" };

export default function AdhocWorkoutPage() {
  return (
    <PageTransition className="workout-prep-page adhoc-workout-page">
      <header className="focused-header">
        <Link
          aria-label="Back to home"
          className="focused-header__back"
          href="/home"
          transitionTypes={["nav-back"]}
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <BrandMark />
        <HeaderActions />
      </header>

      <main className="workout-prep-main">
        <AdhocWorkoutBuilder />
      </main>
    </PageTransition>
  );
}
