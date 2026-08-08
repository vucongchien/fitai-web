import { afterEach, beforeEach, describe, expect, it, vi } from '@jest/globals';
import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";


import {
  GetNutritionHistoryResponseSchema,
  GetNutritionSummaryResponseSchema,
  LogMealResponseSchema,
  RecalibratePlanWithPantryResponseSchema,
} from "@/shared/api/gen/contracts/core/nutrition/v1/message/nutrition_messages_pb";
import type { NutritionService } from "@/shared/api/gen/contracts/core/nutrition/v1/service/nutrition_service_pb";

type NutritionClient = Client<typeof NutritionService>;

const mockGetNutritionSummary = vi.fn<NutritionClient["getNutritionSummary"]>();
const mockGetNutritionHistory = vi.fn<NutritionClient["getNutritionHistory"]>();
const mockLogMeal = vi.fn<NutritionClient["logMeal"]>();
const mockRecalibratePlanWithPantry = vi.fn<NutritionClient["recalibratePlanWithPantry"]>();

vi.mock<typeof import("@connectrpc/connect")>(import("@connectrpc/connect"), () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    getNutritionSummary: mockGetNutritionSummary,
    getNutritionHistory: mockGetNutritionHistory,
    logMeal: mockLogMeal,
    recalibratePlanWithPantry: mockRecalibratePlanWithPantry,
  }),
}));

vi.mock<typeof import("@/shared/api/server/transport")>(
  import("@/shared/api/server/transport"),
  () => ({
    createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
  }),
);

vi.mock<typeof import("@/shared/auth/session")>(import("@/shared/auth/session"), () => ({
  getAccessToken: () => Promise.resolve("auth_token_nutrition"),
  getAuthenticatedUserId: () => Promise.resolve("usr-nutri-888"),
  getAuthenticatedSession: () =>
    Promise.resolve({
      accessToken: "auth_token_nutrition",
      userId: "usr-nutri-888",
    }),
}));

vi.mock<typeof import("@/features/nutrition/model/nutrition-page.mapper")>(
  import("@/features/nutrition/model/nutrition-page.mapper"),
  () => ({
    adaptNutritionPageData: (summary: any, _history: any, _today: string) => ({
      targetKcal: summary?.targetCalories ?? 2000,
      loggedKcal: summary?.consumedCalories ?? 0,
      meals: [],
      targetMacros: { proteinGrams: 150, carbGrams: 200, fatGrams: 60 },
      loggedMacros: { proteinGrams: 0, carbGrams: 0, fatGrams: 0 },
      streakDays: 5,
    }),
  }),
);

vi.mock<typeof import("next/cache")>(import("next/cache"), () => ({
  revalidatePath: vi.fn(),
}));

describe("nutrition gRPC Actions & Services", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockGetNutritionSummary.mockReset();
    mockGetNutritionHistory.mockReset();
    mockLogMeal.mockReset();
    mockRecalibratePlanWithPantry.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getNutritionPageData aggregates summary and history from gRPC", async () => {
    mockGetNutritionSummary.mockResolvedValue(
      create(GetNutritionSummaryResponseSchema, {
        targetCalories: 2200,
        consumedCalories: 1500,
        targetMacros: { proteinGrams: 160, carbGrams: 220, fatGrams: 60 },
        consumedMacros: { proteinGrams: 110, carbGrams: 150, fatGrams: 40 },
      }),
    );

    mockGetNutritionHistory.mockResolvedValue(
      create(GetNutritionHistoryResponseSchema, {
        meals: [
          {
            mealLogId: "meal-1",
            mealName: "Chicken Breast & Rice",
            mealType: "LUNCH",
            calories: 650,
            protein: 50,
            carbs: 70,
            fat: 15,
            loggedAt: "2026-08-08T12:30:00Z",
          },
        ],
      }),
    );

    const { getNutritionPageData } = await import(
      "@/features/nutrition/server/get-nutrition-page-data"
    );
    const data = await getNutritionPageData();

    expect(mockGetNutritionSummary).toHaveBeenCalledWith({ userId: "usr-nutri-888" });
    expect(data.targetKcal).toBe(2200);
    expect(data.loggedKcal).toBe(1500);
  });

  it("logMeal sends formatted meal payload to gRPC NutritionService", async () => {
    mockLogMeal.mockResolvedValue(
      create(LogMealResponseSchema, {
        mealLogId: "meal-saved-999",
        success: true,
        message: "Saved",
      }),
    );

    const { logMeal } = await import(
      "@/features/nutrition/server/nutrition-actions"
    );
    const result = await logMeal({
      slot: "lunch",
      mealName: "Salmon Salad",
      calories: 550,
      protein: 40,
      carbs: 20,
      fat: 25,
    });

    expect(mockLogMeal).toHaveBeenCalledWith(
      expect.objectContaining({
        mealName: "Salmon Salad",
        mealType: "LUNCH",
        calories: 550,
        userId: "usr-nutri-888",
      }),
    );
    expect(result.ok).toBe(true);
  });

  it("recalibratePantryAction triggers pantry-based meal rebalancing", async () => {
    mockRecalibratePlanWithPantry.mockResolvedValue(
      create(RecalibratePlanWithPantryResponseSchema, {
        targetCalories: 2100,
        message: "Recalibrated",
      }),
    );

    const { recalibratePantryAction } = await import(
      "@/features/nutrition/server/nutrition-actions"
    );
    const res = await recalibratePantryAction(["Eggs", "Spinach", "Tofu"]);

    expect(mockRecalibratePlanWithPantry).toHaveBeenCalledWith({
      userId: "usr-nutri-888",
      availableIngredients: ["Eggs", "Spinach", "Tofu"],
    });
    expect(res.success).toBe(true);
  });
});
