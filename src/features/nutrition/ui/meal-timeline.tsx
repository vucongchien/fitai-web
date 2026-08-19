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
            style={{ position: "relative", marginBottom: "1.25rem" }}
          >
            <span aria-hidden="true" className="meal-timeline__marker">
              {logged ? <Check size={13} /> : <Plus size={13} />}
            </span>

            <div className="meal-timeline__head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <strong>{displayName}</strong>
                {scheduledTime ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.75rem",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "0.375rem",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      color: "var(--color-text-muted, #8b949e)",
                      fontWeight: 500,
                    }}
                  >
                    <Clock size={11} /> {scheduledTime}
                  </span>
                ) : null}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {logged ? (
                  <span className="data-value" style={{ fontWeight: 700 }}>{slot.calories} kcal</span>
                ) : slot.plannedMeal ? (
                  <span className="data-value" style={{ opacity: 0.85, fontWeight: 600 }}>{slot.plannedMeal.calories} kcal</span>
                ) : (
                  <span className="meal-timeline__pending">Not logged</span>
                )}
                <Link
                  href={`/nutrition/${slot.slot}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.8rem",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    color: "inherit",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {logged ? "View details" : "Log meal"} <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {logged ? (
              <ul className="meal-timeline__meals" style={{ marginTop: "0.5rem" }}>
                {slot.meals.map((meal) => (
                  <li key={meal.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0" }}>
                    <span>
                      {meal.time ? <span className="data-value" style={{ marginRight: "0.5rem" }}>{meal.time}</span> : null}
                      <span className="meal-timeline__name" style={{ fontWeight: 600 }}>{meal.name}</span>
                    </span>
                    <span className="data-value" style={{ fontWeight: 600 }}>{meal.calories} kcal</span>
                  </li>
                ))}
              </ul>
            ) : slot.plannedMeal ? (
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span className="meal-timeline__name" style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    {slot.plannedMeal.name}
                  </span>
                  {(slot.plannedMeal.protein || slot.plannedMeal.carbs || slot.plannedMeal.fat) ? (
                    <span style={{ fontSize: "0.75rem", opacity: 0.75 }}>
                      {slot.plannedMeal.protein ? `P: ${slot.plannedMeal.protein}g ` : ""}
                      {slot.plannedMeal.carbs ? `C: ${slot.plannedMeal.carbs}g ` : ""}
                      {slot.plannedMeal.fat ? `F: ${slot.plannedMeal.fat}g` : ""}
                    </span>
                  ) : null}
                </div>

                {ingredients.length > 0 ? (
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #8b949e)", lineHeight: 1.4 }}>
                    🥗 {ingredients.map((ing) => `${ing.ingredientName} (${ing.grams}g)`).join(", ")}
                  </div>
                ) : null}
              </div>
            ) : (
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", opacity: 0.6 }}>
                No meals logged yet for {displayName.toLowerCase()}.
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
