import type { ExerciseSummary } from "@/features/exercise/domain/exercise";
import {
  Equipment,
  ExerciseCategory,
  ExerciseForce,
  ExerciseLevel,
  ExerciseMechanic,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

/** Exercise lifecycle: draft ("created", awaiting approval) -> approved <-> archived. */
export type AdminExerciseStatus = "created" | "approved" | "archived";

export const EXERCISE_STATUS_LABEL: Record<AdminExerciseStatus, string> = {
  created: "Draft",
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
};

/** Editable fields; slug is fixed after create and AI support is set by the motion spec flow. */
export type AdminExerciseInput = Omit<AdminExercise, "id" | "slug" | "hasAiSupported">;

/** Starting values for an unsaved exercise; nothing is created until the first save. */
export const NEW_ADMIN_EXERCISE: AdminExerciseInput = {
  name: "",
  primaryMuscle: MuscleGroup.CHEST,
  secondaryMuscles: [],
  equipment: Equipment.BODY_ONLY,
  category: ExerciseCategory.STRENGTH,
  level: ExerciseLevel.BEGINNER,
  force: ExerciseForce.UNSPECIFIED,
  mechanic: ExerciseMechanic.UNSPECIFIED,
  instructions: [],
  images: [],
  videoUrl: "",
  defaultRestSeconds: 60,
  motionSlug: "",
  status: "created",
};

export type AdminExerciseResult =
  | { ok: true; exercise: AdminExercise }
  | { ok: false; message: string };

export type AdminUserRole = "admin" | "brand" | "user";

export type AdminUserStatus = "active" | "banned";

export const USER_ROLE_LABEL: Record<AdminUserRole, string> = {
  admin: "Administrator",
  brand: "Brand Partner",
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
  isBot?: boolean;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

/** UNSPECIFIED (0) on an enum filter means "all". */
export interface ExerciseAdminFilters {
  q: string;
  status: AdminExerciseStatus | "all";
  primaryMuscle: MuscleGroup;
  equipment: Equipment;
  category: ExerciseCategory;
  level: ExerciseLevel;
}

export const DEFAULT_EXERCISE_ADMIN_FILTERS: ExerciseAdminFilters = {
  q: "",
  status: "all",
  primaryMuscle: MuscleGroup.UNSPECIFIED,
  equipment: Equipment.UNSPECIFIED,
  category: ExerciseCategory.UNSPECIFIED,
  level: ExerciseLevel.UNSPECIFIED,
};

export interface UserAdminFilters {
  q: string;
  role?: AdminUserRole | "all";
  status: AdminUserStatus | "all";
  hideBots?: boolean;
}

export const DEFAULT_USER_ADMIN_FILTERS: UserAdminFilters = {
  q: "",
  role: "all",
  status: "all",
  hideBots: false,
};

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  totalCount: number;
}
