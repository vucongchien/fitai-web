import "server-only";

import { createClient } from "@connectrpc/connect";

import { adaptNutritionPageData } from "@/features/nutrition/model/nutrition-page.mapper";
import type { NutritionPageData } from "@/features/nutrition/model/nutrition-page.types";
import { dayKeyRange, toDayKey } from "@/shared/api/bff/aggregate/day-key";
import { NutritionService } from "@/shared/api/gen/contracts/core/nutrition/v1/service/nutrition_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

const EMPTY_NUTRITION_DATA: NutritionPageData = {
  calorieSeries: [],
  caloriesAverage: null,
  caloriesTargetPerDay: 2000,
  dateLabel: "No data available",
  daysLogged: 0,
  macros: [
    { label: "Carbs", gramsPerDay: 0 },
    { label: "Fat", gramsPerDay: 0 },
    { label: "Protein", gramsPerDay: 0 },
  ],
  mealsLogged: 0,
  slots: [
    { slot: "breakfast", label: "Breakfast", calories: 0, meals: [] },
    { slot: "lunch", label: "Lunch", calories: 0, meals: [] },
    { slot: "dinner", label: "Dinner", calories: 0, meals: [] },
    { slot: "snack", label: "Snack", calories: 0, meals: [] },
  ],
};

async function getRealNutritionPageData(
  accessToken: string,
  userId: string,
): Promise<NutritionPageData> {
  const transport = createServerTransport(accessToken);
  const client = createClient(NutritionService, transport);
  const today = toDayKey(new Date()) ?? "2026-08-08";

  console.info(`[getRealNutritionPageData] Calling gRPC for userId=${userId}, today=${today}`);

  const [summaryRes, historyRes] = await Promise.allSettled([
    client.getNutritionSummary({ userId }),
    client.getNutritionHistory({
      endDate: today,
      startDate: dayKeyRange(today, 7)[0] ?? today,
      userId,
    }),
  ]);

  console.info("[getRealNutritionPageData] summaryRes status:", summaryRes.status, summaryRes.status === "rejected" ? summaryRes.reason : "");
  console.info("[getRealNutritionPageData] historyRes status:", historyRes.status, historyRes.status === "rejected" ? historyRes.reason : "");

  if (summaryRes.status === "rejected" && historyRes.status === "rejected") {
    return EMPTY_NUTRITION_DATA;
  }

  const summary = summaryRes.status === "fulfilled" ? summaryRes.value : undefined;
  const history = historyRes.status === "fulfilled" ? historyRes.value.meals : [];

  if (summary) {
    return adaptNutritionPageData(summary, history, today);
  }

  return EMPTY_NUTRITION_DATA;
}

export async function getNutritionPageData(): Promise<NutritionPageData> {
  const { accessToken, userId } = await getAuthenticatedSession();

  console.info("[getNutritionPageData] accessToken present:", !!accessToken, "userId:", userId);

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      return await getRealNutritionPageData(accessToken, userId || "");
    } catch (error) {
      console.warn("[getNutritionPageData] gRPC error:", error);
    }
  }

  return EMPTY_NUTRITION_DATA;
}
