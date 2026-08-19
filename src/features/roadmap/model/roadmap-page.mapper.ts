import type {
  Roadmap,
  SessionPlan,
  WeekPlan,
} from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";
import {
  RoadmapPhase,
  SessionPlanStatus,
} from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";
import type { GetInjuryHistoryResponse } from "@/shared/api/gen/contracts/supporting/profile/v1/message/profile_messages_pb";

import type {
  ContextItem,
  RoadmapPageData,
  SchedulePageData,
  ScheduleWeek,
  SessionPlanPageData,
  SessionStatus,
  SessionSummary,
  WeekState,
  WeekSummary,
} from "./roadmap-page.types";

export function formatDate(dateProto?: { day: number; month: number; year: number }): {
  dayStr: string;
  dateStr: string;
} {
  if (!dateProto || !dateProto.year) {
    return { dayStr: "Mon", dateStr: "" };
  }
  const date = new Date(dateProto.year, dateProto.month - 1, dateProto.day);
  const dayStr = date.toLocaleDateString("en-US", { weekday: "short" });
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { dayStr, dateStr };
}

export function formatWeekDateRange(startDateProto?: { day: number; month: number; year: number }): string {
  if (!startDateProto || !startDateProto.year) {
    return "";
  }
  const startFormatted = formatDate(startDateProto);
  const startObj = new Date(startDateProto.year, startDateProto.month - 1, startDateProto.day);
  const endObj = new Date(startObj);
  endObj.setDate(endObj.getDate() + 6);

  const endFormatted = formatDate({
    day: endObj.getDate(),
    month: endObj.getMonth() + 1,
    year: endObj.getFullYear(),
  });

  return `${startFormatted.dateStr}–${endFormatted.dateStr}`;
}

export function mapPhaseToLabel(phase: RoadmapPhase): string {
  switch (phase) {
    case RoadmapPhase.ACCUMULATION: {
      return "Accumulation";
    }
    case RoadmapPhase.OVERLOAD: {
      return "Overload";
    }
    case RoadmapPhase.PEAK: {
      return "Peak";
    }
    case RoadmapPhase.DELOAD: {
      return "Recovery";
    }
    default: {
      return "Foundation";
    }
  }
}

function isWeekComplete(week: WeekPlan): boolean {
  if (!week.dayPlans || week.dayPlans.length === 0) {
    return false;
  }
  return week.dayPlans.every((dp) =>
    (dp.sessionPlans || []).every(
      (sp) =>
        sp.status === SessionPlanStatus.COMPLETED ||
        sp.status === SessionPlanStatus.SKIPPED ||
        sp.status === SessionPlanStatus.ABORTED,
    ),
  );
}

export function mapSessionStatus(status: SessionPlanStatus, isNext: boolean): SessionStatus {
  switch (status) {
    case SessionPlanStatus.COMPLETED: {
      return "complete";
    }
    case SessionPlanStatus.SKIPPED: {
      return "skipped";
    }
    case SessionPlanStatus.ABORTED: {
      return "skipped";
    }
    case SessionPlanStatus.PENDING: {
      return isNext ? "next" : "planned";
    }
    default: {
      return "rest";
    }
  }
}

