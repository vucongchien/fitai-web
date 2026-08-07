import { fireEvent, render, screen } from "@testing-library/react";

import { ProfileContent } from "../../../src/features/profile/components/profile-content";
import { mapRawDataToProfileViewModel } from "../../../src/features/profile/model/profile.mapper";

describe("profile UI Components", () => {
  const mockProfileData = mapRawDataToProfileViewModel({
    user: { name: "Emma Nguyen", level: 10 },
    profileProto: { weightKg: 68.5, heightCm: 175, targetWeightKg: 65, bodyFatPercent: 18.5 },
    prListProto: [{ exerciseName: "Barbell Deadlift", weight: 140, reps: 1, oneRepMax: 140 }],
    statsProto: { totalWorkouts: 48, activeStreakDays: 12, totalCaloriesKcal: 12_500 },
  });

  it("renders user profile hero card with English labels", () => {
    render(<ProfileContent profile={mockProfileData} />);

    expect(screen.getByText("Emma Nguyen")).toBeInTheDocument();
    expect(screen.getByText("Level 10")).toBeInTheDocument();
    expect(screen.getByText("Barbell Deadlift 140kg")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("12 days")).toBeInTheDocument();
    expect(screen.getByText("12.5k")).toBeInTheDocument();
  });

  it("renders 3 highlight cards for Weight, Body Fat, and Target", () => {
    render(<ProfileContent profile={mockProfileData} />);

    expect(screen.getAllByText("Weight")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Body Fat")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Target")[0]).toBeInTheDocument();
    expect(screen.getAllByText("68.5")[0]).toBeInTheDocument();
    expect(screen.getAllByText("18.5")[0]).toBeInTheDocument();
    expect(screen.getAllByText("65")[0]).toBeInTheDocument();
  });

  it("opens Body Metrics modal when clicking Body Metrics menu item", () => {
    render(<ProfileContent profile={mockProfileData} />);

    const item = screen.getAllByText("Body Metrics")[0];
    fireEvent.click(item);

    expect(screen.getAllByText("Body Metrics").length).toBeGreaterThan(0);
    expect(screen.getByText("Current Weight (kg)")).toBeInTheDocument();
  });

  it("opens Training Goals modal when clicking Training Goals menu item", () => {
    render(<ProfileContent profile={mockProfileData} />);

    const item = screen.getAllByText("Training Goals")[0];
    fireEvent.click(item);

    expect(screen.getByText("Experience Level")).toBeInTheDocument();
    expect(screen.getByText("Primary Goals (Select at least 1)")).toBeInTheDocument();
  });

  it("opens Available Equipment modal when clicking Available Equipment menu item", () => {
    render(<ProfileContent profile={mockProfileData} />);

    const item = screen.getAllByText("Available Equipment")[0];
    fireEvent.click(item);

    expect(screen.getByText("Barbells, dumbbells, cable machines & racks")).toBeInTheDocument();
  });

  it("opens Injury Management modal when clicking Injury Management menu item", () => {
    render(<ProfileContent profile={mockProfileData} />);

    const item = screen.getAllByText("Injury Management")[0];
    fireEvent.click(item);

    expect(screen.getByText("+ Report Injury")).toBeInTheDocument();
  });
});
