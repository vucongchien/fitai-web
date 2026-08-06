import { Check, Plus } from "lucide-react";

import type { MealSlotGroup } from "@/shared/api/bff/aggregate/nutrition-daily";

type MealTimelineProps = {
  slots: MealSlotGroup[];
};

export function MealTimeline({ slots }: MealTimelineProps) {
  return (
    <ol className="meal-timeline">
      {slots.map((slot) => {
        const logged = slot.meals.length > 0;

        return (
          <li
            className="meal-timeline__slot"
            data-state={logged ? "logged" : "empty"}
            key={slot.slot}
          >
            <span aria-hidden="true" className="meal-timeline__marker">
              {logged ? <Check size={13} /> : <Plus size={13} />}
            </span>

            <div className="meal-timeline__head">
              <strong>{slot.label}</strong>
              {logged ? (
                <span className="data-value">{slot.calories} kcal</span>
              ) : (
                <span className="meal-timeline__pending">Not logged</span>
              )}
            </div>

            {logged ? (
              <ul className="meal-timeline__meals">
                {slot.meals.map((meal) => (
                  <li key={meal.id}>
                    {meal.time ? <span className="data-value">{meal.time}</span> : null}
                    <span className="meal-timeline__name">{meal.name}</span>
                    <span className="data-value">{meal.calories}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
