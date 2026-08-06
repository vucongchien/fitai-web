import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getMealDetailData } from "@/features/nutrition/server/get-meal-detail-data";
import { MealDetailView } from "@/features/nutrition/ui/meal-detail-view";
import type { MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";
import { MEAL_SLOT_LABELS } from "@/shared/api/bff/aggregate/nutrition-daily";
import { PageTransition } from "@/shared/ui/page-transition";

/**
 * Slugs the app links to, mapped onto the four wire slots. The timeline distinguishes a
 * morning from an afternoon snack, but `DailyMeals` has one `snack` list, so both land here.
 */
const SLOT_BY_SLUG: Record<string, MealSlot> = {
  breakfast: "breakfast",
  dinner: "dinner",
  lunch: "lunch",
  snack: "snack",
  "snack-afternoon": "snack",
  "snack-morning": "snack",
  snacks: "snack",
};

export function generateStaticParams() {
  return Object.keys(SLOT_BY_SLUG).map((slot) => ({ slot }));
}

export async function generateMetadata({ params }: { params: Promise<{ slot: string }> }) {
  const { slot } = await params;
  const resolved = SLOT_BY_SLUG[slot];
  return { title: resolved ? MEAL_SLOT_LABELS[resolved] : "Meal" };
}

async function MealContent({ paramsPromise }: { paramsPromise: Promise<{ slot: string }> }) {
  const { slot } = await paramsPromise;
  const resolved = SLOT_BY_SLUG[slot];
  if (!resolved) notFound();

  const data = await getMealDetailData(resolved);
  return <MealDetailView data={data} />;
}

function MealSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading meal" className="meal-skeleton">
      <div className="meal-skeleton__row" />
      <div className="meal-skeleton__row" />
    </div>
  );
}

export default async function MealDetailPage({ params }: { params: Promise<{ slot: string }> }) {
  const { slot } = await params;
  const resolved = SLOT_BY_SLUG[slot];
  if (!resolved) notFound();

  return (
    <PageTransition className="page meal-page">
      {/* Static shell: the slot name is known from the route, so it paints immediately. */}
      <header className="page-heading">
        <div>
          <Link className="meal-page__back" href="/nutrition" transitionTypes={["nav-back"]}>
            <ArrowLeft aria-hidden="true" size={16} />
            Nutrition
          </Link>
          <h1>{MEAL_SLOT_LABELS[resolved]}</h1>
        </div>
      </header>

      <Suspense fallback={<MealSkeleton />}>
        <MealContent paramsPromise={params} />
      </Suspense>
    </PageTransition>
  );
}
