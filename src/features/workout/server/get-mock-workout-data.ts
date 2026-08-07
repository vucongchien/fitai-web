import type {
  AdhocConfig,
  AiRecommendResult,
  ExerciseResult,
} from "@/features/workout/model/workout.types";

const MOCK_EXERCISE_LIBRARY: ExerciseResult[] = [
  {
    id: "incline-push-up",
    name: "Incline push-up",
    equipmentId: "bodyweight",
    isWeighted: false,
    prescription: "3 × 10",
    rest: "60 sec",
    note: "Keep ribs stacked and move as one unit.",
  },
  {
    id: "supported-row",
    name: "Supported dumbbell row",
    equipmentId: "dumbbell",
    isWeighted: true,
    defaultWeightKg: 14,
    prescription: "3 × 10 / side",
    rest: "75 sec",
    note: "Pause briefly when the elbow reaches your side.",
  },
  {
    id: "half-kneeling-press",
    name: "Half-kneeling press",
    equipmentId: "dumbbell",
    isWeighted: true,
    defaultWeightKg: 12,
    prescription: "3 × 8 / side",
    rest: "75 sec",
    note: "Use a weight that keeps the last two reps controlled.",
  },
  {
    id: "dead-bug",
    name: "Dead bug",
    equipmentId: "bodyweight",
    isWeighted: false,
    prescription: "3 × 6 / side",
    rest: "45 sec",
    note: "Stop the range before your lower back lifts.",
  },
  {
    id: "goblet-squat",
    name: "Goblet squat",
    equipmentId: "dumbbell",
    isWeighted: true,
    defaultWeightKg: 16,
    prescription: "3 × 12",
    rest: "60 sec",
    note: "Chest tall, drive knees out.",
  },
  {
    id: "hip-hinge",
    name: "Romanian deadlift",
    equipmentId: "barbell",
    isWeighted: true,
    defaultWeightKg: 40,
    prescription: "3 × 10",
    rest: "90 sec",
    note: "Feel hamstring tension before reversing.",
  },
  {
    id: "plank",
    name: "Plank hold",
    equipmentId: "bodyweight",
    isWeighted: false,
    prescription: "3 × 30 sec",
    rest: "45 sec",
    note: "Neutral spine, breathe through the hold.",
  },
  {
    id: "glute-bridge",
    name: "Glute bridge",
    equipmentId: "bodyweight",
    isWeighted: false,
    prescription: "3 × 15",
    rest: "45 sec",
    note: "Drive hips high, squeeze at the top.",
  },
];

export function mockSearchExercises(query: string): ExerciseResult[] {
  if (!query.trim()) {
    return MOCK_EXERCISE_LIBRARY;
  }
  const q = query.toLowerCase();
  return MOCK_EXERCISE_LIBRARY.filter(
    (ex) => ex.name.toLowerCase().includes(q) || ex.note.toLowerCase().includes(q),
  );
}

export function getMockAdhocConfig(): AdhocConfig {
  return {
    targetRpe: 6.5,
    defaultExercises: MOCK_EXERCISE_LIBRARY.slice(0, 4),
  };
}

export function getMockAiRecommendation(): AiRecommendResult {
  return {
    exercises: [
      {
        id: `ai-push-up-${Date.now()}`,
        name: "Incline push-up",
        prescription: "3 × 12",
        rest: "60 sec",
        note: "Controlled tempo on downward phase.",
        sets: 3,
        reps: 12,
      },
      {
        id: `ai-row-${Date.now()}`,
        name: "Supported dumbbell row",
        prescription: "3 × 10",
        rest: "75 sec",
        note: "Pause 1s at top extension.",
        sets: 3,
        reps: 10,
        weightKg: 14,
      },
      {
        id: `ai-press-${Date.now()}`,
        name: "Half-kneeling press",
        prescription: "3 × 8",
        rest: "75 sec",
        note: "Focus on shoulder blade stability.",
        sets: 3,
        reps: 8,
        weightKg: 16,
      },
      {
        id: `ai-deadbug-${Date.now()}`,
        name: "Dead bug",
        prescription: "3 × 8",
        rest: "45 sec",
        note: "Keep lower back flat against floor.",
        sets: 3,
        reps: 8,
      },
    ],
  };
}
