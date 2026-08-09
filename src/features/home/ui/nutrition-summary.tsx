import { Salad } from "lucide-react";

import type { NutritionSummary as NutritionSummaryData } from "@/features/home/model/home-page.types";

interface NutritionSummaryProps {
  summary: NutritionSummaryData;
}

export function NutritionSummary({ summary }: NutritionSummaryProps) {
  return (
    <section className="nutrition-line">
      <Salad aria-hidden="true" size={21} />
      <div>
        <strong>Today&rsquo;s nutrition</strong>
        <span>
          {summary.loggedKcal.toLocaleString("en-US")} of {summary.targetKcal.toLocaleString("en-US")} kcal logged
        </span>
      </div>
    </section>
  );
}
