import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ExerciseMetaRow } from "@/features/workout/ui/live/exercise-meta-row";

afterEach(cleanup);

describe("ExerciseMetaRow", () => {
  it("shows the exercise name and its target on the left", () => {
    render(<ExerciseMetaRow currentSet={1} name="Plank Hold" target="30 sec" totalSets={3} />);

    expect(screen.getByText("Plank Hold")).toBeInTheDocument();
    expect(screen.getByText("30 sec")).toBeInTheDocument();
  });

  it("shows the set counter on the right in 'n / total Sets' form", () => {
    render(<ExerciseMetaRow currentSet={1} name="Plank Hold" target="30 sec" totalSets={3} />);

    expect(screen.getByText("1 / 3 Sets")).toBeInTheDocument();
  });

  it("uses the singular label for a one-set prescription", () => {
    render(<ExerciseMetaRow currentSet={1} name="Plank Hold" target="30 sec" totalSets={1} />);

    expect(screen.getByText("1 / 1 Set")).toBeInTheDocument();
  });
});
