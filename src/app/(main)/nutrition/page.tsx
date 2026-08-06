import { Suspense } from "react";

import { getNutritionPageData } from "@/features/nutrition/server/get-nutrition-page-data";
import { NutritionView } from "@/features/nutrition/ui/nutrition-view";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Nutrition" };

async function NutritionContent() {
  const data = await getNutritionPageData();
  return <NutritionView data={data} />;
}

function NutritionSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading nutrition data" className="nutrition-skeleton">
      <div className="nutrition-skeleton__dial" />
      <div className="nutrition-skeleton__line" />
    </div>
  );
}

export default function NutritionPage() {
  return (
    <PageTransition className="page nutrition-page">
      {/* Static shell: heading paints immediately while the summary resolves. */}
      <header className="page-heading">
        <div>
          <h1>Nutrition</h1>
          <p>Today&rsquo;s meals, measured against the plan.</p>
        </div>
      </header>

      <Suspense fallback={<NutritionSkeleton />}>
        <NutritionContent />
      </Suspense>
    </PageTransition>
  );
}
