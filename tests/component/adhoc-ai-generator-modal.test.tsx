import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdhocAiGeneratorModal } from "@/features/workout/ui/adhoc-ai-generator-modal";

const mockGetAiRecommendation = vi.fn();

vi.mock("@/features/workout/server/workout-actions", () => ({
  getAiRecommendation: (...args: any[]) => mockGetAiRecommendation(...args),
}));

describe("AdhocAiGeneratorModal", () => {
  it("does not render when isOpen is false", () => {
    render(
      <AdhocAiGeneratorModal
        isOpen={false}
        onClose={vi.fn()}
        onApplyExercises={vi.fn()}
        currentExerciseCount={0}
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders when isOpen is true and allows typing prompt string and selecting duration", async () => {
    const onClose = vi.fn();
    const onApply = vi.fn();

    render(
      <AdhocAiGeneratorModal
        isOpen={true}
        onClose={onClose}
        onApplyExercises={onApply}
        currentExerciseCount={2}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Generate Adhoc Workout")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Hôm nay tôi muốn tập/i);
    fireEvent.change(textarea, { target: { value: "Tập ngực và tay sau với tạ đơn" } });
    expect(textarea).toHaveValue("Tập ngực và tay sau với tạ đơn");

    // Chọn duration 30m
    const duration30 = screen.getByRole("button", { name: "30m" });
    fireEvent.click(duration30);
    expect(duration30).toHaveClass("is-active");
  });

  it("generates workout and allows applying to workout builder", async () => {
    mockGetAiRecommendation.mockResolvedValue({
      muscleGroups: ["Chest", "Triceps"],
      reasoning: "Tập trung áp lực vào cơ ngực và tay sau.",
      estimatedRpe: 7.5,
      exercises: [
        {
          exerciseId: "ex-incline-db",
          exerciseName: "Incline Dumbbell Press",
          targetSets: 4,
          targetReps: 10,
          targetWeight: 20,
          durationSeconds: 0,
          notes: "Focus upper chest",
          restSetSec: 90,
          restExerciseSec: 120,
        },
      ],
      warmUps: [],
      coolDowns: [],
    });

    const onApply = vi.fn();
    const onClose = vi.fn();

    render(
      <AdhocAiGeneratorModal
        isOpen={true}
        onClose={onClose}
        onApplyExercises={onApply}
        currentExerciseCount={2}
      />,
    );

    const generateBtn = screen.getByRole("button", { name: /Tạo giáo án thông minh/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Tập trung áp lực vào cơ ngực và tay sau/i)).toBeInTheDocument();
      expect(screen.getByText("Incline Dumbbell Press")).toBeInTheDocument();
    });

    // Bấm Áp dụng toàn bộ
    const applyAllBtn = screen.getByRole("button", { name: /Áp dụng toàn bộ/i });
    fireEvent.click(applyAllBtn);

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Incline Dumbbell Press",
          sets: 4,
          reps: 10,
          weightKg: 20,
        }),
      ]),
      "replace",
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
