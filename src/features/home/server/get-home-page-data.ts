import { createClient } from "@connectrpc/connect";
import "server-only";
import { redirect } from "next/navigation";

import { exerciseSearchRepository } from "@/features/exercise/api/search-repository";
import {
  EMPTY_FILTERS,
  toExerciseSummary,
  toFilterSearchString,
} from "@/features/exercise/domain/exercise";
import type { ExerciseSummary } from "@/features/exercise/domain/exercise";
import { getHomeGamificationData } from "@/features/gamification/server/get-gamification";
import type {
  EvidenceItem,
  FeaturedExerciseItem,
  HomePageData,
  MuscleGroupCategoryItem,
  QuickAction,
  TodayTimelineItem,
} from "@/features/home/model/home-page.types";
import {
  cleanMealDisplayName,
  normalizeTodayMenu,
} from "@/features/nutrition/model/meal-detail.mapper";
import type { ProfileViewModel } from "@/features/profile/model/profile.types";
import { getProfileData } from "@/features/profile/server/get-profile-data";
import { dayKeyFromLoggedAt, dayKeyRange, toDayKey } from "@/shared/api/bff/aggregate/day-key";
import { deduplicateMealRows, toMealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";
import {
  SessionKind,
  SessionPlanStatus,
} from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { NutritionService } from "@/shared/api/gen/contracts/core/nutrition/v1/service/nutrition_service_pb";
import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import {
  Equipment,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";
import { equipmentLabel, muscleGroupCodeLabel, muscleGroupLabel } from "@/shared/lib/taxonomy";
import { calculateConsecutiveStreakDays } from "@/shared/utils/streak";

// Home waits at most this long for today's menu: a cache miss makes the backend generate it
// with the LLM (30s+), and it keeps going after we give up, so the next load shows the meals.
const HOME_MENU_WAIT_MS = 1500;

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
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
];

// Home cards group MuscleGroup enum values; links filter search by primary muscle.
const MUSCLE_GROUP_CARDS: Array<{
  id: string;
  name: string;
  tagline: string;
  icon: string;
  muscles: MuscleGroup[];
}> = [
  {
    id: "arms-shoulders",
    name: "Arms & Shoulders",
    tagline: "BICEPS & DELTS",
    icon: "biceps",
    muscles: [MuscleGroup.BICEPS, MuscleGroup.TRICEPS, MuscleGroup.FOREARMS, MuscleGroup.SHOULDERS],
  },
  {
    id: "chest-back",
    name: "Chest & Back",
    tagline: "UPPER PUSH/PULL",
    icon: "target",
    muscles: [
      MuscleGroup.CHEST,
      MuscleGroup.LATS,
      MuscleGroup.MIDDLE_BACK,
      MuscleGroup.LOWER_BACK,
      MuscleGroup.TRAPS,
    ],
  },
  {
    id: "legs-glutes",
    name: "Legs & Glutes",
    tagline: "LOWER BODY",
    icon: "dumbbell",
    muscles: [
      MuscleGroup.QUADRICEPS,
      MuscleGroup.HAMSTRINGS,
      MuscleGroup.GLUTES,
      MuscleGroup.CALVES,
      MuscleGroup.ADDUCTORS,
      MuscleGroup.ABDUCTORS,
    ],
  },
  {
    id: "core-abs",
    name: "Core & Abs",
    tagline: "MIDSECTION",
    icon: "flame",
    muscles: [MuscleGroup.ABDOMINALS],
  },
];

const HOME_MUSCLE_GROUPS: MuscleGroupCategoryItem[] = MUSCLE_GROUP_CARDS.map((card) => {
  const query = toFilterSearchString({ ...EMPTY_FILTERS, muscles: card.muscles });
  return {
    id: card.id,
    name: card.name,
    labelVi: card.tagline,
    icon: card.icon,
    bgGradient: "var(--color-surface)",
    accentColor: "var(--color-border)",
    queryParam: query,
    href: `/search?${query}`,
  };
});

function toFeaturedExercise(ex: ExerciseSummary): FeaturedExerciseItem {
  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: muscleGroupLabel(ex.primaryMuscle).toUpperCase() || "FULL BODY",
    equipment: equipmentLabel(ex.equipment),
    durationMins: ex.defaultRestSeconds
      ? Math.max(5, Math.round((ex.defaultRestSeconds * 3) / 60))
      : 10,
    isWeighted: ex.equipment !== Equipment.BODY_ONLY,
    hasAiSupported: ex.hasAiSupported,
    imageUrl: ex.images[0] || undefined,
  };
}

