import { describe, expect, it } from '@jest/globals';
import { render, screen } from "@testing-library/react";
import { MealDetailView } from "@/features/nutrition/ui/meal-detail-view";
import type { MealDetailPageData } from "@/features/nutrition/model/meal-detail.types";

const MOCK_DATA_WITH_RECIPE: MealDetailPageData = {
  slot: "breakfast",
  slotLabel: "Breakfast",
  loggedMeals: [
    {
      id: "meal-1",
      name: "Lean beef pho",
      calories: 420,
      time: "07:30",
      recipeSteps: ["Boil broth", "Add beef"],
    },
  ],
  loggedCalories: 420,
  choices: [
    {
      id: "choice-1",
      name: "Oatmeal with berries",
      calories: 350,
      protein: 12,
      carbs: 55,
      fat: 6,
      recipeSteps: [],
      description: "",
      priceTier: null,
    },
  ],
};

const MOCK_DATA_CUSTOM: MealDetailPageData = {
  slot: "snack",
  slotLabel: "Snack",
  loggedMeals: [
    {
      id: "meal-2",
      name: "Apple and almonds",
      calories: 180,
      time: "10:00",
      recipeSteps: [], // Custom log — no steps
    },
  ],
  loggedCalories: 180,
  choices: [],
};

describe(MealDetailView, () => {
  it("renders logged meal section with item name and calories", () => {
    render(<MealDetailView data={MOCK_DATA_WITH_RECIPE} />);

    expect(screen.getByText("LOGGED TODAY")).toBeInTheDocument();
    expect(screen.getByText("Lean beef pho")).toBeInTheDocument();
    expect(screen.getByText(/420 kcal/)).toBeInTheDocument();
  });

  it("renders 'How to cook it' header for a logged meal with recipe steps", () => {
    render(<MealDetailView data={MOCK_DATA_WITH_RECIPE} />);

    // Should show the recipe section title
    const recipeHeaders = screen.getAllByText("How to cook it");
    expect(recipeHeaders.length).toBeGreaterThan(0);
    // Steps should be visible
    expect(screen.getByText("Boil broth")).toBeInTheDocument();
    expect(screen.getByText("Add beef")).toBeInTheDocument();
  });

  it("renders 'How to cook it' with quick-prep guide when no recipe steps exist", () => {
    render(<MealDetailView data={MOCK_DATA_CUSTOM} />);

    // Section title always present
    const recipeHeaders = screen.getAllByText("How to cook it");
    expect(recipeHeaders.length).toBeGreaterThan(0);
    // Quick prep badge
    expect(screen.getByText("Quick prep")).toBeInTheDocument();
    // Generic guidance steps
    expect(screen.getByText(/Prepare ingredients and portion/)).toBeInTheDocument();
  });

  it("renders suggestions and log custom meal form header", () => {
    render(<MealDetailView data={MOCK_DATA_WITH_RECIPE} />);

    expect(screen.getByText(/Other options today/)).toBeInTheDocument();
    expect(screen.getByText("Oatmeal with berries")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Log custom meal" })).toBeInTheDocument();
  });

  it("renders 'How to cook it' for a suggestion card with no steps (quick-prep mode)", () => {
    render(<MealDetailView data={MOCK_DATA_WITH_RECIPE} />);

    // Oatmeal with berries has recipeSteps: [] so should show quick prep
    expect(screen.getByText("Quick prep")).toBeInTheDocument();
  });

  it("renders empty state when no meals logged", () => {
    render(
      <MealDetailView
        data={{
          slot: "lunch",
          slotLabel: "Lunch",
          loggedMeals: [],
          loggedCalories: 0,
          choices: [],
        }}
      />
    );

    expect(screen.getByText(/Nothing logged for/)).toBeInTheDocument();
  });
});
