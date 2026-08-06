import type { HomePageData } from "@/features/home/model/home-page.types";

export function getMockHomePageData(): HomePageData {
  return {
    streak: { days: 4 },

    coachNote: "Intensity reduced today based on your recovery feedback.",

    todayTimeline: [
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
    ],

    // Training volume and sets already read on the metric grid, so evidence carries the
    // readings that appear nowhere else. Average RPE is available on session completion
    // (`CompleteWorkoutSessionResponse.average_rpe`) but not on `WorkoutSessionSummary`,
    // so it stays a single-session figure rather than a weekly trend.
    evidenceItems: [
      {
        id: "avg-rpe",
        icon: "shield-check",
        value: "6.4 RPE",
        label: "Average effort, last session",
      },
      {
        id: "avg-form",
        icon: "zap",
        value: "88%",
        label: "Average form score, last session",
      },
    ],

    nutritionSummary: {
      loggedKcal: 1420,
      targetKcal: 2050,
    },

    // Every action points at a route that exists. Logging a weight or a meal is a mutation
    // and has no screen yet, so those two lead to the places that read the same data
    // rather than to a dead URL.
    quickActions: [
      {
        id: "extra-workout",
        label: "Extra workout",
        href: "/workouts/adhoc",
        icon: "dumbbell",
        colorVariant: "blue",
      },
      {
        id: "four-week-plan",
        label: "Full schedule",
        href: "/schedule",
        icon: "dumbbell",
        colorVariant: "green",
      },
      {
        id: "todays-menu",
        label: "Today's menu",
        href: "/nutrition/lunch",
        icon: "utensils",
        colorVariant: "coral",
      },
    ],
  };
}
