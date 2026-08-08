"use client";

import { useState, useTransition } from "react";
import { ChefHat, Plus, Refrigerator, RotateCcw, Sparkles, X } from "lucide-react";
import type { PantryMealOption, PantryRecalibrateResult } from "@/features/nutrition/server/nutrition-actions";
import { recalibratePantryAction } from "@/features/nutrition/server/nutrition-actions";
import { LogMealButton } from "@/features/nutrition/ui/log-meal-button";

const POPULAR_INGREDIENTS = [
  "Skinless Chicken Breast",
  "Chicken Eggs",
  "Lean Beef",
  "Sweet Potato",
  "Broccoli",
  "White Rice",
  "Extra Virgin Olive Oil",
  "Fresh Shrimp",
  "Tofu",
];

const PRICE_LABEL: Record<string, string> = {
  high: "HIGHER COST",
  low: "BUDGET",
  medium: "MID COST",
};

function isPantryOption(option: PantryMealOption, pantryIngs: string[]): boolean {
  if (pantryIngs.length === 0) return true;
  const text = `${option.mealName} ${option.description || ""} ${(option.recipeSteps || []).join(" ")}`.toLowerCase();
  return pantryIngs.some((ing) => {
    const trimmed = ing.trim().toLowerCase();
    if (!trimmed) return false;
    const words = trimmed.split(/\s+/).filter((w) => w.length >= 2);
    if (words.length === 0) return text.includes(trimmed);
    return words.some((word) => text.includes(word));
  });
}

