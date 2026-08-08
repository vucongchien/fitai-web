"use server";

import { createClient } from "@connectrpc/connect";
import { revalidatePath } from "next/cache";

import { appendLocalMeal } from "@/features/nutrition/server/local-meal-log";
import type { MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";
import { NutritionService } from "@/shared/api/gen/contracts/core/nutrition/v1/service/nutrition_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken, getAuthenticatedUserId } from "@/shared/auth/session";

export interface LogMealInput {
  calories: number;
  carbs: number;
  fat: number;
  mealName: string;
  protein: number;
  slot: MealSlot;
}

export type LogMealResult = { mealLogId: string; ok: true } | { message: string; ok: false };

/** `useActionState` shape, so a failure can render next to the control that caused it. */
export type LogMealState =
  | { status: "error"; message: string }
  | { status: "idle" }
  | { status: "saved" };

const SLOTS: readonly MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

function readNumber(form: FormData, key: string) {
  const raw = form.get(key);
  if (typeof raw !== "string" || raw.trim() === "") {
    return 0;
  }
  return Number(raw);
}

/**
 * Form-action entry point.
 */
export async function logMealAction(
  _previous: LogMealState,
  form: FormData,
): Promise<LogMealState> {
  const rawSlot = form.get("slot");
  const slot = SLOTS.find((candidate) => candidate === rawSlot);
  if (!slot) {
    return { message: "That meal slot is not recognized.", status: "error" };
  }

  const result = await logMeal({
    calories: readNumber(form, "calories"),
    carbs: readNumber(form, "carbs"),
    fat: readNumber(form, "fat"),
    mealName: typeof form.get("mealName") === "string" ? String(form.get("mealName")) : "",
    protein: readNumber(form, "protein"),
    slot,
  });

  return result.ok ? { status: "saved" } : { message: result.message, status: "error" };
}

/** `LogMealRequest.meal_type` expects the upper-case wire spelling. */
const WIRE_MEAL_TYPE: Record<MealSlot, string> = {
  breakfast: "BREAKFAST",
  dinner: "DINNER",
  lunch: "LUNCH",
  snack: "SNACK",
};

/** Transport-level failure: the backend is not answering at all. */
function isUnreachable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|socket hang up|network/i.test(message);
}

/** Every screen that reads today's log. */
function revalidateReaders(slot: MealSlot) {
  revalidatePath("/nutrition");
  revalidatePath(`/nutrition/${slot}`);
  revalidatePath("/home");
}

function validate(input: LogMealInput): string | null {
  if (!input.mealName.trim()) {
    return "Give the meal a name before saving it.";
  }
  if (!WIRE_MEAL_TYPE[input.slot]) {
    return "That meal slot is not recognized.";
  }

  const numbers = [input.calories, input.protein, input.carbs, input.fat];
  if (numbers.some((value) => !Number.isFinite(value) || value < 0)) {
    return "Calories and macros must be zero or more.";
  }
  if (input.calories > 10_000) {
    return "That calorie figure looks too high to be a single meal.";
  }

  return null;
}

/**
 * Logs one meal.
 * gRPC: NutritionService.logMeal
 */
export async function logMeal(input: LogMealInput): Promise<LogMealResult> {
  const invalid = validate(input);
  if (invalid) {
    return { message: invalid, ok: false };
  }

  const loggedAt = new Date().toISOString();
  const accessToken = await getAccessToken();
  const userId = await getAuthenticatedUserId();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const client = createClient(NutritionService, createServerTransport(accessToken));

      const response = await client.logMeal({
        calories: input.calories,
        carbs: input.carbs,
        fat: input.fat,
        loggedAt,
        mealName: input.mealName.trim(),
        mealType: WIRE_MEAL_TYPE[input.slot],
        protein: input.protein,
        userId: userId || "",
      });

      if (!response.success) {
        return { message: response.message || "The meal could not be saved.", ok: false };
      }

      revalidateReaders(input.slot);
      return { mealLogId: response.mealLogId, ok: true };
    } catch (error) {
      if (isUnreachable(error)) {
        const mealLogId = await appendLocalMeal({ ...input, loggedAt });
        revalidateReaders(input.slot);
        return { mealLogId, ok: true };
      }

      const detail = error instanceof Error ? error.message : "Unknown transport error";
      return { message: `Could not save the meal: ${detail}`, ok: false };
    }
  }

  const mealLogId = await appendLocalMeal({ ...input, loggedAt });
  revalidateReaders(input.slot);
  return { mealLogId, ok: true };
}

/**
 * Server Action tái hiệu chỉnh thực đơn theo nguyên liệu sẵn có trong tủ lạnh
 */
export async function recalibratePantryAction(
  availableIngredients: string[],
): Promise<{ success: boolean; message?: string }> {
  try {
    const accessToken = await getAccessToken();
    const userId = await getAuthenticatedUserId();
    const client = createClient(NutritionService, createServerTransport(accessToken));

    const res = await client.recalibratePlanWithPantry({
      userId: userId || "",
      availableIngredients,
    });

    revalidatePath("/nutrition");
    return { success: true, message: res.message || "Menu recalibrated with pantry ingredients" };
  } catch (error: any) {
    console.error("[recalibratePantryAction] Error:", error);
    return { success: false, message: error?.message || "Failed to recalibrate menu" };
  }
}
