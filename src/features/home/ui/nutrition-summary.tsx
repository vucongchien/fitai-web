import { Salad } from "lucide-react";

import type { NutritionSummary as NutritionSummaryData } from "@/shared/api/bff/home/types";

type NutritionSummaryProps = {
  summary: NutritionSummaryData;
};

export function NutritionSummary({ summary }: NutritionSummaryProps) {
  return (
    <section className="nutrition-line">
      <Salad aria-hidden="true" size={21} />
      <div>
        <strong>Today&rsquo;s nutrition</strong>
        <span>
          {summary.loggedKcal.toLocaleString()} of {summary.targetKcal.toLocaleString()} kcal logged
        </span>
      </div>
    </section>
  );
}
