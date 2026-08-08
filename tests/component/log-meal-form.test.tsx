import { expect, describe, it } from 'vitest';
import { fireEvent, render, screen } from "@testing-library/react";
import { LogMealForm } from "@/features/nutrition/ui/log-meal-form";

describe(LogMealForm, () => {
  it("renders collapsed trigger button initially", () => {
    render(<LogMealForm slot="breakfast" slotLabel="Breakfast" />);

    const trigger = screen.getByRole("button", {
      name: /log custom meal/i,
    });
    expect(trigger).toBeInTheDocument();
  });

  it("opens form on trigger click and shows meal input and calorie input", () => {
    render(<LogMealForm slot="breakfast" slotLabel="Breakfast" />);

    const trigger = screen.getByRole("button", {
      name: /log custom meal/i,
    });
    fireEvent.click(trigger);

    expect(screen.getByLabelText(/what did you eat\?/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/calories/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add protein, carbs and fat/i })
    ).toBeInTheDocument();
  });

  it("expands macros input fields when 'Add protein, carbs and fat' is clicked", () => {
    render(<LogMealForm slot="lunch" slotLabel="Lunch" />);

    const trigger = screen.getByRole("button", {
      name: /log custom meal/i,
    });
    fireEvent.click(trigger);

    const expandBtn = screen.getByRole("button", {
      name: /add protein, carbs and fat/i,
    });
    fireEvent.click(expandBtn);

    expect(screen.getByLabelText(/protein/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/carbs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fat/i)).toBeInTheDocument();
  });

  it("closes form when Cancel button is clicked", () => {
    render(<LogMealForm slot="dinner" slotLabel="Dinner" />);

    const trigger = screen.getByRole("button", {
      name: /log custom meal/i,
    });
    fireEvent.click(trigger);

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(
      screen.getByRole("button", { name: /log custom meal/i })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/what did you eat\?/i)).not.toBeInTheDocument();
  });

  it("shows custom validation error message when submitting empty meal name", () => {
    render(<LogMealForm slot="breakfast" slotLabel="Breakfast" />);

    const trigger = screen.getByRole("button", {
      name: /log custom meal/i,
    });
    fireEvent.click(trigger);

    const saveBtn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveBtn);

    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a meal name");
  });
});
