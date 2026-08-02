import { z } from "zod";

export const onboardingSchema = z.object({
  availableDays: z.array(z.string()).min(1, "Choose at least one training day.").max(6),
  coachStyle: z.enum(["calm", "direct", "balanced"]),
  equipment: z.array(z.string()).min(1, "Choose the equipment you can use."),
  gender: z.enum(["female", "male", "nonbinary", "prefer-not"]),
  goal: z.enum(["strength", "fat-loss", "movement", "consistency"]),
  heightCm: z.number().min(120, "Enter a height from 120 to 230 cm.").max(230),
  injuryStatus: z.enum(["none", "managed", "active"]),
  muscleFocus: z.array(z.string()).min(1, "Choose at least one focus area."),
  preferredTime: z.string().min(1, "Choose a preferred time."),
  weightKg: z.number().min(35, "Enter a weight from 35 to 300 kg.").max(300),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

export const onboardingDefaults: OnboardingValues = {
  availableDays: [],
  coachStyle: "balanced",
  equipment: [],
  gender: "prefer-not",
  goal: "consistency",
  heightCm: 168,
  injuryStatus: "none",
  muscleFocus: [],
  preferredTime: "18:30",
  weightKg: 70,
};
