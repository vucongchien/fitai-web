import { mapRawDataToProfileViewModel } from "../model/profile.mapper";
import type { ProfileViewModel } from "../model/profile.types";

export async function getProfileData(): Promise<ProfileViewModel> {
  // Giả lập delay server nhẹ (50ms)
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Ở đây có thể gọi gRPC Client thực tế:
  // const profileRes = await profileClient.getProfile({});
  // const prRes = await workoutExecutionClient.getPersonalRecords({});

  const mockRawData = {
    user: {
      id: "usr-9901",
      name: "Emma Nguyen",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      level: 10,
    },
    profileProto: {
      userId: "usr-9901",
      weightKg: 68.5,
      heightCm: 175,
      targetWeightKg: 65.0,
      bodyFatPercent: 18.5,
      targetBodyFatPercent: 15.0,
      experienceLevel: "INTERMEDIATE",
      goals: ["BUILD_MUSCLE", "FAT_LOSS"],
      preferredMuscleGroups: ["CHEST", "BACK", "LEGS"],
      availableEquipment: ["FULL_GYM"],
      injuries: [
        {
          injuryId: "inj-1",
          muscleGroup: "SHOULDERS",
          severity: "MILD",
          notes: "Be careful with Overhead Press",
          isRecovered: false,
          reportedAt: "2026-07-10",
        },
      ],
    },
    prListProto: [
      {
        exerciseId: "deadlift",
        exerciseName: "Barbell Deadlift",
        weight: 140,
        reps: 1,
        oneRepMax: 140,
        achievedAt: "2026-08-01",
      },
      {
        exerciseId: "squat",
        exerciseName: "Barbell Squat",
        weight: 120,
        reps: 3,
        oneRepMax: 131,
        achievedAt: "2026-07-28",
      },
      {
        exerciseId: "bench",
        exerciseName: "Barbell Bench Press",
        weight: 85,
        reps: 5,
        oneRepMax: 96,
        achievedAt: "2026-07-20",
      },
    ],
    statsProto: {
      totalWorkouts: 48,
      activeStreakDays: 12,
      totalCaloriesKcal: 12500,
    },
    notificationProto: {
      enablePush: true,
      enableEmail: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "06:00",
    },
  };

  return mapRawDataToProfileViewModel(mockRawData);
}