export function adaptRoadmapPageData(roadmapRes: Roadmap): RoadmapPageData {
  const weekPlans = roadmapRes.weekPlans || [];

  // Xác định trạng thái của từng tuần và tìm tuần active
  let activeWeekNumber = 1;
  const weeks: WeekSummary[] = weekPlans.map((wp, index) => {
    let state: WeekState = "planned";
    const completed = isWeekComplete(wp);

    if (completed) {
      state = "complete";
    } else if (index === 0 || (index > 0 && isWeekComplete(weekPlans[index - 1]))) {
      state = "active";
      activeWeekNumber = wp.weekNumber;
    }

    return {
      number: wp.weekNumber,
      label: mapPhaseToLabel(wp.phase),
      state,
    };
  });

  // Nếu không tìm được tuần active nào (ví dụ đã hoàn thành hết), tuần cuối cùng sẽ active hoặc complete
  const hasActive = weeks.some((w) => w.state === "active");
  if (!hasActive && weeks.length > 0) {
    const lastWeek = weeks.at(-1);
    if (lastWeek) {
      lastWeek.state = "active";
      activeWeekNumber = lastWeek.number;
    }
  }

  // Lấy danh sách session của tuần active
  const activeWeekPlan = weekPlans.find((wp) => wp.weekNumber === activeWeekNumber) || weekPlans[0];
  const currentWeekSessions: SessionSummary[] = [];

  if (activeWeekPlan?.dayPlans) {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const curDay = now.getDate();

    let targetNextSessionId: string | null = null;

    // Chỉ bài tập PENDING thuộc đúng ngày thời gian thực (ngày hôm nay) mới được màu xanh (Next session)
    for (const dp of activeWeekPlan.dayPlans) {
      if (
        dp.scheduledDate &&
        dp.scheduledDate.year === curYear &&
        dp.scheduledDate.month === curMonth &&
        dp.scheduledDate.day === curDay
      ) {
        const pending = (dp.sessionPlans || []).find(
          (sp) => sp.status === SessionPlanStatus.PENDING && (sp.targetMuscleGroups?.length ?? 0) > 0,
        );
        if (pending) {
          targetNextSessionId = pending.sessionPlanId;
          break;
        }
      }
    }

    for (const dp of activeWeekPlan.dayPlans) {
      const { dayStr, dateStr } = formatDate(dp.scheduledDate as any);
      if (!dp.sessionPlans || dp.sessionPlans.length === 0) {
        currentWeekSessions.push({
          id: dp.dayPlanId || `rest-${dayStr}-${dateStr}`,
          day: dayStr,
          date: dateStr,
          title: "Recovery Day",
          time: "All day",
          duration: 20,
          targetRpe: activeWeekPlan.targetRpe || 6,
          muscles: [],
          status: "rest",
        });
        continue;
      }
      for (const sp of dp.sessionPlans || []) {
        const isRest = sp.targetMuscleGroups?.length === 0;
        const isNext = sp.sessionPlanId === targetNextSessionId;

        const duration = sp.prescription
          ? Math.round(
              [
                ...(sp.prescription.warmUps || []),
                ...(sp.prescription.mainExercises || []),
                ...(sp.prescription.coolDowns || []),
              ].reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) / 60,
            ) || 45
          : (isRest
            ? 20
            : 40);

        const reasoning = sp.reasoning?.trim() || "";
        const isAdapted = Boolean(
          reasoning &&
            (reasoning.toLowerCase().includes("injury") ||
              reasoning.toLowerCase().includes("pain") ||
              reasoning.toLowerCase().includes("protect") ||
              reasoning.toLowerCase().includes("strain") ||
              reasoning.toLowerCase().includes("recover") ||
              reasoning.toLowerCase().includes("replace") ||
              reasoning.toLowerCase().includes("adjust") ||
              reasoning.toLowerCase().includes("recalibrat")),
        );

        currentWeekSessions.push({
          id: sp.sessionPlanId,
          day: dayStr,
          date: dateStr,
          title: sp.targetMuscleGroups?.join(", ") || (isRest ? "Recovery Day" : "Workout Session"),
          time: sp.slotTime || "18:30",
          duration,
          targetRpe: activeWeekPlan.targetRpe || 7,
          muscles: sp.targetMuscleGroups || [],
          status: isRest ? "rest" : mapSessionStatus(sp.status, isNext),
          reasoning: reasoning || undefined,
          isAdapted,
        });
      }
    }
  }

  // Tạo range ngày cho tuần active
  const currentWeekDateRange = formatWeekDateRange(activeWeekPlan?.startDate as any);

  const contextItems: ContextItem[] = [
    {
      id: "sessions-count",
      iconName: "calendar-range",
      title: `${currentWeekSessions.filter((s) => s.status !== "rest").length} strength sessions`,
      description: "Plus scheduled guided recovery days",
    },
    {
      id: "effort-target",
      iconName: "gauge",
      title: `Target effort ${activeWeekPlan?.targetRpe || "6–7"} RPE`,
      description: "Progress with challenge and control",
    },
  ];

  return {
    activeWeek: activeWeekNumber,
    weeks,
    currentWeekSessions,
    currentWeekLabel: `Week ${activeWeekNumber} schedule`,
    currentWeekDateRange,
    contextItems,
  };
}

