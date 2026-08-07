"use client";

import { Check, Plus } from "lucide-react";
import { useActionState } from "react";

import { logMealAction } from '@/features/nutrition/server/nutrition-actions';
import type { LogMealState } from '@/features/nutrition/server/nutrition-actions';
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
 * One-tap logging for a menu option.
 *
 * Driven by the form's `action` prop rather than an onClick handler: a Server Function only
 * gets to write cookies and return fresh UI in the same roundtrip when it is used as a form
 * action. Calling it from an event handler leaves the `Set-Cookie` unapplied.
 *
 * The menu option already carries every figure `LogMealRequest` needs, so nothing is typed.
 */
export function LogMealButton(props: LogMealButtonProps) {
  const [state, formAction, pending] = useActionState(logMealAction, INITIAL);

  if (state.status === "saved") {
    return (
      <p className="log-meal log-meal--done">
        <Check aria-hidden="true" size={15} />
        Logged
      </p>
    );
  }

  return (
    <form action={formAction} className="log-meal__form">
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
