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

export type TodayItemCategory = "meal" | "snack" | "workout";

export type TodayTimelineItem = {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  category: TodayItemCategory;
  status: SessionStatus;
  href?: string;
};

export const activeRoadmap = {
  id: "roadmap-august",
  week: 2,
  totalWeeks: 4,
  phase: "Build capacity",
  progressLabel: "3 of 5 goals complete today",
};

export const todayTimelineItems: TodayTimelineItem[] = [
  {
    id: "breakfast",
    time: "07:30",
    title: "Breakfast",
    subtitle: "Lean beef pho & Green tea",
    category: "meal",
    status: "complete",
    href: "/nutrition/breakfast",
  },
  {
    id: "snack-morning",
    time: "10:00",
    title: "Morning snack",
    subtitle: "Apple & Almonds",
    category: "snack",
    status: "complete",
    href: "/nutrition/snack-morning",
  },
  {
    id: "lunch",
    time: "12:30",
    title: "Lunch",
    subtitle: "Chicken breast & Vegetable soup",
    category: "meal",
    status: "next",
    href: "/nutrition/lunch",
  },
  {
    id: "upper-workout",
    time: "17:30",
    title: "Upper-body workout",
    subtitle: "42 min · Target RPE 7",
    category: "workout",
    status: "planned",
    href: "/roadmap/upper-control",
  },
  {
    id: "dinner",
    time: "19:30",
    title: "Dinner",
    subtitle: "Salmon soup & Cucumber salad",
    category: "meal",
    status: "planned",
    href: "/nutrition/dinner",
  },
];



export const sessions: SessionSummary[] = [
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
];

export const nextSession = sessions.find((session) => session.status === "next") ?? sessions[0];

export const exercises = [
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
];

export const progressMetrics = [
  { label: "Training volume", value: "8,460 kg", change: "+8%", tone: "blue" },
  { label: "Average effort", value: "6.4 RPE", change: "steady", tone: "coral" },
  { label: "Sessions completed", value: "4 / 8", change: "on plan", tone: "green" },
] as const;

export const bodyTrend = [72.4, 72.1, 72.3, 71.8, 71.7, 71.5, 71.4];
