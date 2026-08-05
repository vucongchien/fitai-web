import { CalendarRange, Gauge, Sparkles } from "lucide-react";

import type {
  RoadmapPageData,
  SessionPlanPageData,
} from "@/features/roadmap/model/roadmap-page.types";

export function getMockRoadmapPageData(): RoadmapPageData {
  return {
    activeWeek: 2,

    weeks: [
      { number: 1, label: "Foundation", state: "complete" },
      { number: 2, label: "Build capacity", state: "active" },
      { number: 3, label: "Add control", state: "planned" },
      { number: 4, label: "Consolidate", state: "planned" },
    ],

    currentWeekSessions: [
      {
        id: "lower-foundation",
        day: "Mon",
        date: "Aug 3",
        title: "Lower-body foundation",
        time: "18:30",
        duration: 38,
        targetRpe: 6,
        muscles: ["Quads", "Glutes"],
        status: "complete",
      },
      {
        id: "recovery-walk",
        day: "Tue",
        date: "Aug 4",
        title: "Recovery day",
        time: "Flexible",
        duration: 20,
        targetRpe: 3,
        muscles: ["Mobility"],
        status: "rest",
      },
      {
        id: "upper-control",
        day: "Wed",
        date: "Aug 5",
        title: "Upper-body control",
        time: "18:30",
        duration: 42,
        targetRpe: 7,
        muscles: ["Chest", "Shoulders", "Core"],
        status: "next",
      },
      {
        id: "posterior-chain",
        day: "Fri",
        date: "Aug 7",
        title: "Posterior-chain strength",
        time: "18:00",
        duration: 45,
        targetRpe: 7,
        muscles: ["Hamstrings", "Back"],
        status: "planned",
      },
      {
        id: "full-body-rhythm",
        day: "Sun",
        date: "Aug 9",
        title: "Full-body rhythm",
        time: "09:00",
        duration: 40,
        targetRpe: 6,
        muscles: ["Full body"],
        status: "planned",
      },
    ],

    currentWeekLabel: "Week 2 schedule",
    currentWeekDateRange: "Aug 3–9",

    contextItems: [
      {
        id: "sessions-count",
        Icon: CalendarRange,
        title: "3 strength sessions",
        description: "Plus one guided recovery day",
      },
      {
        id: "effort-target",
        Icon: Gauge,
        title: "Target effort 6–7",
        description: "Enough challenge to progress with control",
      },
      {
        id: "why-changed",
        Icon: Sparkles,
        title: "Why this changed",
        description: "Wednesday moved later to match your updated availability.",
      },
    ],
  };
}

export function getMockSessionPlanData(sessionPlanId: string): SessionPlanPageData {
  const sessionMap: Record<
    string,
    Pick<SessionPlanPageData, "title" | "day" | "date" | "duration" | "targetRpe">
  > = {
    "lower-foundation": {
      title: "Lower-body foundation",
      day: "Mon",
      date: "Aug 3",
      duration: 38,
      targetRpe: 6,
    },
    "recovery-walk": {
      title: "Recovery day",
      day: "Tue",
      date: "Aug 4",
      duration: 20,
      targetRpe: 3,
    },
    "upper-control": {
      title: "Upper-body control",
      day: "Wed",
      date: "Aug 5",
      duration: 42,
      targetRpe: 7,
    },
    "posterior-chain": {
      title: "Posterior-chain strength",
      day: "Fri",
      date: "Aug 7",
      duration: 45,
      targetRpe: 7,
    },
    "full-body-rhythm": {
      title: "Full-body rhythm",
      day: "Sun",
      date: "Aug 9",
      duration: 40,
      targetRpe: 6,
    },
  };

  const session = sessionMap[sessionPlanId] ?? sessionMap["upper-control"]!;

  return {
    sessionPlanId,
    ...session,

    sessionDescription:
      "Build capacity and strength while keeping every rep steady enough to repeat next week.",

    exercises: [
      {
        exerciseId: "incline-push-up",
        name: "Incline push-up",
        prescription: "3 × 10",
        rest: "60 sec",
        notes: "Keep ribs stacked and move as one unit.",
      },
      {
        exerciseId: "supported-row",
        name: "Supported dumbbell row",
        prescription: "3 × 10 / side",
        rest: "75 sec",
        notes: "Pause briefly when the elbow reaches your side.",
      },
      {
        exerciseId: "half-kneeling-press",
        name: "Half-kneeling press",
        prescription: "3 × 8 / side",
        rest: "75 sec",
        notes: "Use a weight that keeps the last two reps controlled.",
      },
      {
        exerciseId: "dead-bug",
        name: "Dead bug",
        prescription: "3 × 6 / side",
        rest: "45 sec",
        notes: "Stop the range before your lower back lifts.",
      },
    ],

    readinessNote: {
      variant: "safe",
      title: "Ready to train",
      description: "No active injury constraints affect today’s exercise selection.",
    },

    featureNotes: [
      {
        id: "camera-coaching",
        icon: "camera",
        title: "Manual logging is on",
        description: "Camera coaching stays unavailable until its movement model is validated.",
      },
    ],

    preSessionChecks: [
      "Clear enough space to move.",
      "Keep water within reach.",
      "Stop if new or sharp pain appears.",
    ],

    startWorkoutHref: `/workouts/live/${sessionPlanId}`,
  };
}
