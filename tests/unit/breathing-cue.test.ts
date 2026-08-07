

import { MOCK_EXERCISES } from "@/shared/mock/exercises";

describe("mock exercise catalogue", () => {
  it("gives every exercise a breathing cue so the coaching panel is never half-empty", () => {
    const missing = MOCK_EXERCISES.filter((exercise) => !exercise.breathingCue?.trim());

    expect(missing.map((exercise) => exercise.id)).toStrictEqual([]);
  });

  it("keeps breathing cues to a single short sentence for mobile readability", () => {
    for (const exercise of MOCK_EXERCISES) {
      expect(exercise.breathingCue!.length).toBeLessThanOrEqual(90);
    }
  });
});
