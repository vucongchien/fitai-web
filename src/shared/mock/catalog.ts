import type { CatalogMetadata } from "@/features/exercise/domain/exercise";

const BODY_PARTS = [
  { id: "bp-chest", name: "Chest" },
  { id: "bp-back", name: "Back" },
  { id: "bp-shoulders", name: "Shoulders" },
  { id: "bp-arms", name: "Arms" },
  { id: "bp-core", name: "Core" },
  { id: "bp-legs", name: "Legs" },
  { id: "bp-glutes", name: "Glutes" },
  { id: "bp-full-body", name: "Full body" },
] as const;

const EQUIPMENTS = [
  { id: "eq-bodyweight", name: "Bodyweight" },
  { id: "eq-dumbbell", name: "Dumbbell" },
  { id: "eq-barbell", name: "Barbell" },
  { id: "eq-kettlebell", name: "Kettlebell" },
  { id: "eq-band", name: "Resistance band" },
  { id: "eq-machine", name: "Machine" },
] as const;

const MUSCLES = [
  { id: "ms-pectoralis-major", name: "Pectoralis major", bodyPartId: "bp-chest" },
  { id: "ms-latissimus-dorsi", name: "Latissimus dorsi", bodyPartId: "bp-back" },
  { id: "ms-trapezius", name: "Trapezius", bodyPartId: "bp-back" },
  { id: "ms-rear-delts", name: "Rear deltoids", bodyPartId: "bp-shoulders" },
  { id: "ms-front-delts", name: "Front deltoids", bodyPartId: "bp-shoulders" },
  { id: "ms-biceps", name: "Biceps", bodyPartId: "bp-arms" },
  { id: "ms-triceps", name: "Triceps", bodyPartId: "bp-arms" },
  { id: "ms-rectus-abdominis", name: "Rectus abdominis", bodyPartId: "bp-core" },
  { id: "ms-obliques", name: "Obliques", bodyPartId: "bp-core" },
  { id: "ms-quadriceps", name: "Quadriceps", bodyPartId: "bp-legs" },
  { id: "ms-hamstrings", name: "Hamstrings", bodyPartId: "bp-legs" },
  { id: "ms-calves", name: "Calves", bodyPartId: "bp-legs" },
  { id: "ms-gluteus-maximus", name: "Gluteus maximus", bodyPartId: "bp-glutes" },
  { id: "ms-full-body-chain", name: "Full body chain", bodyPartId: "bp-full-body" },
] as const;

const TAGS = [
  { id: "tag-strength", name: "Strength" },
  { id: "tag-mobility", name: "Mobility" },
  { id: "tag-recovery", name: "Recovery" },
  { id: "tag-cardio", name: "Cardio" },
  { id: "tag-stability", name: "Stability" },
  { id: "tag-warmup", name: "Warmup" },
  { id: "tag-cooldown", name: "Cooldown" },
] as const;

export const MOCK_CATALOG: CatalogMetadata = {
  bodyParts: [...BODY_PARTS],
  equipments: [...EQUIPMENTS],
  muscles: [...MUSCLES],
  tags: [...TAGS],
};
