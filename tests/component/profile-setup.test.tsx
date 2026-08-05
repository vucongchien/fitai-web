import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProfileForm } from "@/features/profile/ui/profile-form";

describe("Profile Setup Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders training setup with availability scheduler, equipment, and coach style", () => {
    render(<ProfileForm />);

    expect(screen.getByText(/training setup & availability/i)).toBeInTheDocument();
    expect(screen.getByText(/available equipment/i)).toBeInTheDocument();
    expect(screen.getByText(/coach style/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });

  it("enters edit mode and allows toggling training days and equipment", () => {
    render(<ProfileForm />);

    const editBtn = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editBtn);

    expect(screen.getByText(/save changes/i)).toBeInTheDocument();

    // Toggle equipment
    const dumbbellsBtn = screen.getByRole("button", { name: /dumbbells/i });
    expect(dumbbellsBtn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(dumbbellsBtn);
    expect(dumbbellsBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("handles injury report and recovery toggle", () => {
    render(<ProfileForm />);

    const reportInjuryBtn = screen.getByRole("button", { name: /report injury/i });
    expect(reportInjuryBtn).toBeInTheDocument();

    fireEvent.click(reportInjuryBtn);
    expect(screen.getByText(/active injury constraints/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark as recovered/i })).toBeInTheDocument();
  });
});
