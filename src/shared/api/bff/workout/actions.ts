"use server";

import type { AdhocConfig, AiRecommendResult, ExerciseResult } from "./types";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

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

function mockSearchExercises(query: string): ExerciseResult[] {
  if (!query.trim()) return MOCK_EXERCISE_LIBRARY;
  const q = query.toLowerCase();
  return MOCK_EXERCISE_LIBRARY.filter(
    (ex) => ex.name.toLowerCase().includes(q) || ex.note.toLowerCase().includes(q),
  );
}

function getMockAdhocConfig(): AdhocConfig {
  return {
    targetRpe: 6.5,
    defaultExercises: MOCK_EXERCISE_LIBRARY.slice(0, 4),
  };
}

function getMockAiRecommendation(): AiRecommendResult {
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

// ---------------------------------------------------------------------------
// Real gRPC adapters (uncomment khi backend sẵn sàng)
// ---------------------------------------------------------------------------

// async function realSearchExercises(query: string): Promise<ExerciseResult[]> {
//   const [searchRes, metaRes] = await Promise.all([
//     createClient(ExerciseService, createServerTransport()).searchExercises({ keyword: query, limit: 20 }),
//     createClient(ExerciseService, createServerTransport()).getCatalogMetadata({}),
//   ]);
//   const equipmentMap = new Map(metaRes.equipments.map((e) => [e.id, e]));
//   return searchRes.exercises.map((ex) => {
//     const equipment = equipmentMap.get(ex.equipmentId);
//     const isWeighted = equipment ? equipment.name.toLowerCase() !== "bodyweight" : false;
//     return {
//       id: ex.id,
//       name: ex.name,
//       equipmentId: ex.equipmentId,
//       isWeighted,
//       defaultWeightKg: isWeighted ? 10 : undefined,
//       prescription: "3 × 10",
//       rest: `${ex.defaultRestSeconds} sec`,
//       note: ex.instructions,
//     };
//   });
// }

// async function realGetAdhocConfig(): Promise<AdhocConfig> {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("fitai_access_token")?.value;
//   const client = createClient(CoachingService, createServerTransport(token));
//   const res = await client.getActiveRoadmap({ userId: "TODO" });
//   const currentWeek = res.roadmap?.weekPlans.find((w) => /* active week */);
//   return {
//     targetRpe: currentWeek?.targetRpe ?? 6.5,
//     defaultExercises: [],
//   };
// }

// ---------------------------------------------------------------------------
// Public Server Actions
// ---------------------------------------------------------------------------

/**
 * Tìm kiếm exercise library.
 *
 * Server Action — gọi từ Client Component (ExerciseSearchSheet).
 * gRPC: ExerciseService.searchExercises({ keyword: query, limit: 20 })
 * Fields used: id, name, instructions (→ note), defaultRestSeconds (→ rest)
 */
export async function searchExercises(query: string): Promise<ExerciseResult[]> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) return mockSearchExercises(query);
  // TODO: return realSearchExercises(query);
  return mockSearchExercises(query);
}

/**
 * Lấy config và default exercises cho Adhoc Workout.
 *
 * Server Action — gọi 1 lần khi component mount.
 * gRPC: CoachingService.getActiveRoadmap → weekPlan.targetRpe
 */
export async function getAdhocConfig(): Promise<AdhocConfig> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) return getMockAdhocConfig();
  // TODO: return realGetAdhocConfig();
  return getMockAdhocConfig();
}

/**
 * AI-generated workout recommendation.
 *
 * Server Action — gọi khi user click "AI Recommend".
 * gRPC: Chưa có service thật — mock trả exercises phù hợp.
 */
export async function getAiRecommendation(): Promise<AiRecommendResult> {
  // TODO: gọi AI/coaching service khi có
  return getMockAiRecommendation();
}

/**
 * Tạo adhoc session plan rồi start ngay, trả về sessionId để navigate.
 *
 * Real flow:
 *   1. CoachingService.createAdhocSessionPlan({ exercise_ids }) → session_plan_id
 *   2. WorkoutExecutionService.startWorkoutSession({ session_plan_id }) → session_id
 */
export async function beginWorkoutSession(_exerciseIds: string[]): Promise<{ sessionId: string }> {
  const hasBackend = Boolean(process.env.FITAI_RPC_URL);
  if (!hasBackend) {
    return { sessionId: `adhoc_${Date.now()}` };
  }
  // TODO: implement real flow
  // const cookieStore = await cookies();
  // const token = cookieStore.get("fitai_access_token")?.value;
  // const transport = createServerTransport(token);
  // const { sessionPlanId } = await createClient(CoachingService, transport)
  //   .createAdhocSessionPlan({ exerciseIds });
  // const { sessionId } = await createClient(WorkoutExecutionService, transport)
  //   .startWorkoutSession({ sessionPlanId });
  // return { sessionId };
  return { sessionId: `adhoc_${Date.now()}` };
}
