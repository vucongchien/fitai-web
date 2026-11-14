import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRefresh, mockShowToast, mockLogBodyMetrics } = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockShowToast: vi.fn(),
  mockLogBodyMetrics: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));
vi.mock("@/shared/ui/toast/toast-context", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));
vi.mock("@/features/profile/server/profile-actions", () => ({
  logBodyMetricsServerAction: mockLogBodyMetrics,
}));

import { LogMetricsModal } from "@/features/progress/ui/log-metrics-modal";

describe("LogMetricsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates weight and body fat before calling server action", async () => {
    render(
      <LogMetricsModal
        isOpen
        onClose={vi.fn()}
        defaultWeightKg={72}
        defaultBodyFatPercent={18}
        defaultHeightCm={175}
      />,
    );

    const weightInput = screen.getByLabelText(/Weight \(kg\)/i);
    fireEvent.change(weightInput, { target: { value: "10" } });
    fireEvent.submit(weightInput.closest("form")!);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please enter a valid weight between 20 and 350 kg.",
    );
    expect(mockLogBodyMetrics).not.toHaveBeenCalled();
  });

  it("submits valid metrics, shows success toast, closes, and refreshes", async () => {
    const onClose = vi.fn();
    mockLogBodyMetrics.mockResolvedValue({ success: true, logId: "log-1" });

    render(
      <LogMetricsModal
        isOpen
        onClose={onClose}
        defaultWeightKg={72}
        defaultBodyFatPercent={18}
        defaultHeightCm={175}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Weight \(kg\)/i), { target: { value: "71.4" } });
    fireEvent.change(screen.getByLabelText(/Progress Photo URL/i), {
      target: { value: "https://images.unsplash.com/photo-99" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Check-in" }));

    await waitFor(() => {
      expect(mockLogBodyMetrics).toHaveBeenCalledWith({
        weightKg: 71.4,
        bodyFatPercent: 18,
        heightCm: 175,
        progressPhotoUrl: "https://images.unsplash.com/photo-99",
      });
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      message: "Body check-in logged!",
      type: "success",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("syncs updated default values when reopened and closes on Escape", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <LogMetricsModal
        isOpen={false}
        onClose={onClose}
        defaultWeightKg={72}
        defaultBodyFatPercent={18}
        defaultHeightCm={175}
      />,
    );

    rerender(
      <LogMetricsModal
        isOpen
        onClose={onClose}
        defaultWeightKg={70.5}
        defaultBodyFatPercent={17.2}
        defaultHeightCm={175}
      />,
    );

    expect(screen.getByLabelText(/Weight \(kg\)/i)).toHaveValue(70.5);
    expect(screen.getByLabelText(/Body Fat \(%\)/i)).toHaveValue(17.2);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
