import { z } from "zod";

export const onboardingSchema = z.object({
  goal: z.enum(["build-muscle", "fat-loss"]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  heightCm: z.number().min(120, "Enter a height from 120 to 230 cm.").max(230),
  weightKg: z.number().min(35, "Enter a weight from 35 to 300 kg.").max(300),
  targetWeightKg: z.number().min(35, "Enter a target weight from 35 to 300 kg.").max(300),
  gender: z.enum(["female", "male"]),
  dateOfBirth: z.string().optional(),
  availableDays: z.array(z.string()).min(1, "Choose at least one training day.").max(6),
  preferredTime: z.string().min(1, "Choose a preferred time."),
  equipment: z.array(z.string()).min(1, "Choose the equipment you can use."),
  muscleFocus: z.array(z.string()),
  injuryStatus: z.enum(["none", "active"]),
  injuryMuscleGroup: z.string().optional(),
  injurySeverity: z.string().optional(),
  injuryNotes: z.string().optional(),
  coachStyle: z.enum(["motivational", "strict", "scientific"]),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const onboardingDefaults: OnboardingValues = {
  goal: "build-muscle",
  experienceLevel: "intermediate",
  heightCm: 175,
  weightKg: 70,
  targetWeightKg: 68,
  gender: "female",
  dateOfBirth: "1998-05-15",
  availableDays: ["Mon", "Wed", "Fri"],
  preferredTime: "18:30",
  equipment: ["Bodyweight", "Dumbbells"],
  muscleFocus: ["Chest", "Back", "Legs"],
  injuryStatus: "none",
  injuryMuscleGroup: "Shoulders",
  injurySeverity: "Mild",
  injuryNotes: "",
  coachStyle: "motivational",
};
