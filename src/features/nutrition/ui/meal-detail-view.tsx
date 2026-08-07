import { Check } from "lucide-react";

import type { MealChoice, MealDetailPageData } from "@/features/nutrition/model/meal-detail.types";
import { LogMealButton } from "@/features/nutrition/ui/log-meal-button";
import { LogMealForm } from "@/features/nutrition/ui/log-meal-form";

interface MealDetailViewProps {
  data: MealDetailPageData;
}

const PRICE_LABEL = {
  high: "Higher cost",
  low: "Budget",
  medium: "Mid cost",
} as const;

function RecipeSteps({ id, steps }: { id: string; steps: string[] }) {
  return (
    <details className="meal-recipe">
      <summary>
        How to cook it
        <span className="meal-recipe__count data-value">{steps.length} steps</span>
      </summary>
      <ol className="meal-recipe__steps">
        {steps.map((step, index) => (
          // Steps are plain strings with no id; order is their identity.
          <li key={`${id}-step-${index}`}>{step}</li>
        ))}
      </ol>
    </details>
  );
}

function MacroLine({ choice }: { choice: MealChoice }) {
  return (
    <dl className="meal-macros">
      <div>
        <dt>Calories</dt>
        <dd className="data-value">{choice.calories.toLocaleString()} kcal</dd>
      </div>
      <div>
        <dt>Protein</dt>
        <dd className="data-value">{choice.protein} g</dd>
      </div>
      <div>
        <dt>Carbs</dt>
        <dd className="data-value">{choice.carbs} g</dd>
      </div>
      <div>
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
          <span aria-hidden="true" className="meal-logged__mark">
            <Check size={15} />
          </span>
          <div>
            <span className="utility-label">Logged today</span>
            <ul className="meal-logged__list">
              {data.loggedMeals.map((meal) => (
                <li key={meal.id} className="divide-y divide-coral-tint-200">
                  {meal.time ? <span className="data-value">{meal.time}</span> : null}
                  <span className="meal-logged__name">{meal.name}</span>
                  <span className="data-value">{meal.calories} kcal</span>
                  {meal.recipeSteps.length > 0 ? (
                    <RecipeSteps id={meal.id} steps={meal.recipeSteps} />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          {/* The per-meal figure already says it when there is only one row. */}
          {data.loggedMeals.length > 1 ? (
            <strong className="meal-logged__total data-value">
              {data.loggedCalories} kcal total
            </strong>
          ) : null}
        </section>
      ) : (
        <p className="meal-empty">
          Nothing logged for {data.slotLabel.toLowerCase()} yet. The options below are today&rsquo;s
          suggestions.
        </p>
      )}

      {/* Only rendered when a suggestion remains after excluding what was already eaten. */}
      {data.choices.length > 0 ? (
        <section className="content-section">
          <div className="content-section__header">
            <h2>{logged ? "Other options today" : "Today’s options"}</h2>
            <p>
              <span className="data-value">{data.choices.length}</span>{" "}
              {data.choices.length === 1 ? "suggestion" : "suggestions"}
            </p>
          </div>

          <ul className="meal-choices">
            {data.choices.map((choice) => (
              <li className="meal-choice" key={choice.id}>
                <div className="meal-choice__head">
                  <h3>{choice.name}</h3>
                  {choice.priceTier ? (
                    <span className="meal-choice__tier" data-tier={choice.priceTier}>
                      {PRICE_LABEL[choice.priceTier]}
                    </span>
                  ) : null}
                </div>

                {choice.description ? (
                  <p className="meal-choice__description">{choice.description}</p>
                ) : null}

                <MacroLine choice={choice} />

                {choice.recipeSteps.length > 0 ? (
                  <RecipeSteps id={choice.id} steps={choice.recipeSteps} />
                ) : (
                  <p className="meal-choice__no-recipe">No preparation needed.</p>
                )}

                <LogMealButton
                  calories={choice.calories}
                  carbs={choice.carbs}
                  fat={choice.fat}
                  mealName={choice.name}
                  protein={choice.protein}
                  slot={data.slot}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="content-section">
        <div className="content-section__header">
          <h2>Log something else</h2>
          <p>For a meal that is not on today&rsquo;s menu</p>
        </div>
        <LogMealForm slot={data.slot} slotLabel={data.slotLabel} />
      </section>
    </>
  );
}
