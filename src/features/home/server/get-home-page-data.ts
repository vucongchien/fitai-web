import "server-only";

import { createClient } from "@connectrpc/connect";

import type {
  EvidenceItem,
  HomePageData,
  QuickAction,
  TodayTimelineItem,
} from "@/features/home/model/home-page.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { NutritionService } from "@/shared/api/gen/contracts/core/nutrition/v1/service/nutrition_service_pb";
import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

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

/**
 * Server Action lấy dữ liệu trang chủ thật từ các gRPC Services
 */
export async function getHomePageData(): Promise<HomePageData> {
  const { accessToken, userId } = await getAuthenticatedSession();

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const coachingClient = createClient(CoachingService, transport);
      const nutritionClient = createClient(NutritionService, transport);
      const workoutClient = createClient(WorkoutExecutionService, transport);
      const profileClient = createClient(ProfileService, transport);

      const [roadmapRes, nutritionRes, menuRes, historyRes, profileRes] =
        await Promise.allSettled([
          coachingClient.getActiveRoadmap({ userId: userId || "" }),
          nutritionClient.getNutritionSummary({ userId: userId || "" }),
          nutritionClient.getTodayMenu({ userId: userId || "" }),
          workoutClient.getWorkoutHistory({ limit: 20, offset: 0 }),
          profileClient.getProfile({ userId: userId || "" }),
        ]);

      let roadmap = roadmapRes.status === "fulfilled" ? roadmapRes.value.roadmap : undefined;
      const nutrition = nutritionRes.status === "fulfilled" ? nutritionRes.value : undefined;
      const menu = menuRes.status === "fulfilled" ? menuRes.value : undefined;
      const history = historyRes.status === "fulfilled" ? historyRes.value.sessions : [];
      const profile = profileRes.status === "fulfilled" ? profileRes.value : undefined;

      // Nếu chưa có active roadmap, tự động kích hoạt khởi tạo roadmap đầu tiên từ profile
      if (!roadmap && userId) {
        try {
          const newRoadmap = await coachingClient.initiateRoadmap({ userId });
          roadmap = newRoadmap.roadmap;
        } catch {
          // Ignore error
        }
      }

      // Dựng timeline từ Roadmap session plans và Bữa ăn thật
      const todayTimeline: TodayTimelineItem[] = [];

      // 1. Workout Session Plan hôm nay từ Roadmap
      if (roadmap?.weekPlans?.length) {
        const currentWeek = roadmap.weekPlans[0];
        if (currentWeek?.dayPlans?.length) {
          const todayPlan = currentWeek.dayPlans[0];
          if (todayPlan?.sessionPlans?.length) {
            const session = todayPlan.sessionPlans[0];
            todayTimeline.push({
              id: session.sessionPlanId || "today-workout",
              time: session.slotTime || "17:30",
              title: session.targetMuscleGroups?.join(", ") || "Workout Session",
              subtitle: session.reasoning || `Target RPE ${currentWeek.targetRpe || 7.5}`,
              category: "workout",
              status: "planned",
              href: `/workouts/session?planId=${session.sessionPlanId}`,
            });
          }
        }
      }

      // 2. Bữa ăn hôm nay từ Nutrition TodayMenu gRPC
      if (menu?.meals) {
        const mealsObj = menu.meals as any;
        if (Array.isArray(mealsObj.breakfast) && mealsObj.breakfast.length > 0) {
          todayTimeline.push({
            id: "menu-breakfast",
            time: "07:30",
            title: "Breakfast",
            subtitle: mealsObj.breakfast[0].mealName || "Breakfast Plan",
            category: "meal",
            status: "planned",
            href: "/nutrition/breakfast",
          });
        }
        if (Array.isArray(mealsObj.lunch) && mealsObj.lunch.length > 0) {
          todayTimeline.push({
            id: "menu-lunch",
            time: "12:30",
            title: "Lunch",
            subtitle: mealsObj.lunch[0].mealName || "Lunch Plan",
            category: "meal",
            status: "planned",
            href: "/nutrition/lunch",
          });
        }
        if (Array.isArray(mealsObj.dinner) && mealsObj.dinner.length > 0) {
          todayTimeline.push({
            id: "menu-dinner",
            time: "19:30",
            title: "Dinner",
            subtitle: mealsObj.dinner[0].mealName || "Dinner Plan",
            category: "meal",
            status: "planned",
            href: "/nutrition/dinner",
          });
        }
      }

      // Sắp xếp timeline theo mốc thời gian HH:mm
      todayTimeline.sort((a, b) => a.time.localeCompare(b.time));

      // Dựng bằng chứng tập luyện từ lịch sử thật
      const lastSession = history.length > 0 ? history[0] : null;
      const evidenceItems: EvidenceItem[] = [
        {
          id: "total-volume",
          icon: "dumbbell",
          value: lastSession && lastSession.totalVolume ? `${Math.round(lastSession.totalVolume)} kg` : "0 kg",
          label: lastSession ? "Total volume, last session" : "Volume benchmark",
        },
        {
          id: "form-score",
          icon: "zap",
          value:
            lastSession && typeof lastSession.averageFormScore === "number"
              ? `${Math.round(lastSession.averageFormScore)}%`
              : "0%",
          label: lastSession ? "Average form score, last session" : "AI Form tracker",
        },
      ];

      const todaySession = roadmap?.weekPlans?.[0]?.dayPlans?.[0]?.sessionPlans?.[0];
      const coachNote =
        todaySession?.reasoning ||
        (roadmap?.weekPlans?.[0]
          ? `Week ${roadmap.weekPlans[0].weekNumber} Target RPE: ${roadmap.weekPlans[0].targetRpe}`
          : null) ||
        (profile?.coachStyle
          ? `AI Coach (${profile.coachStyle}) is active and monitoring your progress.`
          : "Your personalized AI roadmap is active. Ready for your session."); //hard code: fallback generic greeting if reasoning or plan is not set

      if (!roadmap) {
        return {
          streak: { days: 0 },
          coachNote: null,
          todayTimeline: [],
          evidenceItems: [],
          nutritionSummary: {
            loggedKcal: nutrition?.consumedCalories ?? 0,
            targetKcal: nutrition?.targetCalories ?? 2000,
          },
          quickActions: DEFAULT_QUICK_ACTIONS,
          error: {
            type: "NO_ROADMAP",
            message: "Active roadmap not found.",
          },
        };
      }

      const streakDays = history.length > 0 ? Math.min(history.length, 30) : 0;

      return {
        streak: { days: streakDays },
        coachNote,
        todayTimeline,
        evidenceItems,
        nutritionSummary: {
          loggedKcal: nutrition?.consumedCalories ?? 0,
          targetKcal: nutrition?.targetCalories ?? 2000,
        },
        quickActions: DEFAULT_QUICK_ACTIONS,
      };
    } catch (error) {
      console.warn("[getHomePageData] gRPC error:", error);
      return {
        streak: { days: 0 },
        coachNote: null,
        todayTimeline: [],
        evidenceItems: [],
        nutritionSummary: { loggedKcal: 0, targetKcal: 2000 },
        quickActions: DEFAULT_QUICK_ACTIONS,
        error: {
          type: "CONNECTION_ERROR",
          message: error instanceof Error ? error.message : "Connection reset",
        },
      };
    }
  }

  // Fallback sạch cho trạng thái rỗng của người dùng mới khi chưa kết nối gRPC server
  return {
    streak: { days: 0 },
    coachNote: null,
    todayTimeline: [],
    evidenceItems: [],
    nutritionSummary: {
      loggedKcal: 0,
      targetKcal: 2000, //hard code: offline fallback target calories
    },
    quickActions: DEFAULT_QUICK_ACTIONS,
    error: {
      type: "CONNECTION_ERROR",
      message: "gRPC backend address not configured.",
    },
  };
}
