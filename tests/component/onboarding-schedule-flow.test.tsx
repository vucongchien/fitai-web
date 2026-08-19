import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { OnboardingFlow } from "@/features/onboarding/ui/onboarding-flow";
import * as onboardingActions from "@/features/onboarding/server/onboarding-actions";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock catalog server action
vi.mock("@/features/exercise/server/catalog-actions", () => ({
  getCatalogMetadataServerAction: vi.fn().mockResolvedValue({
    success: true,
    equipments: [
      { id: "eq-1", name: "Dumbbells" },
      { id: "eq-2", name: "Bodyweight" },
    ],
    muscles: [
      { id: "m-1", name: "Chest" },
      { id: "m-2", name: "Back" },
    ],
  }),
}));

// Mock window.scrollTo
window.scrollTo = vi.fn();

describe("OnboardingFlow Component & Schedule State Lifecycle", () => {
  let saveActionSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    saveActionSpy = vi.spyOn(onboardingActions, "saveOnboardingProfileServerAction").mockResolvedValue({
      success: true,
      message: "Success",
      aiCoachActivated: true,
    });
  });

  afterEach(() => {
    saveActionSpy.mockRestore();
  });

  it("retains user-selected multi-day schedule across multi-step wizard navigation and submits it", async () => {
    render(<OnboardingFlow />);

    const clickNext = () => {
      const continueBtns = screen.getAllByRole("button", { name: /continue/i });
      const footerContinue = continueBtns.find((b) => b.classList.contains("ui-button--primary")) || continueBtns[0];
      fireEvent.click(footerContinue);
    };

    // STEP 1: Primary Goals -> Bấm Continue
    expect(await screen.findByText(/what are your primary goals/i)).toBeInTheDocument();
    clickNext();

    // STEP 2: Baseline & Targets -> Bấm Continue
    expect(await screen.findByText(/set your baseline & targets/i)).toBeInTheDocument();
    clickNext();

    // STEP 3: Shape your week (Schedule Picker)
    expect(await screen.findByText(/shape your weekly schedule/i)).toBeInTheDocument();

    // Mặc định Mon, Wed, Fri đang bật. Bật thêm Thứ 3 (Tue) và Thứ 5 (Thu)
    const tueToggle = screen.getByLabelText("Toggle availability for Tue");
    fireEvent.click(tueToggle);

    const thuToggle = screen.getByLabelText("Toggle availability for Thu");
    fireEvent.click(thuToggle);

    // Bấm Continue sang Step 4 (Unmount Step 3)
    clickNext();

    // STEP 4: Training Setup
    expect(await screen.findByText(/build around what you have/i)).toBeInTheDocument();
    clickNext();

    // STEP 5: Safety Constraints
    expect(await screen.findByText(/is anything limiting movement now/i)).toBeInTheDocument();
    clickNext();

    // STEP 6: Review & Coach style
    expect(await screen.findByText(/choose your ai coach tone/i)).toBeInTheDocument();
    expect(screen.getByText(/5 days \/ week/i)).toBeInTheDocument();

    // Bấm "Generate my plan" để submit
    const submitBtn = screen.getByRole("button", { name: /generate my plan/i });
    fireEvent.click(submitBtn);

    // Chờ Server Action được gọi
    await waitFor(() => {
      expect(saveActionSpy).toHaveBeenCalledTimes(1);
    });

    // Kiểm tra payload gửi vào Server Action
    const submittedFormValues = saveActionSpy.mock.calls[0][0];
    const preferredTimes = submittedFormValues.preferredWorkoutTimes;

    // Phải chứa cả 5 ngày (mon, tue, wed, thu, fri)
    expect(preferredTimes).toBeDefined();
    expect(preferredTimes.mon).toBeDefined();
    expect(preferredTimes.tue).toBeDefined();
    expect(preferredTimes.wed).toBeDefined();
    expect(preferredTimes.thu).toBeDefined();
    expect(preferredTimes.fri).toBeDefined();
  });
});
