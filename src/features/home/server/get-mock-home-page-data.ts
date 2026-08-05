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

    evidenceItems: [
      {
        id: "training-volume",
        icon: "dumbbell",
        value: "8,460 kg",
        label: "Training volume this week",
      },
      {
        id: "avg-rpe",
        icon: "shield-check",
        value: "6.4 RPE",
        label: "Controlled average effort",
      },
    ],

    nutritionSummary: {
      loggedKcal: 1420,
      targetKcal: 2050,
    },

    quickActions: [
      {
        id: "extra-workout",
        label: "Extra workout",
        href: "/workout/adhoc",
        icon: "dumbbell",
        colorVariant: "blue",
      },
      {
        id: "log-weight",
        label: "Log weight",
        href: "/progress/weight",
        icon: "scale",
        colorVariant: "green",
      },
      {
        id: "log-meal",
        label: "Log meal",
        href: "/nutrition/log",
        icon: "utensils",
        colorVariant: "coral",
      },
    ],
  };
}
