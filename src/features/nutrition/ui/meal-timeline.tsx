import { Check, ChevronRight, Clock, Plus } from "lucide-react";
import Link from "next/link";

import type { MealSlotGroup } from "@/shared/api/bff/aggregate/nutrition-daily";

interface MealTimelineProps {
  slots: MealSlotGroup[];
}

const SLOT_VI_NAMES: Record<string, string> = {
  breakfast: "Breakfast",
  dinner: "Dinner",
  lunch: "Lunch",
  snack: "Snack",
};

export function MealTimeline({ slots }: MealTimelineProps) {
  return (
    <ol className="meal-timeline">
      {slots.map((slot) => {
        const logged = slot.meals.length > 0;
        const displayName = SLOT_VI_NAMES[slot.slot] || slot.label;
        const scheduledTime = slot.scheduledTime || slot.plannedMeal?.scheduledTime;
        const ingredients = slot.plannedMeal?.ingredients || [];

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
              <div className="flex items-center gap-2">
                <strong>{displayName}</strong>
                {scheduledTime ? (
                  <span className="meal-timeline__time-tag">
                    <Clock size={11} /> {scheduledTime}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {logged ? (
                  <span className="data-value font-bold">
                    {slot.calories} kcal
                  </span>
                ) : slot.plannedMeal ? (
                  <span className="data-value opacity-85 font-semibold">
                    {slot.plannedMeal.calories} kcal
                  </span>
                ) : (
                  <span className="meal-timeline__pending">Not logged</span>
                )}
                <Link
                  className="meal-timeline__action"
                  href={`/nutrition/${slot.slot}`}
                >
                  {logged ? "View details" : "Log meal"} <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {logged ? (
              <ul className="meal-timeline__meals">
                {slot.meals.map((meal) => (
                  <li key={meal.id}>
                    <span>
                      {meal.time ? (
                        <span className="data-value mr-2">
                          {meal.time}
                        </span>
                      ) : null}
                      <span className="meal-timeline__name font-semibold">
                        {meal.name}
                      </span>
                    </span>
                    <span className="data-value font-semibold">
                      {meal.calories} kcal
                    </span>
                  </li>
                ))}
              </ul>
            ) : slot.plannedMeal ? (
              <div className="meal-timeline__planned">
                <div className="meal-timeline__planned-row">
                  <span className="meal-timeline__name font-semibold text-[0.95rem]">
                    {slot.plannedMeal.name}
                  </span>
                  {slot.plannedMeal.protein || slot.plannedMeal.carbs || slot.plannedMeal.fat ? (
                    <span className="meal-timeline__macros">
                      {slot.plannedMeal.protein ? `P: ${slot.plannedMeal.protein}g ` : ""}
                      {slot.plannedMeal.carbs ? `C: ${slot.plannedMeal.carbs}g ` : ""}
                      {slot.plannedMeal.fat ? `F: ${slot.plannedMeal.fat}g` : ""}
                    </span>
                  ) : null}
                </div>

                {ingredients.length > 0 ? (
                  <div className="meal-timeline__ingredients">
                    🥗{" "}
                    {ingredients.map((ing) => `${ing.ingredientName} (${ing.grams}g)`).join(", ")}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="meal-timeline__empty-note">
                No meals logged yet for {displayName.toLowerCase()}.
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
