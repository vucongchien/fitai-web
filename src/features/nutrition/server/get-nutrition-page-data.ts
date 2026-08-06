import "server-only";
import type { NutritionPageData } from "@/features/nutrition/model/nutrition-page.types";

import { getMockNutritionPageData } from "./get-mock-nutrition-data";

// ---------------------------------------------------------------------------
// Real gRPC adapter (uncomment khi FITAI_RPC_URL sẵn sàng)
// ---------------------------------------------------------------------------

// async function getRealNutritionPageData(): Promise<NutritionPageData> {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("fitai_access_token")?.value;
//   const transport = createServerTransport(token);
//   const client = createClient(NutritionService, transport);
//   const today = toDayKey(new Date());
//
//   const [summary, history] = await Promise.all([
//     client.getNutritionSummary({ userId: "TODO: from session" }),
//     client.getNutritionHistory({
//       endDate: today,
//       startDate: dayKeyRange(today, 7)[0],
//       userId: "TODO: from session",
//     }),
//   ]);
//
//   return adaptNutritionPageData(summary, history.meals, today);
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
  if (!hasBackend) return getMockNutritionPageData();
  // TODO: return getRealNutritionPageData();
  return getMockNutritionPageData();
}
