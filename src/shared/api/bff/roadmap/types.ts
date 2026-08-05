/**
 * BFF Roadmap layer types.
 *
 * Tổng hợp từ:
 *   - CoachingService.getActiveRoadmap → RoadmapPageData
 *   - CoachingService.getSessionPlan + ProfileService.getInjuryHistory → SessionPlanPageData
 */

export type WeekState = "complete" | "active" | "planned";

export type WeekSummary = {
  number: number;
  label: string;
  state: WeekState;
};

export type SessionStatus = "complete" | "next" | "planned" | "rest" | "skipped";

export type SessionSummary = {
  id: string;
  day: string;
  date: string;
  title: string;
  time: string;
  duration: number;
  targetRpe: number;
  muscles: string[];
  status: SessionStatus;
};

export type ContextItem = {
  id: string;
  /** lucide icon name */
  icon: "calendar-range" | "gauge" | "sparkles";
  title: string;
  description: string;
};

export type RoadmapPageData = {
  activeWeek: number;
  weeks: WeekSummary[];
  /** Sessions của week đang active */
  currentWeekSessions: SessionSummary[];
  currentWeekLabel: string;
  currentWeekDateRange: string;
  contextItems: ContextItem[];
};

// ---------------------------------------------------------------------------
// Session Plan types
// ---------------------------------------------------------------------------

export type PrescribedExercise = {
  exerciseId: string;
  name: string;
  /** Hiển thị: "3 × 10" */
  prescription: string;
  /** Hiển thị: "60 sec" */
  rest: string;
  notes: string;
};

export type ReadinessNote = {
  /** "safe" | "warning" */
  variant: "safe" | "warning";
  title: string;
  description: string;
};

export type FeatureNote = {
  id: string;
  /** lucide icon name */
  icon: "camera" | "zap" | "info";
  title: string;
  description: string;
};

export type SessionPlanPageData = {
  sessionPlanId: string;
  title: string;
  day: string;
  date: string;
  duration: number;
  targetRpe: number;
  /** Từ sessionPlan.reasoning */
  sessionDescription: string;
  exercises: PrescribedExercise[];
  readinessNote: ReadinessNote;
  featureNotes: FeatureNote[];
  /** Static checklist — BFF quyết định */
  preSessionChecks: string[];
  /** URL để bắt đầu session: `/workouts/live/{sessionPlanId}` */
  startWorkoutHref: string;
};
