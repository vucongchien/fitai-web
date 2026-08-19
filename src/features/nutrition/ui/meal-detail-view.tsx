import { Check, ChefHat, Clock, Flame, Salad, Sparkles, Utensils } from "lucide-react";

import type { MealChoice, MealDetailPageData } from "@/features/nutrition/model/meal-detail.types";
import type { MealIngredient } from "@/shared/api/bff/aggregate/nutrition-daily";
import { LogMealButton } from "@/features/nutrition/ui/log-meal-button";
import { LogMealForm } from "@/features/nutrition/ui/log-meal-form";
import { PantryRecalibrateCard } from "@/features/nutrition/ui/pantry-recalibrate-card";

interface MealDetailViewProps {
  data: MealDetailPageData;
}

const PRICE_LABEL = {
  high: "Higher cost",
  low: "Budget",
  medium: "Mid cost",
} as const;

function IngredientsList({ ingredients }: { ingredients: MealIngredient[] }) {
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  return (
    <div className="meal-ingredients" style={{ margin: "0.75rem 0" }}>
      <div
        style={{
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "var(--color-text-muted, #8b949e)",
          marginBottom: "0.35rem",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        <Salad size={13} aria-hidden="true" /> Ingredients & Portions
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {ingredients.map((ing, idx) => (
          <li
            key={`ing-${idx}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.8rem",
              padding: "0.2rem 0.5rem",
              borderRadius: "0.375rem",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span style={{ fontWeight: 500 }}>{ing.ingredientName}</span>
            <span className="data-value" style={{ fontWeight: 700, color: "var(--color-primary, #e25c38)" }}>
              {ing.grams}g
            </span>
            {ing.isSupplementary ? <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>(optional)</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecipeSteps({ id, steps }: { id: string; steps: string[] }) {
  const hasSteps = steps && steps.length > 0;

  return (
    <details className="meal-recipe" open={hasSteps}>
      <summary className="meal-recipe__summary">
        <span className="meal-recipe__summary-title">
          <ChefHat size={14} aria-hidden="true" /> How to cook it
        </span>
        {hasSteps ? (
          <span className="meal-recipe__count">{steps.length} steps</span>
        ) : (
          <span className="meal-recipe__count">Quick prep</span>
        )}
      </summary>

      {hasSteps ? (
        <ol className="meal-recipe__steps">
          {steps.map((step, index) => (
            <li key={`${id}-step-${index}`}>
              <span className="meal-recipe__step-num">{index + 1}</span>
              <span className="meal-recipe__step-text">{step}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="meal-recipe__steps">
          <li>
            <span className="meal-recipe__step-num">1</span>
            <span className="meal-recipe__step-text">Prepare ingredients and portion to your target serving size.</span>
          </li>
          <li>
            <span className="meal-recipe__step-num">2</span>
            <span className="meal-recipe__step-text">Cook or assemble to your preferred method.</span>
          </li>
          <li>
            <span className="meal-recipe__step-num">3</span>
            <span className="meal-recipe__step-text">Serve fresh and log any macro adjustments if needed.</span>
          </li>
        </ol>
      )}
    </details>
  );
}

function MacroLine({ choice }: { choice: MealChoice }) {
  return (
    <dl className="meal-macros">
      <div className="meal-macro meal-macro--calories">
        <dt>Calories</dt>
        <dd className="data-value">{choice.calories.toLocaleString()} kcal</dd>
      </div>
      <div className="meal-macro meal-macro--protein">
        <dt>Protein</dt>
        <dd className="data-value">{choice.protein} g</dd>
      </div>
      <div className="meal-macro meal-macro--carbs">
        <dt>Carbs</dt>
        <dd className="data-value">{choice.carbs} g</dd>
      </div>
      <div className="meal-macro meal-macro--fat">
        <dt>Fat</dt>
        <dd className="data-value">{choice.fat} g</dd>
      </div>
    </dl>
  );
}

export function MealDetailView({ data }: MealDetailViewProps) {
  const logged = data.loggedMeals.length > 0;

  return (
    <>
      {logged ? (
        <section className="meal-logged">
          <div className="meal-logged__header">
            <div className="meal-logged__header-title">
              <span aria-hidden="true" className="meal-logged__mark">
                <Check size={14} />
              </span>
              <span className="utility-label">LOGGED TODAY</span>
            </div>
            {data.loggedMeals.length > 1 ? (
              <span className="meal-logged__total-badge data-value">
                <Flame size={13} /> {data.loggedCalories} kcal total
              </span>
            ) : null}
          </div>

          <ul className="meal-logged__list">
            {data.loggedMeals.map((meal) => (
              <li key={meal.id} className="meal-logged__item">
                <div className="meal-logged__row">
                  <div className="meal-logged__meta">
                    {meal.time ? <span className="meal-logged__time">{meal.time}</span> : null}
                    <span className="meal-logged__name">{meal.name}</span>
                  </div>
                  <span className="meal-logged__calories">{meal.calories} kcal</span>
                </div>
                {meal.ingredients && meal.ingredients.length > 0 ? (
                  <IngredientsList ingredients={meal.ingredients} />
                ) : null}
                <RecipeSteps id={meal.id} steps={meal.recipeSteps} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <div className="meal-empty-card">
          <Utensils size={24} className="meal-empty-card__icon" />
          <p className="meal-empty">
            Nothing logged for <strong>{data.slotLabel.toLowerCase()}</strong> yet. Choose from today&rsquo;s chef suggestions below or add a custom meal.
          </p>
        </div>
      )}

      {/* Only rendered when a suggestion remains after excluding what was already eaten. */}
      {data.choices.length > 0 ? (
        <section className="content-section">
          <div className="content-section__header">
            <h2 className="section-title--culinary">
              <Sparkles size={18} /> {logged ? "Other options today" : "Chef Suggestions"}
            </h2>
            <p>
              <span className="data-value">{data.choices.length}</span>{" "}
              {data.choices.length === 1 ? "suggestion" : "suggestions"}
            </p>
          </div>

          <ul className="meal-choices">
            {data.choices.map((choice) => (
              <li className="meal-choice" key={choice.id}>
                <div className="meal-choice__head">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <h3>{choice.name}</h3>
                    {choice.scheduledTime ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted, #8b949e)",
                        }}
                      >
                        <Clock size={12} /> Scheduled: {choice.scheduledTime}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    {choice.isNutiFoodProduct ? (
                      <span className="meal-choice__tier" data-tier="low">
                        NutiFood
                      </span>
                    ) : null}
                    {choice.priceTier ? (
                      <span className="meal-choice__tier" data-tier={choice.priceTier}>
                        {PRICE_LABEL[choice.priceTier]}
                      </span>
                    ) : null}
                  </div>
                </div>

                {choice.description ? <p className="meal-choice__description">{choice.description}</p> : null}

                <MacroLine choice={choice} />

                <IngredientsList ingredients={choice.ingredients} />

                <RecipeSteps id={choice.id} steps={choice.recipeSteps} />

                <LogMealButton
                  calories={choice.calories}
                  carbs={choice.carbs}
                  fat={choice.fat}
                  mealName={choice.rawName || choice.name}
                  protein={choice.protein}
                  slot={data.slot}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <PantryRecalibrateCard />

      <section className="content-section">
        <div className="content-section__header">
          <h2>Log custom meal</h2>
          <p>For a meal that is not on today&rsquo;s menu</p>
        </div>
        <LogMealForm slot={data.slot} slotLabel={data.slotLabel} />
      </section>
    </>
  );
}
