import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BodyMetricEntry } from "@/features/progress/model/types";
import { LogMetricsModal } from "@/features/progress/ui/log-metrics-modal";
import { PhotoComparisonSlider } from "@/features/progress/ui/photo-comparison-slider";

const mockRefresh = vi.fn();
const mockShowToast = vi.fn();
const mockLogBodyMetrics = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("@/shared/ui/toast/toast-context", () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

vi.mock("@/features/profile/server/profile-actions", () => ({
  logBodyMetricsServerAction: (...args: unknown[]) => mockLogBodyMetrics(...args),
}));

function makePhotoEntry(overrides: Partial<BodyMetricEntry>): BodyMetricEntry {
  return {
    id: "entry-1",
    loggedAt: "2026-11-01T08:00:00Z",
    dateLabel: "Nov 1",
    weightKg: 72,
    bodyFatPercent: 18,
    heightCm: 175,
    bmi: 23.5,
    leanMassKg: 59,
    fatMassKg: 13,
    progressPhotoUrl: "https://example.com/photo-1.jpg",
    ...overrides,
  };
}

describe("LogMetricsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    render(
      <LogMetricsModal
        isOpen={false}
        onClose={vi.fn()}
        defaultWeightKg={72}
        defaultBodyFatPercent={18}
        defaultHeightCm={175}
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape key without focusing an input and resets error/input state on reopen", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <LogMetricsModal
        isOpen={true}
        onClose={onClose}
        defaultWeightKg={72}
        defaultBodyFatPercent={18}
        defaultHeightCm={175}
      />,
    );

    const weightInput = screen.getByLabelText(/Weight \(kg\)/i);
    expect(weightInput).toHaveValue(72);

    fireEvent.change(weightInput, { target: { value: "5" } });
    fireEvent.submit(screen.getByRole("button", { name: /Save Check-in/i }).closest("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent("between 20 and 350 kg");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
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
        isOpen={true}
        onClose={onClose}
        defaultWeightKg={74}
        defaultBodyFatPercent={17}
        defaultHeightCm={175}
      />,
    );

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByLabelText(/Weight \(kg\)/i)).toHaveValue(74);
  });

  it("blocks Escape dismissal while submitting and refreshes on success", async () => {
    let resolveSubmit!: (value: { success: boolean }) => void;
    mockLogBodyMetrics.mockImplementation(
      () =>
        new Promise<{ success: boolean }>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const onClose = vi.fn();

    render(
      <LogMetricsModal
        isOpen={true}
        onClose={onClose}
        defaultWeightKg={72}
        defaultBodyFatPercent={18}
        defaultHeightCm={175}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Save Check-in/i }));
    expect(screen.getByRole("button", { name: /Saving\.\.\./i })).toBeDisabled();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    resolveSubmit({ success: true });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(mockShowToast).toHaveBeenCalledWith({
      message: "Body check-in logged!",
      type: "success",
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("PhotoComparisonSlider", () => {
  it("renders empty state when photos is empty", () => {
    render(<PhotoComparisonSlider photos={[]} onOpenLogModal={vi.fn()} />);

    expect(screen.getByText("No progress photos yet")).toBeInTheDocument();
  });

  it("advances afterIndex to the latest photo when photos.length grows", () => {
    const photo1 = makePhotoEntry({
      id: "p1",
      dateLabel: "Nov 1",
      weightKg: 75,
      progressPhotoUrl: "https://example.com/1.jpg",
    });
    const photo2 = makePhotoEntry({
      id: "p2",
      dateLabel: "Nov 8",
      weightKg: 73,
      progressPhotoUrl: "https://example.com/2.jpg",
    });
    const photo3 = makePhotoEntry({
      id: "p3",
      dateLabel: "Nov 15",
      weightKg: 71,
      progressPhotoUrl: "https://example.com/3.jpg",
    });

    const { rerender } = render(
      <PhotoComparisonSlider photos={[photo1, photo2]} onOpenLogModal={vi.fn()} />,
    );

    expect(screen.getByText(/Before · Nov 1/)).toBeInTheDocument();
    expect(screen.getByText(/After · Nov 8/)).toBeInTheDocument();

    rerender(<PhotoComparisonSlider photos={[photo1, photo2, photo3]} onOpenLogModal={vi.fn()} />);

    expect(screen.getByText(/Before · Nov 1/)).toBeInTheDocument();
    expect(screen.getByText(/After · Nov 15/)).toBeInTheDocument();
  });
});
