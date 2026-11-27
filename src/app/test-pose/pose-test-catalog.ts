import type { MotionSpec } from "@/features/workout/model/live-session.types";

export type MuscleGroupFilter =
  | "All"
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Upper Arms"
  | "Upper Legs"
  | "Waist";

export interface PoseTestScenario {
  id: string;
  label: string;
  videoUrl: string;
  cameraAngle: "SIDE" | "FRONT" | "AUTO";
  expectedReps?: number;
  expectedFaults: string[];
}

export interface PoseTestExercise {
  id: string;
  name: string;
  bodyPart: Exclude<MuscleGroupFilter, "All">;
  targetMuscle: string;
  dbVariants: string[];
  cameraAngle: "SIDE" | "FRONT";
  isTimed: boolean;
  rulesUrl: string;
  dialogueUrl: string;
  sampleVideoUrl: string;
  scenarios?: PoseTestScenario[];
}

export const MUSCLE_GROUP_FILTERS: MuscleGroupFilter[] = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Upper Arms",
  "Upper Legs",
  "Waist",
];

export const POSE_MODEL_OPTIONS = [
  { id: "/models/yolo26n-pose.onnx", label: "YOLO26n-Pose (Nano · 12MB · Recommended)" },
  { id: "/models/yolo26n-halpe-pose.onnx", label: "YOLO26n-Pose Halpe finetune (Nano · 12MB)" },
  { id: "/models/yolo26s-pose.onnx", label: "YOLO26s-Pose (Small)" },
  { id: "/models/yolo26m-pose.onnx", label: "YOLO26m-Pose (Medium)" },
  { id: "/models/yolo11n-pose.onnx", label: "YOLO11n-Pose (Nano · 11MB)" },
  { id: "/models/yolo11s-pose.onnx", label: "YOLO11s-Pose (Small · 38MB)" },
  { id: "/models/yolo11m-pose.onnx", label: "YOLO11m-Pose (Medium · 80MB)" },
  { id: "/models/yolov8n-pose.onnx", label: "YOLOv8n-Pose (Baseline · 13MB)" },
] as const;

