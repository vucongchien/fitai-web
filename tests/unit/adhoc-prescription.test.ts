import { describe, expect, it } from "vitest";

import { type AdhocExercise, toAdhocPrescription } from "@/features/workout/model/adhoc-types";

const item = (over: Partial<AdhocExercise>): AdhocExercise => ({
  id: "ex__1",
  exerciseId: "ex",
  name: "Exercise",
  prescription: "",
  rest: "90 sec",
  note: "",
  sets: 3,
  reps: 10,
  ...over,
});

describe("toAdhocPrescription", () => {
  it("keeps each part and the coach's numbers instead of sending bare ids", () => {
    const p = toAdhocPrescription([
      item({
        exerciseId: "warm",
        phase: "warmup",
        sets: 1,
        reps: 0,
        durationSeconds: 60,
        restSetSec: 30,
      }),
      item({ exerciseId: "squat", phase: "main", sets: 4, reps: 10, weightKg: 12.5 }),
      item({ exerciseId: "picked" }),
      item({ exerciseId: "cool", phase: "cooldown", sets: 1, reps: 8, durationSeconds: 60 }),
    ]);

    expect(p.warmUps).toEqual([
      {
        exerciseId: "warm",
        targetSets: 1,
        targetReps: 0,
        targetWeight: 0,
        durationSeconds: 60,
        restSetSec: 30,
      },
    ]);
    expect(p.mainExercises.map((l) => l.exerciseId)).toEqual(["squat", "picked"]);
    expect(p.mainExercises[0]).toMatchObject({
      targetSets: 4,
      targetReps: 10,
      targetWeight: 12.5,
      restSetSec: 90,
    });
    // A hold is sent as a duration, not as the reps the builder defaulted it to.
    expect(p.coolDowns[0]).toMatchObject({ targetReps: 0, durationSeconds: 60 });
  });
});
