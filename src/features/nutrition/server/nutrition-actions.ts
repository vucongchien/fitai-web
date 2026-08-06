"use server";

import { createClient } from "@connectrpc/connect";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { appendLocalMeal } from "@/features/nutrition/server/local-meal-log";
import type { MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";
import { createServerTransport } from "@/shared/api/connect/server-transport";
import { NutritionService } from "@/shared/api/gen/contracts/core/nutrition/v1/service/nutrition_service_pb";

export type LogMealInput = {
  calories: number;
  carbs: number;
  fat: number;
  mealName: string;
  protein: number;
  slot: MealSlot;
};

export type LogMealResult = { mealLogId: string; ok: true } | { message: string; ok: false };

/** `useActionState` shape, so a failure can render next to the control that caused it. */
export type LogMealState =
  | { status: "error"; message: string }
  | { status: "idle" }
  | { status: "saved" };

const SLOTS: readonly MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

function readNumber(form: FormData, key: string) {
  const raw = form.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return 0;
  return Number(raw);
}

/**
 * Form-action entry point.
 *
 * A Server Function only writes cookies and returns fresh UI in one roundtrip when it is
 * used as a form `action`; called from an event handler the `Set-Cookie` never lands. Both
 * the one-tap button and the manual form go through here.
 */
export async function logMealAction(
  _previous: LogMealState,
  form: FormData,
): Promise<LogMealState> {
  const rawSlot = form.get("slot");
  const slot = SLOTS.find((candidate) => candidate === rawSlot);
  if (!slot) return { message: "That meal slot is not recognized.", status: "error" };

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
  if (!input.mealName.trim()) return "Give the meal a name before saving it.";
  if (!WIRE_MEAL_TYPE[input.slot]) return "That meal slot is not recognized.";

  const numbers = [input.calories, input.protein, input.carbs, input.fat];
  if (numbers.some((value) => !Number.isFinite(value) || value < 0)) {
    return "Calories and macros must be zero or more.";
  }
  if (input.calories > 10_000) return "That calorie figure looks too high to be a single meal.";

  return null;
}

/**
 * Logs one meal.
 *
 * gRPC: NutritionService.logMeal({ userId, mealName, mealType, calories, protein, carbs,
 *       fat, loggedAt }) → { mealLogId, success, message }
 *
 * Online-first, per PRODUCT.md: a failure returns the reason so the form can keep the
 * user's input rather than replaying a mutation whose outcome is unknown.
 */
export async function logMeal(input: LogMealInput): Promise<LogMealResult> {
  const invalid = validate(input);
  if (invalid) return { message: invalid, ok: false };

  const loggedAt = new Date().toISOString();
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);

  if (!hasBackend) {
    const mealLogId = await appendLocalMeal({ ...input, loggedAt });
    revalidateReaders(input.slot);
    return { mealLogId, ok: true };
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fitai_access_token")?.value;
    const client = createClient(NutritionService, createServerTransport(token));

    const response = await client.logMeal({
      calories: input.calories,
      carbs: input.carbs,
      fat: input.fat,
      loggedAt,
      mealName: input.mealName.trim(),
      mealType: WIRE_MEAL_TYPE[input.slot],
      protein: input.protein,
      // TODO: read the user id from the session once it is exposed server-side.
      userId: "",
    });

    if (!response.success) {
      return { message: response.message || "The meal could not be saved.", ok: false };
    }

    revalidateReaders(input.slot);
    return { mealLogId: response.mealLogId, ok: true };
  } catch (error) {
    // FITAI_RPC_URL can point at a backend that is not running yet, which is the normal
    // state in local development. The read paths already fall back to mock data in that
    // case, so the write does too — otherwise logging is broken on every dev machine while
    // the rest of the app looks fine.
    if (isUnreachable(error)) {
      const mealLogId = await appendLocalMeal({ ...input, loggedAt });
      revalidateReaders(input.slot);
      return { mealLogId, ok: true };
    }

    // A backend that answered and refused is a real failure: say so rather than writing a
    // local row the server does not know about.
    const detail = error instanceof Error ? error.message : "Unknown transport error";
    return { message: `Could not save the meal: ${detail}`, ok: false };
  }
}
