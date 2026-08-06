import type { LucideIcon } from "lucide-react";

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
  Icon: LucideIcon;
  title: string;
  description: string;
};

export type RoadmapPageData = {
  activeWeek: number;
  weeks: WeekSummary[];
  currentWeekSessions: SessionSummary[];
  currentWeekLabel: string;
  currentWeekDateRange: string;
  contextItems: ContextItem[];
};

/** One week of the full four-week schedule. */
export type ScheduleWeek = {
  dateRange: string;
  label: string;
  number: number;
  sessions: SessionSummary[];
  state: WeekState;
};

export type SchedulePageData = {
  activeWeek: number;
  weeks: ScheduleWeek[];
};

// ---------------------------------------------------------------------------
// Session Plan types
// ---------------------------------------------------------------------------

export type PrescribedExercise = {
  exerciseId: string;
  name: string;
  prescription: string;
  rest: string;
  notes: string;
};

export type ReadinessNote = {
  variant: "safe" | "warning";
  title: string;
  description: string;
};

export type FeatureNote = {
  id: string;
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
  sessionDescription: string;
  exercises: PrescribedExercise[];
  readinessNote: ReadinessNote;
  featureNotes: FeatureNote[];
  preSessionChecks: string[];
  startWorkoutHref: string;
};