export function PantryRecalibrateCard() {
  const [ingredients, setIngredients] = useState<string[]>([
    "Skinless Chicken Breast",
    "Broccoli",
    "Sweet Potato",
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [generatedMenu, setGeneratedMenu] = useState<PantryRecalibrateResult["meals"] | null>(null);

  const handleAddIngredient = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !ingredients.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setIngredients((prev) => [...prev, trimmed]);
      setInputVal("");
    }
  };

  const handleRemoveIngredient = (indexToRemove: number) => {
    setIngredients((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitRecalibrate = () => {
    if (ingredients.length === 0) {
      setStatusMsg({ type: "error", text: "Please enter at least 1 ingredient in your fridge!" });
      return;
    }

    setStatusMsg(null);
    startTransition(async () => {
      const res = await recalibratePantryAction(ingredients);
      if (res.success) {
        setStatusMsg({
          type: "success",
          text: "✨ Successfully generated menu from available pantry ingredients!",
        });
        if (res.meals) {
          setGeneratedMenu(res.meals);
        }
      } else {
        setStatusMsg({
          type: "error",
          text: res.message || "Could not recalibrate menu. Please try again!",
        });
      }
    });
  };

  const handleResetToInputMode = () => {
    setGeneratedMenu(null);
    setStatusMsg(null);
  };

  if (generatedMenu) {
    const slots: ("breakfast" | "lunch" | "dinner" | "snack")[] = ["breakfast", "lunch", "dinner", "snack"];
    const allRawItems: { option: PantryMealOption; slotKey: "breakfast" | "lunch" | "dinner" | "snack" }[] = [];

    for (const s of slots) {
      const opts = generatedMenu[s] || [];
      for (const opt of opts) {
        allRawItems.push({ option: opt, slotKey: s });
      }
    }

    const filteredItems = allRawItems.filter((item) => isPantryOption(item.option, ingredients));
    const itemsToDisplay = filteredItems.length > 0 ? filteredItems : allRawItems;

    const seenNames = new Set<string>();
    const uniqueDisplayItems: { option: PantryMealOption; slotKey: "breakfast" | "lunch" | "dinner" | "snack" }[] = [];
    for (const item of itemsToDisplay) {
      const nameKey = item.option.mealName.trim().toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        uniqueDisplayItems.push(item);
      }
    }

    return (
      <section className="content-section">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <ChefHat size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  Pantry Recipes
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-medium">
                    AI Generated
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generated optimal recipes from {ingredients.length} pantry ingredients:{" "}
                  <strong className="text-emerald-700 font-semibold">{ingredients.join(", ")}</strong>
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetToInputMode}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            Change ingredients
          </button>
        </div>

        {uniqueDisplayItems.length > 0 ? (
          <ul className="meal-choices">
            {uniqueDisplayItems.map(({ option, slotKey }, index: number) => {
              const hasSteps = option.recipeSteps && option.recipeSteps.length > 0;
              const tierKey = option.priceTier ? option.priceTier.toLowerCase() : "medium";
              const tierLabel = PRICE_LABEL[tierKey] || "MID COST";

              return (
                <li className="meal-choice" key={`${option.mealName}-${index}`}>
                  <div className="meal-choice__head">
                    <h3>{option.mealName}</h3>
                    <span className="meal-choice__tier" data-tier={tierKey}>
                      {tierLabel}
                    </span>
                  </div>

                  {option.description ? (
                    <p className="meal-choice__description">{option.description}</p>
                  ) : null}

                  <dl className="meal-macros">
                    <div className="meal-macro meal-macro--calories">
                      <dt>CALORIES</dt>
                      <dd className="data-value">{option.calories} kcal</dd>
                    </div>
                    <div className="meal-macro meal-macro--protein">
                      <dt>PROTEIN</dt>
                      <dd className="data-value">{option.protein} g</dd>
                    </div>
                    <div className="meal-macro meal-macro--carbs">
                      <dt>CARBS</dt>
                      <dd className="data-value">{option.carbs} g</dd>
                    </div>
                    <div className="meal-macro meal-macro--fat">
                      <dt>FAT</dt>
                      <dd className="data-value">{option.fat} g</dd>
                    </div>
                  </dl>

                  <details className="meal-recipe" open={Boolean(hasSteps)}>
                    <summary className="meal-recipe__summary">
                      <span className="meal-recipe__summary-title">
                        <ChefHat size={14} aria-hidden="true" /> How to cook it
                      </span>
                      {hasSteps ? (
                        <span className="meal-recipe__count">{option.recipeSteps!.length} steps</span>
                      ) : (
                        <span className="meal-recipe__count">Quick prep</span>
                      )}
                    </summary>
                    {hasSteps ? (
                      <ol className="meal-recipe__steps">
                        {option.recipeSteps!.map((step, sIdx) => (
                          <li key={`${option.mealName}-step-${sIdx}`}>
                            <span className="meal-recipe__step-num">{sIdx + 1}</span>
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

                  <LogMealButton
                    calories={option.calories}
                    carbs={option.carbs}
                    fat={option.fat}
                    mealName={option.mealName}
                    protein={option.protein}
                    slot={slotKey}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            No meal options found from pantry ingredients. Please click &quot;Change ingredients&quot;.
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="content-section">
      <div className="content-section__header">
        <h2 className="flex items-center gap-2">
          <Refrigerator size={18} className="text-emerald-600" /> Pantry &amp; Available Ingredients
        </h2>
        <p>Enter food items in your fridge for AI to suggest optimal meals</p>
      </div>

      <div className="meal-choice space-y-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Popular ingredient suggestions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_INGREDIENTS.map((item) => {
              const isAdded = ingredients.some((ing) => ing.toLowerCase() === item.toLowerCase());
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => (isAdded ? null : handleAddIngredient(item))}
                  disabled={isAdded}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                    isAdded
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default opacity-60"
                      : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50"
                  }`}
                >
                  {!isAdded && <Plus size={11} />}
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddIngredient(inputVal);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter ingredient name (e.g. Chicken breast, Eggs, Shrimp...)"
              className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              <Plus size={16} /> Add
            </button>
          </form>

          {ingredients.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100 min-h-[44px] items-center">
              {ingredients.map((ing, index) => (
                <span
                  key={`${ing}-${index}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg shadow-2xs group hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-all"
                >
                  <span>{ing}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="text-emerald-500 group-hover:text-red-500 hover:scale-110 transition-all p-0.5"
                    title="Remove ingredient"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              No ingredients added yet. Select from suggestions above or enter custom items.
            </div>
          )}
        </div>

        {statusMsg ? (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <span>{statusMsg.text}</span>
            <button type="button" onClick={() => setStatusMsg(null)} className="p-1 hover:opacity-75">
              <X size={14} />
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmitRecalibrate}
          disabled={isPending || ingredients.length === 0}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>AI recalibrating menu...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Recalibrate menu from pantry ({ingredients.length} ingredients)</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
