"use client";

import { Check, Plus } from "lucide-react";
import { useActionState, useOptimistic } from "react";

import { logMealAction } from "@/features/nutrition/server/nutrition-actions";
import type { LogMealState } from "@/features/nutrition/server/nutrition-actions";
import type { MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";

interface LogMealButtonProps {
  calories: number;
  carbs: number;
  fat: number;
  mealName: string;
  protein: number;
  slot: MealSlot;
}

const INITIAL: LogMealState = { status: "idle" };

/**
 * One-tap logging for a menu option with optimistic UI.
 *
 * Driven by the form's `action` prop. The menu option already carries every figure
 * `LogMealRequest` needs, so nothing is typed.
 */
export function LogMealButton(props: LogMealButtonProps) {
  const [state, formAction, pending] = useActionState(logMealAction, INITIAL);
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(
    state.status === "saved",
    (_current, next: boolean) => next,
  );

  if (optimisticSaved) {
    return (
      <p className="log-meal log-meal--done">
        <Check aria-hidden="true" size={15} />
        {pending ? "Saving…" : "Logged"}
      </p>
    );
  }

  const handleAction = async (formData: FormData) => {
    setOptimisticSaved(true);
    await formAction(formData);
  };

  return (
    <form action={handleAction} className="log-meal__form">
      <input name="mealName" type="hidden" value={props.mealName} />
      <input name="slot" type="hidden" value={props.slot} />
      <input name="calories" type="hidden" value={props.calories} />
      <input name="protein" type="hidden" value={props.protein} />
      <input name="carbs" type="hidden" value={props.carbs} />
      <input name="fat" type="hidden" value={props.fat} />

      <button
        className="ui-button ui-button--secondary ui-button--medium log-meal"
        disabled={pending}
        type="submit"
      >
        <span className="ui-button__label">
          {pending ? null : <Plus aria-hidden="true" size={16} />}
          {pending ? "Saving…" : "Log this meal"}
        </span>
      </button>

      {state.status === "error" ? (
        <p className="log-meal__error" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
