import type { LabFaqItem } from "@/features/lab/model/lab-catalog";

const LANDING_FAQS: readonly LabFaqItem[] = [
  {
    question: "What does FITAI include for free?",
    answer:
      "FITAI builds personalized four-week adaptive workout and nutrition roadmaps (capped at up to six sessions per week), includes live on-device biomechanical form checks across 12 core exercises with full manual logging parity, and lets you inspect every exercise spec publicly in the Movement Lab.",
  },
  {
    question: "Does FITAI upload my workout camera video to the cloud?",
    answer:
      "No. Pose estimation runs directly in your browser using YOLOv8n-Pose or YOLO11n-Pose via ONNX Runtime Web, smoothing 17 COCO keypoints with a One-Euro Filter without streaming raw camera video to an external inference server.",
  },
  {
    question: "Which 12 exercises have live biomechanical angle and form rules?",
    answer:
      "Squat, Push-up, Plank, Deadlift, Lunge, Barbell Bench Press, Bicep Curl, Lateral Raise, Pull-up, Shoulder Press, Sit-up, and Triceps Dip each ship with inspectable phase thresholds and form guardrails.",
  },
  {
    question: "What happens if I miss a workout day or report pain?",
    answer:
      "Missed sessions shift calmly across your remaining calendar availability with zero penalty streaks. Reporting active soreness or injury halts the session immediately, swaps affected exercises, and caps recovery load at 50% PR (fitness guidance only, not medical diagnosis).",
  },
];

export { LANDING_FAQS };