export const POSE_TEST_EXERCISES: PoseTestExercise[] = [
  {
    id: "push_up",
    name: "Push-up",
    bodyPart: "Chest",
    targetMuscle: "Pectorals",
    dbVariants: ["Push-up"],
    cameraAngle: "SIDE",
    isTimed: false,
    rulesUrl: "/models/rules/push_up_rule.json",
    dialogueUrl: "/models/dialogue/push_up_dialogue.json",
    sampleVideoUrl: "/test-videos/push_up/good_side.mp4",
    scenarios: [
      {
        id: "pushup_good_side",
        label: "🟢 Chuẩn: Góc ngang 90° (3 reps)",
        videoUrl: "/test-videos/push_up/good_side.mp4",
        cameraAngle: "SIDE",
        expectedReps: 3,
        expectedFaults: [],
      },
      {
        id: "pushup_good_oblique",
        label: "🟢 Chuẩn: Góc chéo 45° (3 reps)",
        videoUrl: "/test-videos/push_up/good_oblique.mp4",
        cameraAngle: "AUTO",
        expectedReps: 3,
        expectedFaults: [],
      },
      {
        id: "pushup_good_front",
        label: "🟢 Chuẩn: Góc trước (3 reps)",
        videoUrl: "/test-videos/push_up/good_front.mp4",
        cameraAngle: "FRONT",
        expectedReps: 3,
        expectedFaults: [],
      },
      {
        id: "pushup_fault_hip_sag",
        label: "🔴 Lỗi 1: Võng lưng / Sập hông (Side)",
        videoUrl: "/test-videos/push_up/fault_hip_sag_side.mp4",
        cameraAngle: "SIDE",
        expectedFaults: ["ERR_SIGNED_HIP_Y_DIFF_TOO_HIGH"],
      },
      {
        id: "pushup_fault_elbow_flare",
        label: "🔴 Lỗi 2: Bành khuỷu tay 90° / Tay quá rộng (Front)",
        videoUrl: "/test-videos/push_up/fault_elbow_flare_front.mp4",
        cameraAngle: "FRONT",
        expectedFaults: ["ERR_HAND_WIDTH_RATIO_TOO_HIGH"],
      },
      {
        id: "pushup_fault_half_rep",
        label: "🔴 Lỗi 3: Hạ chưa đủ sâu / Half-Rep (Side)",
        videoUrl: "/test-videos/push_up/fault_half_rep_side.mp4",
        cameraAngle: "SIDE",
        expectedFaults: ["ERR_INCORRECT_DEPTH"],
      },
      {
        id: "pushup_fault_head_drop",
        label: "🔴 Lỗi 4: Rướn cổ / Sập hông ăn gian ROM (Side)",
        videoUrl: "/test-videos/push_up/fault_head_drop_side.mp4",
        cameraAngle: "SIDE",
        expectedFaults: ["ERR_INCORRECT_DEPTH"],
      },
    ],
  },
  {
    id: "bench_press",
    name: "Barbell Bench Press",
    bodyPart: "Chest",
    targetMuscle: "Pectorals",
    dbVariants: ["Barbell Bench Press"],
    cameraAngle: "SIDE",
    isTimed: false,
    rulesUrl: "/models/rules/bench_press_rule.json",
    dialogueUrl: "/models/dialogue/bench_press_dialogue.json",
    sampleVideoUrl: "/test-videos/bench_press.mp4",
  },
  {
    id: "pull_up",
    name: "Pull-up",
    bodyPart: "Back",
    targetMuscle: "Lats",
    dbVariants: ["Pull-up"],
    cameraAngle: "FRONT",
    isTimed: false,
    rulesUrl: "/models/rules/pull_up_rule.json",
    dialogueUrl: "/models/dialogue/pull_up_dialogue.json",
    sampleVideoUrl: "/test-videos/pull_up.mp4",
  },
  {
    id: "shoulder_press",
    name: "Shoulder Press",
    bodyPart: "Shoulders",
    targetMuscle: "Delts",
    dbVariants: ["Cable Shoulder Press", "Dumbbell Seated Shoulder Press"],
    cameraAngle: "FRONT",
    isTimed: false,
    rulesUrl: "/models/rules/shoulder_press_rule.json",
    dialogueUrl: "/models/dialogue/shoulder_press_dialogue.json",
    sampleVideoUrl: "/test-videos/shoulder_press.mp4",
  },
  {
    id: "lateral_raise",
    name: "Dumbbell Lateral Raise",
    bodyPart: "Shoulders",
    targetMuscle: "Delts",
    dbVariants: ["Dumbbell Lateral Raise"],
    cameraAngle: "FRONT",
    isTimed: false,
    rulesUrl: "/models/rules/lateral_raise_rule.json",
    dialogueUrl: "/models/dialogue/lateral_raise_dialogue.json",
    sampleVideoUrl: "/test-videos/lateral_raise.mp4",
  },
  {
    id: "bicep_curl",
    name: "Dumbbell Biceps Curl",
    bodyPart: "Upper Arms",
    targetMuscle: "Biceps",
    dbVariants: ["Dumbbell Biceps Curl"],
    cameraAngle: "SIDE",
    isTimed: false,
    rulesUrl: "/models/rules/bicep_curl_rule.json",
    dialogueUrl: "/models/dialogue/bicep_curl_dialogue.json",
    sampleVideoUrl: "/test-videos/bicep_curl.mp4",
  },
  {
    id: "triceps_dip",
    name: "Triceps Dip",
    bodyPart: "Upper Arms",
    targetMuscle: "Triceps",
    dbVariants: ["Triceps Dip"],
    cameraAngle: "SIDE",
    isTimed: false,
    rulesUrl: "/models/rules/triceps_dip_rule.json",
    dialogueUrl: "/models/dialogue/triceps_dip_dialogue.json",
    sampleVideoUrl: "/test-videos/triceps_dip.mp4",
  },
  {
    id: "squat",
    name: "Squat",
    bodyPart: "Upper Legs",
    targetMuscle: "Glutes",
    dbVariants: ["Barbell Full Squat", "Weighted Squat"],
    cameraAngle: "SIDE",
    isTimed: false,
    rulesUrl: "/models/rules/squat_rule.json",
    dialogueUrl: "/models/dialogue/squat_dialogue.json",
    sampleVideoUrl: "/test-videos/squat.mp4",
  },
  {
    id: "deadlift",
    name: "Barbell Deadlift",
    bodyPart: "Upper Legs",
    targetMuscle: "Glutes",
    dbVariants: ["Barbell Deadlift"],
    cameraAngle: "SIDE",
    isTimed: false,
    rulesUrl: "/models/rules/deadlift_rule.json",
    dialogueUrl: "/models/dialogue/deadlift_dialogue.json",
    sampleVideoUrl: "/test-videos/deadlift.mp4",
  },
  {
    id: "lunge",
    name: "Lunge",
    bodyPart: "Upper Legs",
    targetMuscle: "Glutes",
    dbVariants: ["Barbell Lunge", "Dumbbell Lunge"],
    cameraAngle: "SIDE",
    isTimed: false,
    rulesUrl: "/models/rules/lunge_rule.json",
    dialogueUrl: "/models/dialogue/lunge_dialogue.json",
    sampleVideoUrl: "/test-videos/lunge.mp4",
  },
  {
    id: "sit_up",
    name: "3/4 Sit-up",
    bodyPart: "Waist",
    targetMuscle: "Abs",
    dbVariants: ["3/4 Sit-up"],
    cameraAngle: "SIDE",
    isTimed: false,
    rulesUrl: "/models/rules/sit_up_rule.json",
    dialogueUrl: "/models/dialogue/sit_up_dialogue.json",
    sampleVideoUrl: "/test-videos/sit_up.mp4",
  },
  {
    id: "plank",
    name: "Front Plank",
    bodyPart: "Waist",
    targetMuscle: "Abs",
    dbVariants: ["Front Plank with Twist", "Weighted Front Plank"],
    cameraAngle: "SIDE",
    isTimed: true,
    rulesUrl: "/models/rules/plank_rule.json",
    dialogueUrl: "/models/dialogue/plank_dialogue.json",
    sampleVideoUrl: "/test-videos/plank.mp4",
  },
];

export function buildTestMotionSpec(exercise: PoseTestExercise, modelUrl: string): MotionSpec {
  return {
    exerciseId: exercise.id,
    onnxDetectorUrl: modelUrl,
    onnxSkeletonUrl: modelUrl,
    localRulesUrl: exercise.rulesUrl,
    dialogueEngineUrl: exercise.dialogueUrl,
    recommendedCameraAngle: exercise.cameraAngle.toLowerCase(),
    romRange: { joints: ["shoulder", "elbow", "wrist"], startDeg: 0, endDeg: 0 },
    rep_type: exercise.isTimed ? "timed" : "rep",
    rules: [],
    cues: [],
    cueCooldownSec: {},
  };
}
