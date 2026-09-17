import { useSyncExternalStore } from "react";

export interface RoadmapSession {
  dayName: string;
  durationMinutes: number;
  id: string;
  isCompleted: boolean;
  targetMuscles: string[];
  title: string;
}

export interface RoadmapWeek {
  focus: string;
  isDeload: boolean;
  sessions: RoadmapSession[];
  weekNumber: number;
}

export interface RoadmapState {
  currentWeekNumber: number;
  error: string | null;
  isLoading: boolean;
  weeks: RoadmapWeek[];
}

const defaultWeeks: RoadmapWeek[] = [
  {
    focus: "Tăng tải khối lượng cơ bản (Volume Accumulation)",
    isDeload: false,
    sessions: [
      {
        dayName: "Thứ 2",
        durationMinutes: 50,
        id: "w1_d1",
        isCompleted: true,
        targetMuscles: ["Ngực", "Tay sau"],
        title: "Ngực & Tay Sau",
      },
      {
        dayName: "Thứ 4",
        durationMinutes: 55,
        id: "w1_d2",
        isCompleted: true,
        targetMuscles: ["Lưng", "Tay trước"],
        title: "Lưng & Tay Trước",
      },
      {
        dayName: "Thứ 6",
        durationMinutes: 60,
        id: "w1_d3",
        isCompleted: false,
        targetMuscles: ["Chân", "Bắp chuối"],
        title: "Chân & Mông",
      },
      {
        dayName: "Chủ nhật",
        durationMinutes: 45,
        id: "w1_d4",
        isCompleted: false,
        targetMuscles: ["Vai", "Bụng"],
        title: "Vai & Core",
      },
    ],
    weekNumber: 1,
  },
  {
    focus: "Tăng cường độ tải trọng (Intensity Escalation)",
    isDeload: false,
    sessions: [
      {
        dayName: "Thứ 2",
        durationMinutes: 50,
        id: "w2_d1",
        isCompleted: false,
        targetMuscles: ["Ngực", "Tay sau"],
        title: "Ngực Nặng & Tay Sau",
      },
      {
        dayName: "Thứ 4",
        durationMinutes: 55,
        id: "w2_d2",
        isCompleted: false,
        targetMuscles: ["Lưng", "Tay trước"],
        title: "Lưng Rộng & Tay Trước",
      },
      {
        dayName: "Thứ 6",
        durationMinutes: 60,
        id: "w2_d3",
        isCompleted: false,
        targetMuscles: ["Chân", "Bắp chuối"],
        title: "Squat Nặng & Đùi Sau",
      },
      {
        dayName: "Chủ nhật",
        durationMinutes: 45,
        id: "w2_d4",
        isCompleted: false,
        targetMuscles: ["Vai", "Bụng"],
        title: "Overhead Press & Core",
      },
    ],
    weekNumber: 2,
  },
  {
    focus: "Đỉnh điểm kích thích cơ bắp (Overreach)",
    isDeload: false,
    sessions: [
      {
        dayName: "Thứ 2",
        durationMinutes: 55,
        id: "w3_d1",
        isCompleted: false,
        targetMuscles: ["Ngực", "Tay sau"],
        title: "Ngực Volume Cao",
      },
      {
        dayName: "Thứ 4",
        durationMinutes: 60,
        id: "w3_d2",
        isCompleted: false,
        targetMuscles: ["Lưng", "Tay trước"],
        title: "Deadlift & Pull-ups",
      },
      {
        dayName: "Thứ 6",
        durationMinutes: 65,
        id: "w3_d3",
        isCompleted: false,
        targetMuscles: ["Chân"],
        title: "Chân Volume Cao",
      },
      {
        dayName: "Chủ nhật",
        durationMinutes: 50,
        id: "w3_d4",
        isCompleted: false,
        targetMuscles: ["Toàn thân"],
        title: "Fullbody Hypertrophy",
      },
    ],
    weekNumber: 3,
  },
  {
    focus: "Giảm tải & Phục hồi hệ thần kinh (Deload & Recovery)",
    isDeload: true,
    sessions: [
      {
        dayName: "Thứ 3",
        durationMinutes: 35,
        id: "w4_d1",
        isCompleted: false,
        targetMuscles: ["Toàn thân"],
        title: "Upper Light Deload",
      },
      {
        dayName: "Thứ 6",
        durationMinutes: 35,
        id: "w4_d2",
        isCompleted: false,
        targetMuscles: ["Chân", "Core"],
        title: "Lower Light Deload",
      },
    ],
    weekNumber: 4,
  },
];

let state: RoadmapState = {
  currentWeekNumber: 1,
  error: null,
  isLoading: false,
  weeks: defaultWeeks,
};

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const roadmapStore = {
  getSnapshot(): RoadmapState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  selectWeek(weekNumber: number): void {
    state = { ...state, currentWeekNumber: weekNumber };
    notify();
  },

  setLoading(isLoading: boolean): void {
    state = { ...state, isLoading };
    notify();
  },

  setError(error: string | null): void {
    state = { ...state, error, isLoading: false };
    notify();
  },
};

export function useRoadmap(): RoadmapState {
  return useSyncExternalStore(
    roadmapStore.subscribe,
    roadmapStore.getSnapshot,
    roadmapStore.getSnapshot,
  );
}
