import { Check, ChevronRight, Plus } from "lucide-react";
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

        return (
          <li
            className="meal-timeline__slot"
            data-state={logged ? "logged" : "empty"}
            key={slot.slot}
            style={{ position: "relative", marginBottom: "1rem" }}
          >
            <span aria-hidden="true" className="meal-timeline__marker">
              {logged ? <Check size={13} /> : <Plus size={13} />}
            </span>

            <div className="meal-timeline__head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{displayName}</strong>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {logged ? (
                  <span className="data-value" style={{ fontWeight: 700 }}>{slot.calories} kcal</span>
                ) : slot.plannedMeal ? (
                  <span className="data-value" style={{ opacity: 0.8 }}>{slot.plannedMeal.calories} kcal (Planned)</span>
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
              <ul className="meal-timeline__meals" style={{ marginTop: "0.5rem" }}>
                <li style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0" }}>
                  <span className="meal-timeline__name" style={{ fontStyle: "italic", opacity: 0.85 }}>
                    📌 Scheduled menu: <strong>{slot.plannedMeal.name}</strong>
                  </span>
                  <span className="data-value">{slot.plannedMeal.calories} kcal</span>
                </li>
              </ul>
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
