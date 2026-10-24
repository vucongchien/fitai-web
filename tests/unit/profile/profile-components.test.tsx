import { fireEvent, render, screen } from "@testing-library/react";

import { ProfileSettingsView } from "../../../src/features/profile/components/profile-settings-view";
import { mapRawDataToProfileViewModel } from "../../../src/features/profile/model/profile.mapper";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

describe("profile UI Components - ProfileSettingsView", () => {
  const mockProfileData = mapRawDataToProfileViewModel({
    user: { name: "Emma Nguyen", level: 10 },
    profileProto: { weightKg: 68.5, heightCm: 175, targetWeightKg: 65, bodyFatPercent: 18.5 },
    prListProto: [{ exerciseName: "Barbell Deadlift", weight: 140, reps: 1, oneRepMax: 140 }],
    statsProto: { totalWorkouts: 48, activeStreakDays: 12, totalCaloriesKcal: 12_500 },
  });

  it("renders profile settings page with exact Duolingo layout sections", () => {
    render(<ProfileSettingsView profile={mockProfileData} />);

    expect(screen.getByText("Settings")).toBeInTheDocument();

    // Group 1: Training & Health Profile
    expect(screen.getByText("Training & Health Profile")).toBeInTheDocument();
    expect(screen.getByText("Personal Info")).toBeInTheDocument();
    expect(screen.getByText("Body Metrics")).toBeInTheDocument();
    expect(screen.getByText("Training Goals")).toBeInTheDocument();
    expect(screen.getByText("Available Equipment")).toBeInTheDocument();
    expect(screen.getByText("Injury Management")).toBeInTheDocument();

    // Group 2: Preferences & Membership
    expect(screen.getByText("Preferences & Membership")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Membership Plan")).toBeInTheDocument();

    // Group 3: Support
    expect(screen.getByText("Support")).toBeInTheDocument();
    expect(screen.getByText("Send Feedback & Help")).toBeInTheDocument();

    // Bottom
    expect(screen.getByText("LOG OUT")).toBeInTheDocument();
  });

  it("opens modal when clicking a settings item", () => {
    render(<ProfileSettingsView profile={mockProfileData} />);

    const item = screen.getByText("Body Metrics");
    fireEvent.click(item);

    expect(screen.getByText("Current Weight (kg)")).toBeInTheDocument();
  });

  it("opens Training Goals modal when clicking Training Goals item", () => {
    render(<ProfileSettingsView profile={mockProfileData} />);

    const item = screen.getByText("Training Goals");
    fireEvent.click(item);

    expect(screen.getByText("Experience Level")).toBeInTheDocument();
    expect(screen.getByText("Primary Goals (Select at least 1)")).toBeInTheDocument();
  });

  it("opens Support Feedback modal when clicking Send Feedback & Help", () => {
    render(<ProfileSettingsView profile={mockProfileData} />);

    const item = screen.getByText("Send Feedback & Help");
    fireEvent.click(item);

    expect(screen.getByText("Send Feedback")).toBeInTheDocument();
  });

  it("handles logout button trigger", async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    render(<ProfileSettingsView profile={mockProfileData} />);

    const logoutBtn = screen.getByText("LOG OUT");
    fireEvent.click(logoutBtn);

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });

    global.fetch = originalFetch;
  });
});
