import "server-only";

import { createClient } from "@connectrpc/connect";

import { adaptMealDetailPageData } from "@/features/nutrition/model/meal-detail.mapper";
import type { DailyMenuRows } from "@/features/nutrition/model/meal-detail.mapper";
import type { MealDetailPageData } from "@/features/nutrition/model/meal-detail.types";
import { dayKeyRange, toDayKey } from "@/shared/api/bff/aggregate/day-key";
import { deduplicateMealRows } from "@/shared/api/bff/aggregate/nutrition-daily";
import type { MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";
import { NutritionService } from "@/shared/api/gen/contracts/core/nutrition/v1/service/nutrition_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

import { readLocalMeals } from "./local-meal-log";

const EMPTY_DAILY_MENU: DailyMenuRows = {
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
};



/**
 * Fetches meal detail from live gRPC backend.
 */
export async function getMealDetailData(slot: MealSlot): Promise<MealDetailPageData> {
  const { accessToken, userId } = await getAuthenticatedSession();
  const today = toDayKey(new Date());
  const localRows = await readLocalMeals();

  const todayStr = today || new Date().toISOString().split("T")[0];

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const client = createClient(NutritionService, transport);

      const [menuRes, historyRes] = await Promise.allSettled([
        client.getTodayMenu({ userId: userId || "" }),
        client.getNutritionHistory({
          endDate: todayStr,
          startDate: dayKeyRange(todayStr, 7)[0] ?? todayStr,
          userId: userId || "",
        }),
      ]);

      const history = historyRes.status === "fulfilled" && historyRes.value?.meals ? historyRes.value.meals : [];
      const rows = deduplicateMealRows([...history, ...localRows]);

      if (menuRes.status === "fulfilled" && menuRes.value) {
        const menu = (menuRes.value.meals as any) || menuRes.value;
        return adaptMealDetailPageData(menu, rows, slot, todayStr);
      }

      return adaptMealDetailPageData(EMPTY_DAILY_MENU, rows, slot, todayStr);
    } catch (error) {
      console.warn("[getMealDetailData] gRPC error:", error);
    }
  }

  return adaptMealDetailPageData(EMPTY_DAILY_MENU, localRows, slot, todayStr);
}
