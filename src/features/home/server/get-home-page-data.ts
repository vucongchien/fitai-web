import { redirect } from "next/navigation";

import "server-only";

import { createClient } from "@connectrpc/connect";

import type {
  EvidenceItem,
  FeaturedExerciseItem,
  HomePageData,
  MuscleGroupCategoryItem,
  QuickAction,
  TodayTimelineItem,
} from "@/features/home/model/home-page.types";
import { exerciseSearchRepository } from "@/features/exercise/api/search-repository";
import type { ExerciseSummary } from "@/features/exercise/domain/exercise";
import { getProfileData } from "@/features/profile/server/get-profile-data";
import type { ProfileViewModel } from "@/features/profile/model/profile.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { SessionPlanStatus } from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";
import { NutritionService } from "@/shared/api/gen/contracts/core/nutrition/v1/service/nutrition_service_pb";
import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

import { cleanMealDisplayName, normalizeTodayMenu } from "@/features/nutrition/model/meal-detail.mapper";
import { readLocalMeals } from "@/features/nutrition/server/local-meal-log";
import { dayKeyFromLoggedAt, dayKeyRange, toDayKey } from "@/shared/api/bff/aggregate/day-key";
import { deduplicateMealRows, toMealSlot } from "@/shared/api/bff/aggregate/nutrition-daily";
import { calculateConsecutiveStreakDays } from "@/shared/utils/streak";

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

const DEFAULT_MUSCLE_GROUPS: MuscleGroupCategoryItem[] = [
  {
    id: "arms-shoulders",
    name: "Arms & Shoulders",
    labelVi: "BICEPS & DELTS",
    icon: "biceps",
    bgGradient: "var(--color-surface)",
    accentColor: "var(--color-border)",
    queryParam: "arms-shoulders",
    href: "/search?body=arms-shoulders",
  },
  {
    id: "chest-back",
    name: "Chest & Back",
    labelVi: "UPPER PUSH/PULL",
    icon: "target",
    bgGradient: "var(--color-surface)",
    accentColor: "var(--color-border)",
    queryParam: "chest-back",
    href: "/search?body=chest-back",
  },
  {
    id: "legs-glutes",
    name: "Legs & Glutes",
    labelVi: "LOWER BODY",
    icon: "dumbbell",
    bgGradient: "var(--color-surface)",
    accentColor: "var(--color-border)",
    queryParam: "legs-glutes",
    href: "/search?body=legs-glutes",
  },
  {
    id: "core-abs",
    name: "Core & Abs",
    labelVi: "MIDSECTION",
    icon: "flame",
    bgGradient: "var(--color-surface)",
    accentColor: "var(--color-border)",
    queryParam: "core-abs",
    href: "/search?body=core-abs",
  },
];

function buildDynamicMuscleGroups(bodyParts: Array<{ id: string; name: string }>): MuscleGroupCategoryItem[] {
  if (!bodyParts || bodyParts.length === 0) {
    return DEFAULT_MUSCLE_GROUPS;
  }

  const mapIcon = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes("arm") || n.includes("bicep") || n.includes("tricep")) return "biceps";
    if (n.includes("leg") || n.includes("thigh") || n.includes("quad") || n.includes("glute") || n.includes("calf")) return "dumbbell";
    if (n.includes("waist") || n.includes("abs") || n.includes("core")) return "flame";
    if (n.includes("chest") || n.includes("back") || n.includes("shoulder") || n.includes("neck")) return "target";
    return "activity";
  };

  return bodyParts.map((bp) => ({
    id: bp.id,
    name: bp.name,
    labelVi: bp.name.toUpperCase(),
    icon: mapIcon(bp.name),
    bgGradient: "var(--color-surface)",
    accentColor: "var(--color-border)",
    queryParam: bp.id,
    href: `/search?body=${encodeURIComponent(bp.id)}`,
  }));
}

function isUuid(str?: string): boolean {
  if (!str) {return false;}
  const trimmed = str.trim();
  return (
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed) ||
    /^[0-9a-fA-F-]{24,}$/.test(trimmed)
  );
}

function computeProfileCompletion(profileVm: ProfileViewModel): { rate: number; missingFields: string[] } {
  let score = 0;
  const missing: string[] = [];

  if (profileVm.highlights.currentWeightKg > 0) {score += 20;} else {missing.push("Weight");}
  if (profileVm.healthMetrics.heightCm > 0) {score += 20;} else {missing.push("Height");}
  if (profileVm.user.dateOfBirth || (profileVm.user.gender && profileVm.user.gender !== "Not set")) {score += 20;} else {missing.push("Personal Details");}
  if (profileVm.healthMetrics.goals && profileVm.healthMetrics.goals.length > 0) {score += 20;} else {missing.push("Training Goals");}
  if (profileVm.user.experienceLevel || (profileVm.settings.availableEquipment && profileVm.settings.availableEquipment.length > 0)) {score += 20;} else {missing.push("Equipment & Setup");}

  return { rate: score, missingFields: missing };
}

