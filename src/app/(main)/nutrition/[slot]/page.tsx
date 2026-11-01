import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getMealDetailData } from "@/features/nutrition/server/get-meal-detail-data";
import { MealDetailView } from "@/features/nutrition/ui/meal-detail-view";
import type { MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";
import { MEAL_SLOT_LABELS } from "@/shared/api/bff/aggregate/nutrition-daily";
import { PageTransition } from "@/shared/ui/page-transition";

/** Map slug to corresponding wire slot. */
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
  if (!resolved) {
    return { title: "Meal detail" };
  }
  return { title: `${MEAL_SLOT_LABELS[resolved]} | FITAI` };
}

async function MealContent({ paramsPromise }: { paramsPromise: Promise<{ slot: string }> }) {
  const { slot } = await paramsPromise;
  const resolved = SLOT_BY_SLUG[slot];
  if (!resolved) {
    notFound();
  }

  const data = await getMealDetailData(resolved);
  return <MealDetailView data={data} />;
}

function MealSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading meal detail" className="nutrition-skeleton">
      <div className="nutrition-skeleton__dial" />
      <div className="nutrition-skeleton__line" />
    </div>
  );
}

async function MealHeading({ paramsPromise }: { paramsPromise: Promise<{ slot: string }> }) {
  const { slot } = await paramsPromise;
  const resolved = SLOT_BY_SLUG[slot];
  if (!resolved) {
    return <h1>Meal</h1>;
  }

  return <h1>{MEAL_SLOT_LABELS[resolved]}</h1>;
}

const HEADING_FALLBACK = <h1>Meal</h1>;
const MEAL_FALLBACK = <MealSkeleton />;

/** Forward params promise to Suspense children to prevent route blocking. */
export default function MealDetailPage({ params }: { params: Promise<{ slot: string }> }) {
  return (
    <PageTransition className="w-full">
      <header className="page-heading px-5 sm:px-6 pt-6 pb-2">
        <div>
          <Suspense fallback={HEADING_FALLBACK}>
            <MealHeading paramsPromise={params} />
          </Suspense>
        </div>
      </header>

      <div className="px-5 sm:px-6 pb-8 bg-white">
        <Suspense fallback={MEAL_FALLBACK}>
          <MealContent paramsPromise={params} />
        </Suspense>
      </div>
    </PageTransition>
  );
}
