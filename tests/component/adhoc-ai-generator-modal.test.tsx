import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

    const textarea = screen.getByPlaceholderText(/Ask AI Coach/i);
    fireEvent.change(textarea, { target: { value: "Chest and triceps with dumbbells" } });
    expect(textarea).toHaveValue("Chest and triceps with dumbbells");

    fireEvent.click(screen.getByRole("button", { name: /45 min/i }));
    fireEvent.click(screen.getByRole("option", { name: /30 min/i }));
    expect(screen.getByRole("button", { name: /30 min/i })).toBeInTheDocument();
  });

  it("generates workout and allows applying to workout builder", async () => {
    mockGetAiRecommendation.mockResolvedValue({
      muscleGroups: ["Chest", "Triceps"],
      reasoning: "Focus tension on chest and triceps.",
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

    const generateBtn = screen.getByRole("button", { name: /Send prompt/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Focus tension on chest and triceps/i)).toBeInTheDocument();
      expect(screen.getByText("Incline Dumbbell Press")).toBeInTheDocument();
    });

    const replaceBtn = screen.getByRole("button", { name: /Replace \(1\)/i });
    fireEvent.click(replaceBtn);

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
