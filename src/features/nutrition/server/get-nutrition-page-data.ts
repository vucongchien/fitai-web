import "server-only";

import { createClient } from "@connectrpc/connect";

import { adaptNutritionPageData } from "@/features/nutrition/model/nutrition-page.mapper";
import type { NutritionPageData } from "@/features/nutrition/model/nutrition-page.types";
import { dayKeyRange, toDayKey } from "@/shared/api/bff/aggregate/day-key";
import { NutritionService } from "@/shared/api/gen/contracts/core/nutrition/v1/service/nutrition_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";


import { readLocalMeals } from "./local-meal-log";

const DEFAULT_SUMMARY = {
  consumedCalories: 0,
  targetCalories: 2000,
};

async function getRealNutritionPageData(
  accessToken: string,
  userId: string,
): Promise<NutritionPageData> {
  const transport = createServerTransport(accessToken);
  const client = createClient(NutritionService, transport);
  const today = toDayKey(new Date()) ?? new Date().toISOString().split("T")[0];
  const localRows = await readLocalMeals();

  console.info(`[getRealNutritionPageData] Calling gRPC for userId=${userId}, today=${today}`);

  const [summaryRes, historyRes, menuRes] = await Promise.allSettled([
    client.getNutritionSummary({ userId }),
    client.getNutritionHistory({
      endDate: today,
      startDate: dayKeyRange(today, 7)[0] ?? today,
      userId,
    }),
    client.getTodayMenu({ userId }),
  ]);

  console.info("[getRealNutritionPageData] summaryRes status:", summaryRes.status, summaryRes.status === "rejected" ? summaryRes.reason : "");
  console.info("[getRealNutritionPageData] historyRes status:", historyRes.status, historyRes.status === "rejected" ? historyRes.reason : "");
  console.info("[getRealNutritionPageData] menuRes status:", menuRes.status, menuRes.status === "rejected" ? menuRes.reason : "");
  const summary = summaryRes.status === "fulfilled" && summaryRes.value ? summaryRes.value : DEFAULT_SUMMARY;
  const historyRaw = historyRes.status === "fulfilled" && historyRes.value?.meals ? historyRes.value.meals : [];
  const seenIds = new Set<string>();
  const history = [...historyRaw, ...localRows].filter((r) => {
    const id = r.mealLogId || `${r.mealName}-${r.mealType}-${r.loggedAt}`;
    if (seenIds.has(id)) {
      return false;
    }
    seenIds.add(id);
    return true;
  });

  const todayMenu = menuRes.status === "fulfilled" && menuRes.value
    ? (menuRes.value.meals as any)
    : undefined;

  return adaptNutritionPageData(summary, history, today, todayMenu);
}

export async function getNutritionPageData(): Promise<NutritionPageData> {
  const { accessToken, userId } = await getAuthenticatedSession();
  const localRows = await readLocalMeals();
  const today = toDayKey(new Date()) ?? new Date().toISOString().split("T")[0];

  console.info("[getNutritionPageData] accessToken present:", Boolean(accessToken), "userId:", userId);

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      return await getRealNutritionPageData(accessToken, userId || "");
    } catch (error) {
      console.warn("[getNutritionPageData] gRPC error:", error);
    }
  }

  return adaptNutritionPageData(DEFAULT_SUMMARY, localRows, today);
}
