import type { Difficulty, ExerciseSummary } from "@/features/exercise/domain/exercise";

export type AdminExerciseStatus = "created" | "submittedForApproval" | "approved" | "archived";

export const EXERCISE_STATUS_LABEL: Record<AdminExerciseStatus, string> = {
  created: "Draft",
  submittedForApproval: "Pending Approval",
  approved: "Approved",
  archived: "Archived",
};

export const EXERCISE_STATUS_STYLE: Record<
  AdminExerciseStatus,
  { bg: string; text: string; border: string }
> = {
  created: {
    bg: "bg-[var(--color-effort-soft)]",
    text: "text-[var(--color-effort-ink)]",
    border: "border-[color-mix(in_srgb,var(--color-effort)_25%,transparent)]",
  },
  submittedForApproval: {
    bg: "bg-[var(--color-action-soft)]",
    text: "text-[var(--color-action)]",
    border: "border-[color-mix(in_srgb,var(--color-action)_25%,transparent)]",
  },
  approved: {
    bg: "bg-[var(--color-recovery-soft)]",
    text: "text-[var(--color-recovery-ink)]",
    border: "border-[color-mix(in_srgb,var(--color-recovery)_25%,transparent)]",
  },
  archived: {
    bg: "bg-[var(--color-surface-subtle)]",
    text: "text-[var(--color-text-muted)]",
    border: "border-[var(--color-border)]",
  },
};

export type AdminExercise = ExerciseSummary & {
  status: AdminExerciseStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserRole = "admin" | "coach" | "user";

export type AdminUserStatus = "active" | "banned";

export const USER_ROLE_LABEL: Record<AdminUserRole, string> = {
  admin: "Administrator",
  coach: "Coach",
  user: "Member",
};

export const USER_STATUS_LABEL: Record<AdminUserStatus, string> = {
  active: "Active",
  banned: "Banned",
};

export interface BiologicalMetrics {
  heightCm: number;
  weightKg: number;
  bodyFatPercent?: number;
  bmi?: number;
}

export interface InjuryRecord {
  id: string;
  type: string;
  affectedArea: string;
  reportedAt: string;
  isRecovered: boolean;
}

export interface AdminUser {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  provider: "google" | "facebook" | "email";
  biologicalMetrics: BiologicalMetrics;
  experienceLevel: string;
  goals: string[];
  preferredWorkoutTimes: string[];
  availableEquipment: string[];
  preferredMuscleGroups: string[];
  coachStyle?: string;
  targetWeightKg?: number;
  targetBodyFatPercent?: number;
  injuries: InjuryRecord[];
  completionRate: number;
  aiCoachActivated: boolean;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export interface ExerciseAdminFilters {
  q: string;
  status: AdminExerciseStatus | "all";
  bodyPartId: string;
  equipmentId: string;
  difficulty: Difficulty | "all";
}

export const DEFAULT_EXERCISE_ADMIN_FILTERS: ExerciseAdminFilters = {
  q: "",
  status: "all",
  bodyPartId: "",
  equipmentId: "",
  difficulty: "all",
};

export interface UserAdminFilters {
  q: string;
  role: AdminUserRole | "all";
  status: AdminUserStatus | "all";
}

export const DEFAULT_USER_ADMIN_FILTERS: UserAdminFilters = {
  q: "",
  role: "all",
  status: "all",
};

export interface MetadataItem {
  id: string;
  name: string;
  category: "bodyPart" | "equipment" | "muscle" | "tag";
  description?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  totalCount: number;
}
