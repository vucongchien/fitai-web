import type { LucideIcon } from "lucide-react";

export type WeekState = "complete" | "active" | "planned";

export interface WeekSummary {
  number: number;
  label: string;
  state: WeekState;
}

export type SessionStatus = "complete" | "next" | "planned" | "rest" | "skipped";

export interface SessionSummary {
  id: string;
  day: string;
  date: string;
  title: string;
  time: string;
  duration: number;
  targetRpe: number;
  muscles: string[];
  status: SessionStatus;
}

export interface ContextItem {
  id: string;
  Icon: LucideIcon;
  title: string;
  description: string;
}

export interface RoadmapPageData {
  activeWeek: number;
  weeks: WeekSummary[];
  currentWeekSessions: SessionSummary[];
  currentWeekLabel: string;
  currentWeekDateRange: string;
  contextItems: ContextItem[];
  error?: {
    type: "CONNECTION_ERROR" | "NO_ROADMAP";
    message: string;
  };
}

/** One week of the full four-week schedule. */
export interface ScheduleWeek {
  dateRange: string;
  label: string;
  number: number;
  sessions: SessionSummary[];
  state: WeekState;
}

export interface SchedulePageData {
  activeWeek: number;
  weeks: ScheduleWeek[];
}

// ---------------------------------------------------------------------------
// Session Plan types
// ---------------------------------------------------------------------------

export interface PrescribedExercise {
  exerciseId: string;
  name: string;
  prescription: string;
  rest: string;
  notes: string;
}

export interface ReadinessNote {
  variant: "safe" | "warning";
  title: string;
  description: string;
}

export interface FeatureNote {
  id: string;
  icon: "camera" | "zap" | "info";
  title: string;
  description: string;
}

export interface SessionPlanPageData {
  sessionPlanId: string;
  title: string;
  day: string;
  date: string;
  duration: number;
  targetRpe: number;
  sessionDescription: string;
  exercises: PrescribedExercise[];
  readinessNote: ReadinessNote;
  featureNotes: FeatureNote[];
  preSessionChecks: string[];
  startWorkoutHref: string;
}