export function adaptSchedulePageData(roadmap: Roadmap): SchedulePageData {
  const roadmapData = adaptRoadmapPageData(roadmap);
  const {activeWeek} = roadmapData;

  const weeks: ScheduleWeek[] = (roadmap.weekPlans || []).map((wp) => {
    const dateRange = formatWeekDateRange(wp.startDate as any);

    const sessions: SessionSummary[] = [];
      if (wp.dayPlans) {
        let nextFound = false;
        for (const dp of wp.dayPlans) {
          const { dayStr, dateStr } = formatDate(dp.scheduledDate as any);
          if (!dp.sessionPlans || dp.sessionPlans.length === 0) {
            sessions.push({
              id: dp.dayPlanId || `rest-${dayStr}-${dateStr}`,
              day: dayStr,
              date: dateStr,
              title: "Recovery Day",
              time: "All day",
              duration: 20,
              targetRpe: wp.targetRpe || 6,
              muscles: [],
              status: "rest",
            });
            continue;
          }
          for (const sp of dp.sessionPlans || []) {
            const isRest = sp.targetMuscleGroups?.length === 0;
            const isPending = sp.status === SessionPlanStatus.PENDING;
            const isNext = isPending && !isRest && !nextFound && wp.weekNumber === activeWeek;
            if (isNext) {
              nextFound = true;
            }

            const duration =
              (sp as any).estimatedDurationMinutes ??
              (sp.prescription
                ? Math.round(
                    [
                      ...(sp.prescription.warmUps || []),
                      ...(sp.prescription.mainExercises || []),
                      ...(sp.prescription.coolDowns || []),
                    ].reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) / 60,
                  ) || 45
                : (isRest
                  ? 20
                  : 40));

            const reasoning = sp.reasoning?.trim() || "";
            const isAdapted = Boolean(
              reasoning &&
                (reasoning.toLowerCase().includes("injury") ||
                  reasoning.toLowerCase().includes("pain") ||
                  reasoning.toLowerCase().includes("protect") ||
                  reasoning.toLowerCase().includes("strain") ||
                  reasoning.toLowerCase().includes("recover") ||
                  reasoning.toLowerCase().includes("replace") ||
                  reasoning.toLowerCase().includes("adjust") ||
                  reasoning.toLowerCase().includes("recalibrat")),
            );

            sessions.push({
              id: sp.sessionPlanId,
              day: dayStr,
              date: dateStr,
              title: sp.targetMuscleGroups?.join(", ") || (isRest ? "Recovery Day" : "Workout Session"),
              time: sp.slotTime || "18:30",
              duration,
              targetRpe: wp.targetRpe || 7, //Hard code: fallback default RPE of 7 if weekly plan doesn't specify target RPE
              muscles: sp.targetMuscleGroups || [],
              status: isRest ? "rest" : mapSessionStatus(sp.status, isNext),
              reasoning: reasoning || undefined,
              isAdapted,
            });
          }
        }
      }

    const weekSummary = roadmapData.weeks.find((w) => w.number === wp.weekNumber);
    const state = weekSummary ? weekSummary.state : "planned";

    return {
      dateRange,
      label: mapPhaseToLabel(wp.phase),
      number: wp.weekNumber,
      sessions,
      state,
    };
  });

  return {
    activeWeek,
    weeks,
  };
}

export function adaptSessionPlanPageData(
  sessionRes: SessionPlan,
  injuryRes: GetInjuryHistoryResponse,
): SessionPlanPageData {
  const { dayStr, dateStr } = formatDate(sessionRes.scheduledDate as any);

  const duration = sessionRes.prescription
    ? Math.round(
        [
          ...(sessionRes.prescription.warmUps || []),
          ...(sessionRes.prescription.mainExercises || []),
          ...(sessionRes.prescription.coolDowns || []),
        ].reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0) / 60,
      ) || 45 //Hard code: default workout duration
    : 45; //Hard code: fallback default duration

  const exercises = sessionRes.prescription
    ? [
        ...(sessionRes.prescription.warmUps || []),
        ...(sessionRes.prescription.mainExercises || []),
        ...(sessionRes.prescription.coolDowns || []),
      ].map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.exerciseName,
        prescription: `${ex.targetSets} × ${ex.targetReps}`,
        rest: `${ex.restSetSec || 60} sec`, //Hard code: fallback rest set time
        notes: ex.notes || "Maintain controlled range of motion.", //Hard code: default instructions note
      }))
    : [];

  const activeInjuries = (injuryRes.injuries || []).filter((inj) => !inj.isRecovered);
  const hasInjury = activeInjuries.length > 0;

  const readinessNote = {
    variant: (hasInjury ? "warning" : "safe") as "safe" | "warning",
    title: hasInjury ? "Injury Warning" : "Ready to train",
    description: hasInjury
      ? `Active constraints: ${activeInjuries.map((inj) => inj.muscleGroup).join(", ")}. Please proceed with caution.`
      : "No active injury constraints affect today's exercise selection.",
  };

  return {
    sessionPlanId: sessionRes.sessionPlanId,
    title: sessionRes.targetMuscleGroups?.join(", ") || "Workout Session",
    day: dayStr,
    date: dateStr,
    duration,
    targetRpe: sessionRes.prescription?.mainExercises?.[0]?.targetRpe || 7, //Hard code: default RPE fallback
    sessionDescription: sessionRes.reasoning || "Personalized workout session tailored for your roadmap.", //Hard code: fallback reasoning string
    exercises,
    readinessNote,
    featureNotes: [
      {
        id: "camera-coaching",
        icon: "camera" as const,
        title: "Manual logging is on",
        description: "Camera coaching is available for supported exercises.",
      },
    ],
    preSessionChecks: [
      "Clear enough space to move.",
      "Keep water within reach.",
      "Stop if new or sharp pain appears.",
    ],
    startWorkoutHref: `/workouts/live/${sessionRes.sessionPlanId}`, //Hard code: URL format helper
  };
}