/**
 * Server Action lấy dữ liệu trang chủ thật từ các gRPC Services
 */
export async function getHomePageData(): Promise<HomePageData> {
  const { accessToken, userId, userName } = await getAuthenticatedSession();
  if (!accessToken) {
    redirect("/login");
  }

  const profileVm = await getProfileData();
  const { rate: computedRate, missingFields: computedMissing } = computeProfileCompletion(profileVm);

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
        catalog,
        nutHistoryRes,
        localMealsRes,
      ] = await Promise.allSettled([
        coachingClient.getActiveRoadmap({ userId: userId || "" }),
        nutritionClient.getNutritionSummary({ userId: userId || "" }),
        nutritionClient.getTodayMenu({ userId: userId || "" }),
        workoutClient.getWorkoutHistory({ limit: 20, offset: 0 }),
        profileClient.getProfile({ userId: userId || "" }),
        exerciseClient.searchExercises({ keyword: "", limit: 4 }),
        exerciseSearchRepository.getCatalog(),
        typeof nutritionClient.getNutritionHistory === "function"
          ? nutritionClient.getNutritionHistory({
              endDate: todayStr,
              startDate: dayKeyRange(todayStr, 7)[0] ?? todayStr,
              userId: userId || "",
            })
          : Promise.resolve({ meals: [] }),
        readLocalMeals(),
      ]);

      const roadmap = roadmapRes.status === "fulfilled" ? roadmapRes.value.roadmap : undefined;
      const nutrition = nutritionRes.status === "fulfilled" ? nutritionRes.value : undefined;
      const menu = menuRes.status === "fulfilled" ? menuRes.value : undefined;
      const history = historyRes.status === "fulfilled" ? historyRes.value.sessions : [];
      const profileProto = profileRes.status === "fulfilled" ? profileRes.value : undefined;
      const catalogData = catalog.status === "fulfilled" ? catalog.value : { bodyParts: [], muscles: [], equipments: [] };

      const nutHistoryMeals = nutHistoryRes.status === "fulfilled" && nutHistoryRes.value?.meals ? nutHistoryRes.value.meals : [];
      const localMeals = localMealsRes.status === "fulfilled" ? localMealsRes.value : [];
      const allMealRows = deduplicateMealRows([...nutHistoryMeals, ...localMeals]);
      const todayLoggedMeals = allMealRows.filter((row) => {
        const key = dayKeyFromLoggedAt(row.loggedAt);
        if (!key) {
          return false;
        }
        return key === todayStr || dayKeyRange(todayStr, 1).includes(key);
      });

      const bodyPartMap = new Map(catalogData.bodyParts.map((b) => [b.id, b.name]));
      const muscleMap = new Map((catalogData.muscles || []).map((m) => [m.id, m.name]));
      const equipmentMap = new Map(catalogData.equipments.map((e) => [e.id, e.name]));

      const resolveMuscleGroup = (targetId?: string, bodyPartId?: string): string => {
        if (targetId && muscleMap.has(targetId)) {return muscleMap.get(targetId)!.toUpperCase();}
        if (bodyPartId && bodyPartMap.has(bodyPartId)) {return bodyPartMap.get(bodyPartId)!.toUpperCase();}
        if (targetId && !isUuid(targetId)) {return targetId.toUpperCase();}
        if (bodyPartId && !isUuid(bodyPartId)) {return bodyPartId.toUpperCase();}
        return "FULL BODY";
      };

      const resolveEquipment = (eqId?: string): string => {
        if (eqId && equipmentMap.has(eqId)) {return equipmentMap.get(eqId)!;}
        if (eqId && !isUuid(eqId)) {return eqId;}
        return "";
      };

      const dynamicMuscleGroups = buildDynamicMuscleGroups(catalogData.bodyParts);

      let featuredExercises: FeaturedExerciseItem[] = [];

      if (exerciseRes.status === "fulfilled" && exerciseRes.value.exercises?.length) {
        featuredExercises = exerciseRes.value.exercises.slice(0, 4).map((ex, idx) => ({
          id: ex.id || `ex-${idx}`,
          name: ex.name,
          muscleGroup: resolveMuscleGroup(ex.targetMuscleId, ex.bodyPartId),
          equipment: resolveEquipment(ex.equipmentId),
          durationMins: ex.defaultRestSeconds ? Math.max(5, Math.round((ex.defaultRestSeconds * 3) / 60)) : 10,
          prescription: "3 × 10 reps",
          isWeighted: ex.equipmentId ? ex.equipmentId.toLowerCase() !== "bodyweight" : true,
          imageUrl: ex.thumbnailUrl || ex.mediaUrl || ex.videoUrl || undefined,
        }));
      } else {
        const repoResults = await exerciseSearchRepository.search({
          q: "",
          bodyPartIds: [],
          targetMuscleIds: [],
          equipmentIds: [],
          difficulty: [],
          tagIds: [],
          aiOnly: false,
        });
        featuredExercises = repoResults.slice(0, 4).map((ex: ExerciseSummary) => ({
          id: ex.id,
          name: ex.name,
          muscleGroup: resolveMuscleGroup(ex.targetMuscleId, ex.bodyPartId),
          equipment: resolveEquipment(ex.equipmentId),
          durationMins: ex.defaultRestSeconds ? Math.max(5, Math.round((ex.defaultRestSeconds * 3) / 60)) : 10,
          prescription: "3 × 10 reps",
          isWeighted: ex.equipmentId !== "bodyweight",
          imageUrl: ex.thumbnailUrl || undefined,
        }));
      }

      let completionRate = computedRate;
      let missingFields = computedMissing;

      if (profileProto && typeof profileProto.completionRate === "number" && profileProto.completionRate > 0) {
        completionRate = Math.round(profileProto.completionRate <= 1 ? profileProto.completionRate * 100 : profileProto.completionRate);
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
                title: session.targetMuscleGroups!.join(", "),
                subtitle: session.reasoning || (matchedWeekPlan ? `Target RPE ${matchedWeekPlan.targetRpe || 7.5}` : "Planned Workout"),
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
        { slot: "breakfast", time: "07:30", title: "Breakfast", category: "meal", href: "/nutrition/breakfast" },
        { slot: "lunch", time: "12:30", title: "Lunch", category: "meal", href: "/nutrition/lunch" },
        { slot: "snack", time: "15:30", title: "Snack", category: "snack", href: "/nutrition/snack" },
        { slot: "dinner", time: "19:30", title: "Dinner", category: "meal", href: "/nutrition/dinner" },
      ];

      for (const config of mealSlotsConfig) {
        const loggedForSlot = todayLoggedMeals.find(
          (row) => toMealSlot(row.mealType) === config.slot || toMealSlot((row as any).slot) === config.slot,
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
        (item) => item.time >= nowTimeStr && item.status !== "complete" && item.status !== "skipped",
      );
      if (!nextItem) {
        nextItem = todayTimeline.find((item) => item.status !== "complete" && item.status !== "skipped");
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

      return {
        streak: { days: streakDays },
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
        muscleGroups: dynamicMuscleGroups,
      };
    } catch (error) {
      console.warn("[getHomePageData] gRPC error:", error);
    }
  }

  const [fallbackRepoResults, fallbackCatalog] = await Promise.all([
    exerciseSearchRepository.search({
      q: "",
      bodyPartIds: [],
      targetMuscleIds: [],
      equipmentIds: [],
      difficulty: [],
      tagIds: [],
      aiOnly: false,
    }),
    exerciseSearchRepository.getCatalog(),
  ]);
  const fallbackFeatured: FeaturedExerciseItem[] = fallbackRepoResults.map((ex: ExerciseSummary) => ({
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.bodyPartId && !isUuid(ex.bodyPartId) ? ex.bodyPartId.toUpperCase() : "FULL BODY",
    equipment: ex.equipmentId && !isUuid(ex.equipmentId) ? ex.equipmentId : "",
    durationMins: ex.defaultRestSeconds ? Math.max(5, Math.round((ex.defaultRestSeconds * 3) / 60)) : 10,
    prescription: "3 × 10 reps",
    isWeighted: ex.equipmentId !== "bodyweight",
    imageUrl: ex.thumbnailUrl || undefined,
  }));

  const localRows = await readLocalMeals();
  const todayStr = toDayKey(new Date()) ?? new Date().toISOString().split("T")[0];
  const todayLoggedMeals = localRows.filter((row) => dayKeyFromLoggedAt(row.loggedAt) === todayStr);

  const fallbackTodayTimeline: TodayTimelineItem[] = [];
  const fallbackMealSlots: Array<{
    slot: "breakfast" | "lunch" | "dinner" | "snack";
    time: string;
    title: string;
    category: "meal" | "snack";
    href: string;
  }> = [
    { slot: "breakfast", time: "07:30", title: "Breakfast", category: "meal", href: "/nutrition/breakfast" },
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
    (item) => item.time >= fallbackNowTimeStr && item.status !== "complete" && item.status !== "skipped",
  );
  if (!fallbackNextItem) {
    fallbackNextItem = fallbackTodayTimeline.find((item) => item.status !== "complete" && item.status !== "skipped");
  }
  if (fallbackNextItem) {
    fallbackNextItem.status = "next";
  }

  return {
    streak: { days: 0 },
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
    muscleGroups: buildDynamicMuscleGroups(fallbackCatalog.bodyParts),
  };
}
