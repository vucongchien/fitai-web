import type {
  AdminUser,
  PaginatedResponse,
  UserAdminFilters,
} from "@/features/admin/domain/admin-types";

const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    userId: "usr-admin-1",
    email: "admin@fitai.com",
    displayName: "System Administrator",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    role: "admin",
    status: "active",
    provider: "email",
    biologicalMetrics: {
      heightCm: 178,
      weightKg: 74,
      bodyFatPercent: 14.5,
      bmi: 23.3,
    },
    experienceLevel: "Advanced",
    goals: ["Maintain System", "Hypertrophy"],
    preferredWorkoutTimes: ["Morning (07:00)", "Evening (18:00)"],
    availableEquipment: ["Barbell", "Dumbbell", "Cable", "Power Rack"],
    preferredMuscleGroups: ["Chest", "Back", "Shoulders"],
    coachStyle: "Direct & Data Driven",
    targetWeightKg: 75,
    targetBodyFatPercent: 13,
    injuries: [],
    completionRate: 0.95,
    aiCoachActivated: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-08-05T20:00:00.000Z",
    lastActiveAt: "2026-08-05T20:00:00.000Z",
  },
  {
    userId: "usr-coach-alex",
    email: "coach.alex@fitai.com",
    displayName: "Alex Nguyen (Coach)",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    role: "coach",
    status: "active",
    provider: "google",
    biologicalMetrics: {
      heightCm: 182,
      weightKg: 85,
      bodyFatPercent: 12.0,
      bmi: 25.6,
    },
    experienceLevel: "Expert",
    goals: ["Strength Coaching", "Powerlifting"],
    preferredWorkoutTimes: ["Afternoon (15:00)"],
    availableEquipment: ["Barbell", "Kettlebell"],
    preferredMuscleGroups: ["Legs", "Back"],
    coachStyle: "Motivational & Technical",
    targetWeightKg: 85,
    targetBodyFatPercent: 11,
    injuries: [
      {
        id: "inj-1",
        type: "Strain",
        affectedArea: "Left Hamstring",
        reportedAt: "2025-11-10T00:00:00.000Z",
        isRecovered: true,
      },
    ],
    completionRate: 0.98,
    aiCoachActivated: true,
    createdAt: "2025-02-10T08:30:00.000Z",
    updatedAt: "2026-08-05T18:45:00.000Z",
    lastActiveAt: "2026-08-05T18:45:00.000Z",
  },
  {
    userId: "usr-member-minh",
    email: "minh.le@gmail.com",
    displayName: "Minh Le",
    role: "user",
    status: "active",
    provider: "google",
    biologicalMetrics: {
      heightCm: 170,
      weightKg: 78,
      bodyFatPercent: 22.5,
      bmi: 27.0,
    },
    experienceLevel: "Beginner",
    goals: ["Fat Loss", "General Fitness"],
    preferredWorkoutTimes: ["Evening (19:30)"],
    availableEquipment: ["Dumbbell", "Bodyweight"],
    preferredMuscleGroups: ["Chest", "Legs"],
    coachStyle: "Gentle Guidance",
    targetWeightKg: 70,
    targetBodyFatPercent: 16,
    injuries: [],
    completionRate: 0.72,
    aiCoachActivated: false,
    createdAt: "2025-05-20T14:20:00.000Z",
    updatedAt: "2026-08-05T15:10:00.000Z",
    lastActiveAt: "2026-08-05T15:10:00.000Z",
  },
  {
    userId: "usr-member-hoa",
    email: "hoang.lan@yahoo.com",
    displayName: "Hoang Lan Pham",
    role: "user",
    status: "banned",
    provider: "email",
    biologicalMetrics: {
      heightCm: 162,
      weightKg: 52,
      bodyFatPercent: 20.0,
      bmi: 19.8,
    },
    experienceLevel: "Intermediate",
    goals: ["Muscle Gain"],
    preferredWorkoutTimes: ["Morning (06:00)"],
    availableEquipment: ["Resistance Bands"],
    preferredMuscleGroups: ["Glutes", "Abs"],
    coachStyle: "Strict Schedule",
    targetWeightKg: 55,
    targetBodyFatPercent: 19,
    injuries: [],
    completionRate: 0.4,
    aiCoachActivated: false,
    createdAt: "2025-06-01T09:00:00.000Z",
    updatedAt: "2026-07-20T11:30:00.000Z",
    lastActiveAt: "2026-07-20T11:30:00.000Z",
  },
];

let userStore: AdminUser[] = [...INITIAL_ADMIN_USERS];

export type FetchUsersParams = {
  cursor?: string | null;
  limit?: number;
  filters?: Partial<UserAdminFilters>;
};

export async function fetchAdminUsers({
  cursor = null,
  limit = 10,
  filters,
}: FetchUsersParams): Promise<PaginatedResponse<AdminUser>> {
  await new Promise((resolve) => setTimeout(resolve, 30));

  let result = [...userStore];

  if (filters) {
    if (filters.q && filters.q.trim() !== "") {
      const q = filters.q.trim().toLowerCase();
      result = result.filter(
        (usr) =>
          usr.displayName.toLowerCase().includes(q) ||
          usr.email.toLowerCase().includes(q) ||
          usr.userId.toLowerCase().includes(q),
      );
    }

    if (filters.role && filters.role !== "all") {
      result = result.filter((usr) => usr.role === filters.role);
    }

    if (filters.status && filters.status !== "all") {
      result = result.filter((usr) => usr.status === filters.status);
    }
  }

  const totalCount = result.length;

  let startIndex = 0;
  if (cursor) {
    const foundIndex = result.findIndex((item) => item.userId === cursor);
    if (foundIndex !== -1) {
      startIndex = foundIndex + 1;
    }
  }

  const paginatedItems = result.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < result.length;
  const nextCursor =
    hasMore && paginatedItems.length > 0 ? paginatedItems[paginatedItems.length - 1].userId : null;

  return {
    items: paginatedItems,
    nextCursor,
    totalCount,
  };
}

export async function toggleUserStatus(userId: string): Promise<AdminUser> {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const index = userStore.findIndex((usr) => usr.userId === userId);
  if (index === -1) {
    throw new Error(`User with id ${userId} not found`);
  }
  const current = userStore[index];
  const newStatus = current.status === "active" ? "banned" : "active";
  const updated: AdminUser = {
    ...current,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };
  userStore[index] = updated;
  return updated;
}

export function resetUserStore(): void {
  userStore = [...INITIAL_ADMIN_USERS];
}
