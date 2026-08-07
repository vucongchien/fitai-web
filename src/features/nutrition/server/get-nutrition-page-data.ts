import "server-only";
import type { NutritionPageData } from "@/features/nutrition/model/nutrition-page.types";

import { getMockNutritionPageData } from "./get-mock-nutrition-data";
import { readLocalMeals } from "./local-meal-log";

// ---------------------------------------------------------------------------
// Real gRPC adapter (uncomment khi FITAI_RPC_URL sẵn sàng)
// ---------------------------------------------------------------------------

// Async function getRealNutritionPageData(): Promise<NutritionPageData> {
//   Const cookieStore = await cookies();
//   Const token = cookieStore.get("fitai_access_token")?.value;
//   Const transport = createServerTransport(token);
//   Const client = createClient(NutritionService, transport);
//   Const today = toDayKey(new Date());
//
//   Const [summary, history] = await Promise.all([
//     Client.getNutritionSummary({ userId: "TODO: from session" }),
//     Client.getNutritionHistory({
//       EndDate: today,
//       StartDate: dayKeyRange(today, 7)[0],
//       UserId: "TODO: from session",
//     }),
//   ]);
//
//   Return adaptNutritionPageData(summary, history.meals, today);
// }

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches all data needed for the Nutrition page.
 *
 * Calls:
 *   - NutritionService.getNutritionSummary → calories and macros against target
 *   - NutritionService.getNutritionHistory → meal rows for the slot timeline and bar chart
 */
export async function getNutritionPageData(): Promise<NutritionPageData> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  // ReadLocalMeals touches cookies(), so this read belongs to the request rather than the
  // Prerender — a freshly logged meal shows up immediately.
  if (!hasBackend) {
    return getMockNutritionPageData(await readLocalMeals());
  }
  // TODO: return getRealNutritionPageData();
  return getMockNutritionPageData(await readLocalMeals());
}
