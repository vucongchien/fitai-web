"use server";

import type { AdhocConfig, AiRecommendResult, ExerciseResult } from "./types";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_EXERCISE_LIBRARY: ExerciseResult[] = [
  {
    id: "incline-push-up",
    name: "Incline push-up",
    prescription: "3 × 10",
    rest: "60 sec",
    note: "Keep ribs stacked and move as one unit.",
  },
  {
    id: "supported-row",
    name: "Supported dumbbell row",
    prescription: "3 × 10 / side",
    rest: "75 sec",
    note: "Pause briefly when the elbow reaches your side.",
  },
  {
    id: "half-kneeling-press",
    name: "Half-kneeling press",
    prescription: "3 × 8 / side",
    rest: "75 sec",
    note: "Use a weight that keeps the last two reps controlled.",
  },
  {
    id: "dead-bug",
    name: "Dead bug",
    prescription: "3 × 6 / side",
    rest: "45 sec",
    note: "Stop the range before your lower back lifts.",
  },
  {
    id: "goblet-squat",
    name: "Goblet squat",
    prescription: "3 × 12",
    rest: "60 sec",
    note: "Chest tall, drive knees out.",
  },
  {
    id: "hip-hinge",
    name: "Romanian deadlift",
    prescription: "3 × 10",
    rest: "90 sec",
    note: "Feel hamstring tension before reversing.",
  },
  {
    id: "plank",
    name: "Plank hold",
    prescription: "3 × 30 sec",
    rest: "45 sec",
    note: "Neutral spine, breathe through the hold.",
  },
  {
    id: "glute-bridge",
    name: "Glute bridge",
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
//   const client = createClient(ExerciseService, createServerTransport());
//   const res = await client.searchExercises({ keyword: query, limit: 20 });
//   return res.exercises.map((ex) => ({
//     id: ex.id,
//     name: ex.name,
//     prescription: "3 × 10",                          // BFF quyết định default
//     rest: `${ex.defaultRestSeconds} sec`,
//     note: ex.instructions,
//   }));
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
