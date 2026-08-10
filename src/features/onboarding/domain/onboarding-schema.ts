import { z } from "zod";

export function validateAgeBetween(dobString?: string, minAge = 14, maxAge = 90): boolean {
  if (!dobString) {return false;}
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) {return false;}
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= minAge && age <= maxAge;
}

export const onboardingEquipmentEnum = z.string().min(1);

export const onboardingGoalEnum = z.enum(["build-muscle", "fat-loss", "strength", "endurance"]);

export const onboardingSchema = z.object({
  goals: z.array(onboardingGoalEnum).min(1, "Choose at least one goal."),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  heightCm: z.number().min(120, "Enter a height from 120 to 230 cm.").max(230),
  weightKg: z.number().min(35, "Enter a weight from 35 to 300 kg.").max(300),
  targetWeightKg: z.number().min(35, "Enter a target weight from 35 to 300 kg.").max(300),
  bodyFatPercent: z
    .number()
    .min(5, "Body fat must be at least 5%.")
    .max(60, "Body fat must not exceed 60%."),
  targetBodyFatPercent: z
    .number()
    .min(5, "Target body fat must be at least 5%.")
    .max(60, "Target body fat must not exceed 60%.")
    .optional(),
  gender: z.enum(["female", "male", "other"]),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date format (YYYY-MM-DD).")
    .refine((dob) => validateAgeBetween(dob, 14, 90), {
      message: "Age must be between 14 and 90 years old.",
    }),
  preferredWorkoutTimes: z
    .union([
      z.record(z.string(), z.array(z.string())),
      z.array(z.string()),
    ])
    .refine(
      (val) => {
        if (!val) {return false;}
        if (Array.isArray(val)) {return val.length > 0;}
        if (typeof val === "object") {
          return Object.values(val).some((slots) => Array.isArray(slots) && slots.length > 0);
        }
        return false;
      },
      {
        message: "Choose at least one preferred workout time window.",
      },
    ),
  equipment: z.array(onboardingEquipmentEnum).min(1, "Choose the equipment you can use."),
  muscleFocus: z.array(z.string()),
  injuryStatus: z.enum(["none", "active"]),
  injuryMuscleGroup: z.string().optional(),
  injurySeverity: z.string().optional(),
  injuryNotes: z.string().optional(),
  coachStyle: z.enum(["motivational", "strict", "scientific"]),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const onboardingDefaults: OnboardingValues = {
  goals: ["build-muscle"],
  experienceLevel: "intermediate",
  heightCm: 175,
  weightKg: 70,
  targetWeightKg: 68,
  bodyFatPercent: 18.5,
  targetBodyFatPercent: 15,
  gender: "female",
  dateOfBirth: "1998-05-15",
  preferredWorkoutTimes: {
    mon: ["17:30-19:00"],
    wed: ["17:30-19:00"],
    fri: ["17:30-19:00"],
  },
  equipment: ["Bodyweight", "Dumbbells"],
  muscleFocus: ["Chest", "Back", "Legs"],
  injuryStatus: "none",
  injuryMuscleGroup: "Shoulders",
  injurySeverity: "Mild",
  injuryNotes: "",
  coachStyle: "motivational",
};
