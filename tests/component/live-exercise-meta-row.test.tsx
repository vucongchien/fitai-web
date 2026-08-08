import { afterEach, describe, expect, it } from 'vitest';
import { afterEach, describe, expect, it } from '@jest/globals';
import { cleanup, render, screen } from "@testing-library/react";

import { ExerciseMetaRow } from "@/features/workout/ui/live/exercise-meta-row";

afterEach(cleanup);

describe(ExerciseMetaRow, () => {
  it("shows the exercise name and its target on the left", () => {
    render(<ExerciseMetaRow currentSet={1} name="Plank Hold" target="30 sec" totalSets={3} />);

    expect(screen.getByText("Plank Hold")).toBeInTheDocument();
    expect(screen.getByText("30 sec")).toBeInTheDocument();
  });

  // The current set and the total live in separate spans so they can carry
  // Different weight, so these read the counter element as a whole.
  it("shows the set counter on the right in 'n / total Sets' form", () => {
    const { container } = render(
      <ExerciseMetaRow currentSet={1} name="Plank Hold" target="30 sec" totalSets={3} />,
    );

    expect(container.querySelector(".live-meta__sets")?.textContent).toBe("1 / 3 Sets");
  });

  it("uses the singular label for a one-set prescription", () => {
    const { container } = render(
      <ExerciseMetaRow currentSet={1} name="Plank Hold" target="30 sec" totalSets={1} />,
    );

    expect(container.querySelector(".live-meta__sets")?.textContent).toBe("1 / 1 Set");
  });
});
