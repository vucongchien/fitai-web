export type CameraAngle = "front" | "side" | "45_degree" | "overhead";

export interface DialogueOption {
  text: string;
  audioUrl: string;
}

export interface DialogueSeverities {
  severity1: DialogueOption[];
  severity2: DialogueOption[];
}

export interface DialogueEngineConfig {
  personalityId: string;
  cooldowns: Record<string, number>;
  dialogueMap: Record<string, DialogueSeverities>;
}

export interface CalibrationConfig {
  minDistanceMeters: number;
  maxDistanceMeters: number;
  targetAngle: number;
}

export interface RepCountingRules {
  minRomPercentage: number;
}

export interface FormScoringRules {
  penaltyPerError: number;
}

export interface PoseRuleConfig {
  calibration: CalibrationConfig;
  repCounting: RepCountingRules;
  formScoring: FormScoringRules;
  errorRules: Record<
    string,
    {
      description: string;
      joint: string;
      minAngle?: number;
      maxAngle?: number;
      thresholdDegrees?: number;
    }
  >;
}

export interface AdminMotionSpecification {
  exerciseId: string;
  exerciseName?: string;
  onnxDetectorUrl: string;
  onnxSkeletonUrl: string;
  localRulesUrl: string;
  dialogueEngineUrl: string;
  recommendedCameraAngle: CameraAngle | string;
  isReady?: boolean;
  updatedAt?: string;
  poseRules?: PoseRuleConfig;
  dialogueEngine?: DialogueEngineConfig;
}

export type MotionAssetType = "POSE_RULES" | "DIALOGUE_CONFIG";

export interface PatchMotionAssetRequest {
  exerciseId: string;
  assetType: MotionAssetType;
  patchJson: string;
  deleteKeys?: string[];
}

export interface PresignedUploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fileName: string;
}
