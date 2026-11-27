import type {
  BodySide,
  Equipment,
  InjurySeverity,
  JointRegion,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

export interface ProfileUser {
  id: string;
  name: string;
  avatarUrl: string;
  level: number;
  experienceLevel: string;
  dateOfBirth: string;
  gender: string;
}

export interface BestPersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  oneRepMax: number;
  achievedAt: string;
}

export interface ProfileQuickStats {
  totalWorkouts: number;
  activeStreakDays: number;
  totalCaloriesKcal: number;
}

export interface ProfileHighlightMetrics {
  currentWeightKg: number;
  bodyFatPercent: number;
  targetWeightKg: number;
}

export interface HealthMetricsDetail {
  heightCm: number;
  bmi: number;
  bmiCategory: string;
  targetBodyFatPercent: number;
  goals: string[];
  preferredMuscleGroups: MuscleGroup[];
}

export interface InjuryItem {
  id: string;
  region: JointRegion;
  muscle: MuscleGroup;
  side: BodySide;
  severity: InjurySeverity;
  notes: string;
  isRecovered: boolean;
  reportedAt: string;
}

export interface ProfileSettings {
  availableEquipment: Equipment[];
  preferredWorkoutTimes: string[] | Record<string, string[]>;
  coachStyle: string;
}

export interface ProfileViewModel {
  user: ProfileUser;
  bestPr: BestPersonalRecord | null;
  stats: ProfileQuickStats;
  highlights: ProfileHighlightMetrics;
  healthMetrics: HealthMetricsDetail;
  injuries: InjuryItem[];
  settings: ProfileSettings;
}
