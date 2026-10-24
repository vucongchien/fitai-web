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

    expect(screen.getByText("Cài đặt")).toBeInTheDocument();
    expect(screen.getByText("HOÀN TẤT")).toBeInTheDocument();

    // Group 1: Tài khoản
    expect(screen.getByText("Tài khoản")).toBeInTheDocument();
    expect(screen.getByText("Cài đặt riêng")).toBeInTheDocument();
    expect(screen.getByText("Hồ sơ")).toBeInTheDocument();
    expect(screen.getByText("Thông báo")).toBeInTheDocument();
    expect(screen.getByText("Khoá học")).toBeInTheDocument();
    expect(screen.getByText("Điểm trên LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("Duolingo for Schools")).toBeInTheDocument();
    expect(screen.getByText("Tài khoản mạng xã hội")).toBeInTheDocument();
    expect(screen.getByText("Cài đặt quyền riêng tư")).toBeInTheDocument();

    // Group 2: Gói đăng ký
    expect(screen.getByText("Gói đăng ký")).toBeInTheDocument();
    expect(screen.getByText("Chọn gói đăng ký")).toBeInTheDocument();

    // Group 3: Hỗ trợ
    expect(screen.getByText("Hỗ trợ")).toBeInTheDocument();
    expect(screen.getByText("Trung tâm trợ giúp")).toBeInTheDocument();

    // Bottom
    expect(screen.getByText("ĐĂNG XUẤT")).toBeInTheDocument();
  });

  it("opens modal when clicking a settings item", () => {
    render(<ProfileSettingsView profile={mockProfileData} />);

    const item = screen.getByText("Cài đặt riêng");
    fireEvent.click(item);

    expect(screen.getByText("Current Weight (kg)")).toBeInTheDocument();
  });

  it("opens Training Goals modal when clicking Duolingo for Schools item", () => {
    render(<ProfileSettingsView profile={mockProfileData} />);

    const item = screen.getByText("Duolingo for Schools");
    fireEvent.click(item);

    expect(screen.getByText("Experience Level")).toBeInTheDocument();
    expect(screen.getByText("Primary Goals (Select at least 1)")).toBeInTheDocument();
  });

  it("opens Support Feedback modal when clicking Trung tâm trợ giúp", () => {
    render(<ProfileSettingsView profile={mockProfileData} />);

    const item = screen.getByText("Trung tâm trợ giúp");
    fireEvent.click(item);

    expect(screen.getByText("Send Feedback")).toBeInTheDocument();
  });

  it("handles logout button trigger", async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    render(<ProfileSettingsView profile={mockProfileData} />);

    const logoutBtn = screen.getByText("ĐĂNG XUẤT");
    fireEvent.click(logoutBtn);

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });

    global.fetch = originalFetch;
  });
});
