import type { LabFaqItem } from "@/features/lab/model/lab-catalog";

interface GlossaryTerm {
  id: string;
  term: string;
  category: "Biomechanics" | "Pose AI" | "Load & Recovery";
  definition: string;
  formulaOrThreshold: string;
  relatedPath: string;
  relatedLabel: string;
}

const LAB_GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  {
    id: "three-phase-rep-state-machine",
    term: "Three-Phase Rep State Machine (REST -> TRANSITION -> ACTIVE)",
    category: "Pose AI",
    definition:
      "Deterministic rep-counting state model used by FITAI across counted exercises. A repetition completes only after passing cleanly from standing/lockout readiness (REST), through mid-range movement (TRANSITION), to target joint depth (ACTIVE), and back.",
    formulaOrThreshold:
      "Example (Squat): knee_angle > 160° (REST) -> 100°–160° -> <= 100° (ACTIVE)",
    relatedPath: "/lab/squat",
    relatedLabel: "Inspect Squat thresholds",
  },
  {
    id: "one-euro-filter",
    term: "One-Euro Filter (Adaptive Keypoint Smoothing)",
    category: "Pose AI",
    definition:
      "Speed-adaptive low-pass filter (Casiez et al., CHI 2012) applied to noisy 2D COCO keypoints before joint angles are measured. It suppresses high-frequency jitter during isometric holds like Plank without introducing lag during rapid Squat or Push-up reps.",
    formulaOrThreshold: "Defaults: minCutoff = 1.0 Hz, beta = 0.007, dCutoff = 1.0 Hz",
    relatedPath: "/guides/on-device-pose-ai",
    relatedLabel: "On-Device Pose AI guide",
  },
  {
    id: "coco-17-keypoints",
    term: "COCO 17-Keypoint Body Skeleton",
    category: "Pose AI",
    definition:
      "Standard 17 anatomical landmarks (nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles) decoded locally inside the browser by ONNX Runtime Web from YOLOv8n-Pose or YOLO11n-Pose without sending raw camera video frames to the cloud.",
    formulaOrThreshold: "17 keypoints / frame evaluated locally via WebGL or WASM",
    relatedPath: "/lab",
    relatedLabel: "Browse 12 exercise specs",
  },
  {
    id: "calibration-gate",
    term: "Pre-Set Framing Calibration Gate",
    category: "Pose AI",
    definition:
      "Pre-set positioning check shown only while a live camera session is in the ready state prior to starting work. Once a set enters active execution, calibration never interrupts rep counting or timers.",
    formulaOrThreshold:
      "Triggers strictly when: cameraBranch && cameraOn && status === ready && !cameraReady",
    relatedPath: "/guides/camera-framing-calibration",
    relatedLabel: "Camera framing guide",
  },
  {
    id: "manual-logging-parity",
    term: "Complete Manual Logging Parity",
    category: "Load & Recovery",
    definition:
      "FITAI product guarantee that users without a camera, in tight spaces, or preferring privacy can log every session manually (sets, reps, timed holds, weight, and RPE) with full adaptive roadmap credit.",
    formulaOrThreshold: "100% session, PR, and weekly roadmap progression without mandatory camera",
    relatedPath: "/guides/4-week-adaptive-roadmap",
    relatedLabel: "4-Week Roadmap guide",
  },
  {
    id: "epley-1rm-formula",
    term: "Epley Estimated 1-Rep Max (1RM)",
    category: "Load & Recovery",
    definition:
      "Strength progression estimate computed on weighted sets to detect new personal records fairly across varying rep targets without testing risky single-rep maximums.",
    formulaOrThreshold: "1RM = weightKg * (1 + reps / 30), returns 0 for bodyweight sets",
    relatedPath: "/guides/epley-1rm-and-anomalous-load",
    relatedLabel: "Epley & Load Guard guide",
  },
  {
    id: "anomalous-load-guardrail",
    term: "250% Anomalous Load Guardrail (BR-WL-02)",
    category: "Load & Recovery",
    definition:
      "Safety and data-hygiene threshold that flags unusual session volume (> 250% of the mean volume across the last five comparable sessions) for user confirmation before saving, preventing typos from skewing adaptive planning.",
    formulaOrThreshold: "currentVolumeKg > recentAvgVolumeKg * 2.5 (skipped when baseline <= 0)",
    relatedPath: "/guides/epley-1rm-and-anomalous-load",
    relatedLabel: "Load Guardrail guide",
  },
  {
    id: "injury-guard-50-pr-cap",
    term: "Injury Guard & 50% PR Recovery Cap",
    category: "Load & Recovery",
    definition:
      "Automatic protection triggered when a user reports pain or injury: halts the active workout session, marks the affected anatomical region, swaps aggravating exercises, and caps recovery intensity at 50% PR.",
    formulaOrThreshold: "Session halt + anatomical swap + 50% PR upper load ceiling",
    relatedPath: "/guides/injury-guard-recovery",
    relatedLabel: "Injury Guard guide",
  },
  {
    id: "torso-lean-knee-over-toe",
    term: "Torso Lean & Knee-Over-Toe Guardrails",
    category: "Biomechanics",
    definition:
      "Side-profile angular and horizontal alignment bounds used in Squat and Lunge specs to classify posture into Correct, Warning, and Danger bands so real-time coaching cues fire before fatigue compromises form.",
    formulaOrThreshold: "Squat torso_lean: <= 42° Correct, 42°–52° Warning, > 52° Danger",
    relatedPath: "/lab/squat",
    relatedLabel: "Squat biomechanical spec",
  },
  {
    id: "signed-hip-y-diff",
    term: "Signed Hip Alignment Difference (signed_hip_y_diff)",
    category: "Biomechanics",
    definition:
      "Normalized vertical offset between the hips and the straight shoulder-to-ankle trunk line in horizontal core/push movements (Plank and Push-up), distinguishing hip sag from upward piking.",
    formulaOrThreshold: "Plank neutral band: <= 0.11 Correct, 0.11–0.20 Warning, > 0.20 Danger",
    relatedPath: "/lab/plank",
    relatedLabel: "Plank biomechanical spec",
  },
];

const LAB_GLOSSARY_FAQS: readonly LabFaqItem[] = [
  {
    question: "Are FITAI's biomechanical thresholds fixed or hidden inside a black-box AI model?",
    answer:
      "They are explicit, deterministic angular and alignment bounds read from public rule schemas, evaluated locally on smoothed 2D COCO keypoints so every cue is inspectable and repeatable.",
  },
  {
    question: "Why does FITAI combine a One-Euro Filter with persistence timers?",
    answer:
      "The One-Euro Filter smooths raw keypoint jitter without adding lag during fast movement transitions, while persistence and cooldown timers stop brief single-frame glitches from triggering false form warnings.",
  },
  {
    question: "Does FITAI calculate 1RM on bodyweight exercises?",
    answer:
      "No. Epley 1RM requires positive external load and repetition count (weightKg > 0 and reps > 0), while bodyweight movements track reps, hold duration, and RPE.",
  },
];

export { LAB_GLOSSARY_FAQS, LAB_GLOSSARY_TERMS };
export type { GlossaryTerm };