function computeProfileCompletion(profileVm: ProfileViewModel): {
  rate: number;
  missingFields: string[];
} {
  let score = 0;
  const missing: string[] = [];

  if (profileVm.highlights.currentWeightKg > 0) {
    score += 20;
  } else {
    missing.push("Weight");
  }
  if (profileVm.healthMetrics.heightCm > 0) {
    score += 20;
  } else {
    missing.push("Height");
  }
  if (
    profileVm.user.dateOfBirth ||
    (profileVm.user.gender && profileVm.user.gender !== "Not set")
  ) {
    score += 20;
  } else {
    missing.push("Personal Details");
  }
  if (profileVm.healthMetrics.goals && profileVm.healthMetrics.goals.length > 0) {
    score += 20;
  } else {
    missing.push("Training Goals");
  }
  if (
    profileVm.user.experienceLevel ||
    (profileVm.settings.availableEquipment && profileVm.settings.availableEquipment.length > 0)
  ) {
    score += 20;
  } else {
    missing.push("Equipment & Setup");
  }

  return { rate: score, missingFields: missing };
}

export async function getHomePageData(): Promise<HomePageData> {
  const { accessToken, userId, userName } = await getAuthenticatedSession();
  if (!accessToken) {
    redirect("/login");
  }

  const profileVm = await getProfileData();
  const { rate: computedRate, missingFields: computedMissing } =
    computeProfileCompletion(profileVm);

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const coachingClient = createClient(CoachingService, transport);
      const nutritionClient = createClient(NutritionService, transport);
      const workoutClient = createClient(WorkoutExecutionService, transport);
      const profileClient = createClient(ProfileService, transport);
      const exerciseClient = createClient(ExerciseService, transport);

      const todayStr = toDayKey(new Date()) ?? new Date().toISOString().split("T")[0];

      const [
        roadmapRes,
        nutritionRes,
        menuRes,
        historyRes,
        profileRes,
        exerciseRes,
        nutHistoryRes,
        gamificationRes,
      ] = await Promise.allSettled([
        coachingClient.getActiveRoadmap({}),
        nutritionClient.getNutritionSummary({}),
        nutritionClient.getTodayMenu({}, { signal: AbortSignal.timeout(HOME_MENU_WAIT_MS) }),
        workoutClient.getWorkoutHistory({ limit: 20, offset: 0 }),
        profileClient.getProfile({ userId: userId || "" }),
        exerciseClient.searchExercises({ keyword: "", limit: 4 }),
        typeof nutritionClient.getNutritionHistory === "function"
          ? nutritionClient.getNutritionHistory({
              endDate: todayStr,
              startDate: dayKeyRange(todayStr, 7)[0] ?? todayStr,
            })
          : Promise.resolve({ meals: [] }),
        getHomeGamificationData(),
      ]);

      const roadmap = roadmapRes.status === "fulfilled" ? roadmapRes.value.roadmap : undefined;
      const nutrition = nutritionRes.status === "fulfilled" ? nutritionRes.value : undefined;
      const menu = menuRes.status === "fulfilled" ? menuRes.value : undefined;
      const history = historyRes.status === "fulfilled" ? historyRes.value.sessions : [];
      const profileProto = profileRes.status === "fulfilled" ? profileRes.value : undefined;

      const nutHistoryMeals =
        nutHistoryRes.status === "fulfilled" && nutHistoryRes.value?.meals
          ? nutHistoryRes.value.meals
          : [];
      const allMealRows = deduplicateMealRows(nutHistoryMeals);
      const todayLoggedMeals = allMealRows.filter((row) => {
        const key = dayKeyFromLoggedAt(row.loggedAt);
        if (!key) {
          return false;
        }
        return key === todayStr || dayKeyRange(todayStr, 1).includes(key);
      });

      const featuredExercises: FeaturedExerciseItem[] =
        exerciseRes.status === "fulfilled" && exerciseRes.value.exercises.length > 0
          ? exerciseRes.value.exercises
              .slice(0, 4)
              .map((ex) => toFeaturedExercise(toExerciseSummary(ex)))
          : (await exerciseSearchRepository.search(EMPTY_FILTERS, 4)).map(toFeaturedExercise);

      let completionRate = computedRate;
      let missingFields = computedMissing;

      if (
        profileProto &&
        typeof profileProto.completionRate === "number" &&
        profileProto.completionRate > 0
      ) {
        completionRate = Math.round(
          profileProto.completionRate <= 1
            ? profileProto.completionRate * 100
            : profileProto.completionRate,
        );
        missingFields = completionRate >= 100 ? [] : computedMissing;
      }

      const todayTimeline: TodayTimelineItem[] = [];
      let matchedDayPlan: any = undefined;
      let matchedWeekPlan: any = undefined;

      if (roadmap?.weekPlans?.length) {
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1;
        const curDay = now.getDate();

        // 1. Tìm chính xác DayPlan khớp ngày hôm nay
        for (const wp of roadmap.weekPlans) {
          for (const dp of wp.dayPlans || []) {
            if (
              dp.scheduledDate &&
              dp.scheduledDate.year === curYear &&
              dp.scheduledDate.month === curMonth &&
              dp.scheduledDate.day === curDay
            ) {
              matchedDayPlan = dp;
              matchedWeekPlan = wp;
              break;
            }
          }
          if (matchedDayPlan) {
            break;
          }
        }

        if (matchedDayPlan?.sessionPlans?.length) {
          for (const session of matchedDayPlan.sessionPlans) {
            const hasMuscles = session.targetMuscleGroups && session.targetMuscleGroups.length > 0;
            if (hasMuscles) {
              todayTimeline.push({
                id: session.sessionPlanId || `today-workout-${todayTimeline.length}`,
                time: session.slotTime || "17:30",
                title:
                  (session.kind === SessionKind.RECOVERY ? "Recovery · " : "") +
                  session.targetMuscleGroups!.map(muscleGroupCodeLabel).join(", "),
                subtitle:
                  session.reasoning ||
                  (matchedWeekPlan
                    ? `Target RPE ${matchedWeekPlan.targetRpe || 7.5}`
                    : "Planned Workout"),
                category: "workout",
                status: session.status === SessionPlanStatus.COMPLETED ? "complete" : "planned",
                href: `/roadmap/${session.sessionPlanId}`,
              });
            }
          }
        }
      }

      const normalizedMenu = normalizeTodayMenu(menu?.meals);

      const mealSlotsConfig: Array<{
        slot: "breakfast" | "lunch" | "dinner" | "snack";
        time: string;
        title: string;
        category: "meal" | "snack";
        href: string;
      }> = [
        {
          slot: "breakfast",
          time: "07:30",
          title: "Breakfast",
          category: "meal",
          href: "/nutrition/breakfast",
        },
        {
          slot: "lunch",
          time: "12:30",
          title: "Lunch",
          category: "meal",
          href: "/nutrition/lunch",
        },
        {
          slot: "snack",
          time: "15:30",
          title: "Snack",
          category: "snack",
          href: "/nutrition/snack",
        },
        {
          slot: "dinner",
          time: "19:30",
          title: "Dinner",
          category: "meal",
          href: "/nutrition/dinner",
        },
      ];

      for (const config of mealSlotsConfig) {
        const loggedForSlot = todayLoggedMeals.find(
          (row) =>
            toMealSlot(row.mealType) === config.slot ||
            toMealSlot((row as any).slot) === config.slot,
        );
        if (loggedForSlot) {
          todayTimeline.push({
            id: `logged-${config.slot}`,
            time: config.time,
            title: config.title,
            subtitle: cleanMealDisplayName(loggedForSlot.mealName),
            category: config.category,
            status: "complete",
            href: config.href,
          });
        } else {
          const options = normalizedMenu[config.slot];
          if (options && options.length > 0) {
            todayTimeline.push({
              id: `menu-${config.slot}`,
              time: config.time,
              title: config.title,
              subtitle: cleanMealDisplayName(options[0].mealName) || `${config.title} Plan`,
              category: config.category,
              status: "planned",
              href: config.href,
            });
          }
        }
      }

      todayTimeline.sort((a, b) => a.time.localeCompare(b.time));

      const now = new Date();
      const nowTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      let nextItem = todayTimeline.find(
        (item) =>
          item.time >= nowTimeStr && item.status !== "complete" && item.status !== "skipped",
      );
      if (!nextItem) {
        nextItem = todayTimeline.find(
          (item) => item.status !== "complete" && item.status !== "skipped",
        );
      }
      if (nextItem) {
        nextItem.status = "next";
      }

      const lastSession = history.length > 0 ? history[0] : null;
      const evidenceItems: EvidenceItem[] =
        lastSession && (lastSession.totalVolume || lastSession.averageFormScore)
          ? [
              {
                id: "total-volume",
                icon: "dumbbell",
                value: `${Math.round(lastSession.totalVolume || 0)} kg`,
                label: "Total volume, last session",
              },
              {
                id: "form-score",
                icon: "zap",
                value: `${Math.round(lastSession.averageFormScore || 0)}%`,
                label: "Average form score, last session",
              },
            ]
          : [];

      const activeSession = matchedDayPlan?.sessionPlans?.[0];
      const coachNote = activeSession?.reasoning || null;

      const streakDays = calculateConsecutiveStreakDays(history);
      const gamification =
        gamificationRes.status === "fulfilled"
          ? gamificationRes.value
          : { streakDays, isActiveToday: false, coins: 0 };

      return {
        hasActiveRoadmap: Boolean(roadmap?.weekPlans?.length),
        streak: { days: gamification.streakDays || streakDays },
        gamification,
        coachNote,
        userName,
        profileCompletionRate: completionRate,
        missingFields,
        todayTimeline,
        evidenceItems,
        nutritionSummary: {
          loggedKcal: nutrition?.consumedCalories ?? 0,
          targetKcal: nutrition?.targetCalories ?? 2000,
        },
        quickActions: DEFAULT_QUICK_ACTIONS,
        featuredExercises,
        muscleGroups: HOME_MUSCLE_GROUPS,
      };
    } catch (error) {
      console.warn("[getHomePageData] gRPC error:", error);
    }
  }

  const fallbackFeatured: FeaturedExerciseItem[] = (
    await exerciseSearchRepository.search(EMPTY_FILTERS)
  ).map(toFeaturedExercise);

  const todayLoggedMeals: any[] = [];

  const fallbackTodayTimeline: TodayTimelineItem[] = [];
  const fallbackMealSlots: Array<{
    slot: "breakfast" | "lunch" | "dinner" | "snack";
    time: string;
    title: string;
    category: "meal" | "snack";
    href: string;
  }> = [
    {
      slot: "breakfast",
      time: "07:30",
      title: "Breakfast",
      category: "meal",
      href: "/nutrition/breakfast",
    },
    { slot: "lunch", time: "12:30", title: "Lunch", category: "meal", href: "/nutrition/lunch" },
    { slot: "snack", time: "15:30", title: "Snack", category: "snack", href: "/nutrition/snack" },
    { slot: "dinner", time: "19:30", title: "Dinner", category: "meal", href: "/nutrition/dinner" },
  ];

  for (const config of fallbackMealSlots) {
    const loggedForSlot = todayLoggedMeals.find((row) => toMealSlot(row.mealType) === config.slot);
    if (loggedForSlot) {
      fallbackTodayTimeline.push({
        id: `local-logged-${config.slot}`,
        time: config.time,
        title: config.title,
        subtitle: cleanMealDisplayName(loggedForSlot.mealName),
        category: config.category,
        status: "complete",
        href: config.href,
      });
    }
  }
  fallbackTodayTimeline.sort((a, b) => a.time.localeCompare(b.time));

  const fallbackNow = new Date();
  const fallbackNowTimeStr = `${String(fallbackNow.getHours()).padStart(2, "0")}:${String(fallbackNow.getMinutes()).padStart(2, "0")}`;

  let fallbackNextItem = fallbackTodayTimeline.find(
    (item) =>
      item.time >= fallbackNowTimeStr && item.status !== "complete" && item.status !== "skipped",
  );
  if (!fallbackNextItem) {
    fallbackNextItem = fallbackTodayTimeline.find(
      (item) => item.status !== "complete" && item.status !== "skipped",
    );
  }
  if (fallbackNextItem) {
    fallbackNextItem.status = "next";
  }

  return {
    hasActiveRoadmap: false,
    streak: { days: 0 },
    gamification: { streakDays: 0, isActiveToday: false, coins: 0 },
    coachNote: null,
    userName,
    profileCompletionRate: computedRate,
    missingFields: computedMissing,
    todayTimeline: fallbackTodayTimeline,
    evidenceItems: [],
    nutritionSummary: {
      loggedKcal: 0,
      targetKcal: 2000,
    },
    quickActions: DEFAULT_QUICK_ACTIONS,
    featuredExercises: fallbackFeatured,
    muscleGroups: HOME_MUSCLE_GROUPS,
  };
}
