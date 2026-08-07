"use client";

import { ChevronDown } from "lucide-react";
import { useActionState, useCallback, useId, useRef, useState } from "react";

import { logMealAction } from '@/features/nutrition/server/nutrition-actions';
import type { LogMealState } from '@/features/nutrition/server/nutrition-actions';
import type { MealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";

interface LogMealFormProps {
  slot: MealSlot;
  slotLabel: string;
}

const INITIAL: LogMealState = { status: "idle" };

/**
 * Manual entry, for a meal that is not on today's menu.
 *
 * Collapsed by default: picking a menu option needs no typing at all, so this is the
 * exception. Name and calories are the only fields on show — macros stay folded away
 * because `LogMealRequest` accepts 0 and a guessed number is worse than an honest zero.
 */
export function LogMealForm({ slot, slotLabel }: LogMealFormProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [macrosOpen, setMacrosOpen] = useState(false);
  const [state, formAction, pending] = useActionState(logMealAction, INITIAL);
  const formId = useId();

  /**
   * Move focus into the first field when the disclosure opens.
   *
   * The button that had focus unmounts on the same tick, so without this the
   * focus ring lands back on <body> and keyboard users lose their place. Doing it
   * here rather than with `autoFocus` keeps the behaviour but scopes it to the
   * open transition — `autoFocus` would also steal focus on a full page load.
   */
  const openForm = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => nameRef.current?.focus());
  }, []);
  const closeForm = useCallback(() => setOpen(false), []);
  const showMacros = useCallback(() => setMacrosOpen(true), []);

  // Collapse once the write has landed; the logged row above carries the confirmation.
  if (!open || state.status === "saved") {
    return (
      <button className="log-open" onClick={openForm} type="button">
        <ChevronDown aria-hidden="true" size={16} />
        Log something not on the menu
      </button>
    );
  }

  return (
    <form action={formAction} className="log-form">
      <input name="slot" type="hidden" value={slot} />

      <div className="log-form__field">
        <label htmlFor={`${formId}-name`}>What did you eat?</label>
        <input
          autoComplete="off"
          id={`${formId}-name`}
          name="mealName"
          ref={nameRef}
          placeholder={`Your own ${slotLabel.toLowerCase()}`}
          required
          type="text"
        />
      </div>

      <div className="log-form__field">
        <label htmlFor={`${formId}-calories`}>
          Calories <span className="log-form__unit">(kcal)</span>
        </label>
        <input
          id={`${formId}-calories`}
          inputMode="numeric"
          min={0}
          name="calories"
          placeholder="0"
          type="number"
        />
      </div>

      {macrosOpen ? (
        <div className="log-form__grid">
          {(
            [
              ["protein", "Protein"],
              ["carbs", "Carbs"],
              ["fat", "Fat"],
            ] as const
          ).map(([key, label]) => (
            <div className="log-form__field" key={key}>
              <label htmlFor={`${formId}-${key}`}>
                {label} <span className="log-form__unit">(g)</span>
              </label>
              <input
                id={`${formId}-${key}`}
                inputMode="numeric"
                min={0}
                name={key}
                placeholder="0"
                type="number"
              />
            </div>
          ))}
        </div>
      ) : (
        <button className="log-form__more" onClick={showMacros} type="button">
          Add protein, carbs and fat
        </button>
      )}

      {state.status === "error" ? (
        <p className="log-form__error" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="log-form__actions">
        <button
          className="ui-button ui-button--primary ui-button--medium"
          disabled={pending}
          type="submit"
        >
          <span className="ui-button__label">{pending ? "Saving…" : "Save"}</span>
        </button>
        <button
          className="ui-button ui-button--quiet ui-button--medium"
          disabled={pending}
          onClick={closeForm}
          type="button"
        >
          <span className="ui-button__label">Cancel</span>
        </button>
      </div>
    </form>
  );
}
