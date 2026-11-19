import type { LabFaqItem } from "@/features/lab/model/lab-catalog";

interface GuideSection {
  questionHeading: string;
  directAnswer: string;
  bullets?: readonly string[];
}

interface KnowledgeGuide {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  lane: "Plan" | "Move" | "Recover";
  readTime: string;
  updatedAt: string;
  summaryPoints: readonly { label: string; value: string }[];
  sections: readonly GuideSection[];
  faqs: readonly LabFaqItem[];
}

const KNOWLEDGE_GUIDES: readonly KnowledgeGuide[] = [
  {
    slug: "4-week-adaptive-roadmap",
    title: "How FITAI Builds a 4-Week Adaptive Training Roadmap",
    kicker: "GUIDE 01 · PLAN",
    description:
      "How FITAI schedules up to 6 sessions per week, calibrates target RPE, and adjusts training volume around missed days or high fatigue without streak shaming.",
    lane: "Plan",
    readTime: "4 min read",
    updatedAt: "2026-11-14",
    summaryPoints: [
      { label: "Cycle Horizon", value: "4 Weeks (Week / Day / Session)" },
      { label: "Weekly Session Cap", value: "Max 6 sessions / week" },
      { label: "Adaptation Signals", value: "RPE, missed slots, injury status" },
      { label: "Streak Policy", value: "Zero punishment for adaptive rest" },
    ],
    sections: [
      {
        questionHeading: "What goes into generating a 4-week FITAI roadmap?",
        directAnswer:
          "FITAI uses your completed health profile, primary goal, weekly availability, available equipment, and safety constraints to build a four-week schedule capped at six sessions per week. Every session arrives with a clear target RPE and prescription before you warm up.",
        bullets: [
          "Health profile completion threshold gates unsafe plan generation.",
          "Real calendar placement avoids stacked max-effort days.",
          "Daily nutrition calorie and macro targets align with your active goal.",
        ],
      },
      {
        questionHeading: "How does the roadmap adapt when you miss a day or report high RPE?",
        directAnswer:
          "Each logged workout feeds evidence back into the planner. When reported RPE spikes above target or a slot shifts, FITAI tapers upcoming load and intensity rather than forcing catch-up double sessions or resetting progress with shame-based streaks.",
      },
    ],
    faqs: [
      {
        question: "Why is a FITAI roadmap capped at four weeks and six sessions?",
        answer:
          "Four weeks gives enough time to measure real progression from Week 1 baseline through deload or intensification while keeping adherence realistic at up to six safe sessions per week.",
      },
      {
        question: "What happens if I miss two workouts in a busy week?",
        answer:
          "FITAI shifts remaining priority sessions across your open slots and preserves weekly rhythm without penalty streaks.",
      },
      {
        question: "Do I have to follow AI nutrition targets to use the roadmap?",
        answer:
          "No. Workout planning and nutrition logging work together, but you can log workouts independently or pair them with meal slots.",
      },
    ],
  },
  {
    slug: "on-device-pose-ai",
    title: "On-Device Pose Estimation & 3-Phase Rep Referee Architecture",
    kicker: "GUIDE 02 · MOVE",
    description:
      "Technical overview of FITAI browser-side pose detection using YOLOv8n/YOLO11n ONNX models, One-Euro smoothing, 3-phase rep state machine, and manual parity.",
    lane: "Move",
    readTime: "5 min read",
    updatedAt: "2026-11-14",
    summaryPoints: [
      { label: "Runtime", value: "ONNX Runtime Web (WASM / WebGL)" },
      { label: "Models", value: "YOLOv8n-Pose / YOLO11n-Pose (17 keypoints)" },
      { label: "Smoothing", value: "One-Euro Filter + persistence guard" },
      { label: "Fallback", value: "100% Manual Logging Parity" },
    ],
    sections: [
      {
        questionHeading: "How does FITAI count reps and score form in the browser?",
        directAnswer:
          "FITAI decodes 17 COCO body keypoints locally via ONNX Runtime Web, smooths landmark jitter with a One-Euro Filter, and runs a 3-phase state machine (REST -> TRANSITION -> ACTIVE) against exercise-specific biomechanical angle rules.",
        bullets: [
          "Angles are computed directly from 2D joint vectors using arccos and atan2.",
          "Persistence filtering prevents false error alerts from single-frame noise.",
          "Cooldown timers separate warning and danger voice cues.",
        ],
      },
      {
        questionHeading: "What happens if camera permissions or lighting are poor?",
        directAnswer:
          "Live workout sessions always keep a complete Manual Mode path available. You can log sets, reps, timed holds, and RPE directly without camera input and earn full session credit in your roadmap.",
      },
    ],
    faqs: [
      {
        question: "Does FITAI upload my workout camera video to the cloud?",
        answer:
          "Pose inference models run directly on-device inside your browser via ONNX Runtime Web so raw camera frames stay local during form analysis.",
      },
      {
        question: "Why use a One-Euro Filter on pose keypoints?",
        answer:
          "The One-Euro Filter reduces high-frequency landmark jitter when holding still (such as Plank) while keeping low latency during fast Squat or Push-up transitions.",
      },
      {
        question: "How many exercises have biomechanical rule specs in FITAI?",
        answer:
          "Twelve core exercises ship with explicit angle thresholds and coaching cues in the Movement Lab, alongside manual tracking for full workout routines.",
      },
    ],
  },
  {
    slug: "injury-guard-recovery",
    title: "Injury Guard: Automatic Load Caps & Safe Movement Swaps",
    kicker: "GUIDE 03 · RECOVER",
    description:
      "How FITAI protects sore joints and active injuries by stopping high-risk sessions, applying a 50% PR cap, and substituting affected muscle groups.",
    lane: "Recover",
    readTime: "4 min read",
    updatedAt: "2026-11-14",
    summaryPoints: [
      { label: "Trigger", value: "User-reported soreness or injury" },
      { label: "Active Workout", value: "Halts session immediately" },
      { label: "Load Cap", value: "50% PR Cap during guard window" },
      { label: "Medical Scope", value: "Fitness guidance, not diagnosis" },
    ],
    sections: [
      {
        questionHeading: "What happens immediately when you report an injury in FITAI?",
        directAnswer:
          "Reporting an active injury stops the current workout immediately and routes you toward recovery and schedule adjustment. FITAI marks affected muscle groups on your anatomical map, caps load at 50% PR across upcoming recovery sessions, and swaps aggravating movements.",
      },
      {
        questionHeading: "Does FITAI diagnose medical conditions?",
        directAnswer:
          "No. FITAI explicitly operates as fitness and training guidance, not medical diagnosis or clinical rehabilitation. When pain or injury is flagged, it prioritizes conservative load reduction and advises consulting a qualified clinician for persistent symptoms.",
      },
    ],
    faqs: [
      {
        question: "How does Injury Guard decide which exercises to swap?",
        answer:
          "Exercises loading the flagged anatomical muscle region are replaced with low-stress alternatives outside the injured joint path while preserving safe surrounding training.",
      },
      {
        question: "Does reporting an injury ruin my progress history?",
        answer:
          "No. FITAI treats recovery adjustments as evidence-based adaptation rather than failure.",
      },
      {
        question: "Can I manually resume full load when I feel recovered?",
        answer:
          "Yes. You remain in full control of your schedule and can confirm readiness before lifting recovery guardrails.",
      },
    ],
  },
  {
    slug: "camera-framing-calibration",
    title: "Side vs. Front Camera Setup & Framing Calibration for 12 Exercises",
    kicker: "GUIDE 04 · SETUP",
    description:
      "How camera orientation maps to FITAI's 12 biomechanical specs, why framing calibration only runs pre-set, and when to switch smoothly to Manual Mode.",
    lane: "Move",
    readTime: "4 min read",
    updatedAt: "2026-11-15",
    summaryPoints: [
      { label: "Side-Profile Specs", value: "Squat, Deadlift, Lunge, Curl, Sit-up, Dip" },
      { label: "Front-Profile Spec", value: "Lateral Raise (shoulder abduction symmetry)" },
      { label: "Dual-Angle Specs", value: "Push-up, Plank, Bench, Pull-up, Shoulder Press" },
      { label: "Calibration Window", value: "Pre-set ready state only (never mid-set)" },
    ],
    sections: [
      {
        questionHeading: "Should I set my phone at a side or front angle?",
        directAnswer:
          "Choose side profile when the primary rule checks spine, hip, or knee travel in the sagittal plane (Squat, Deadlift, Lunge, Bicep Curl, Sit-up, Triceps Dip). Choose front profile for wrist or abduction symmetry checks (Lateral Raise), while Push-up, Plank, Bench Press, Pull-up, and Shoulder Press support both angles.",
        bullets: [
          "Keep full ankle-to-head visibility inside frame during pre-set framing.",
          "Contrast clothing subtly against the background for steadier 17-keypoint detection.",
          "Place the camera at roughly hip-to-chest height two to three meters away.",
        ],
      },
      {
        questionHeading: "Why does FITAI never re-lock the screen for calibration mid-set?",
        directAnswer:
          "Calibration is strictly a pre-set gate active while session status is ready and camera readiness is still false. Once your working set starts, FITAI locks out full-screen calibration prompts so timers and rep counts continue uninterrupted.",
      },
    ],
    faqs: [
      {
        question: "Which exercises in FITAI work best from a side camera angle?",
        answer:
          "Squat, Deadlift, Lunge, Bicep Curl, Sit-up, and Triceps Dip are calibrated primarily for side-profile evaluation of torso lean, hip hinge, and knee travel.",
      },
      {
        question: "Can I switch off the camera mid-workout?",
        answer:
          "Yes. Disabling the camera preview bypasses the framing gate immediately and lets you finish logging reps, timed holds, and RPE with Manual Logging Parity.",
      },
      {
        question: "Why does Lateral Raise prefer a front camera angle?",
        answer:
          "Lateral Raise evaluates bilateral shoulder abduction height and left-right wrist symmetry across the coronal plane, which are cleanly visible from the front.",
      },
    ],
  },
  {
    slug: "epley-1rm-and-anomalous-load",
    title: "Evidence-Based Load Tracking: Epley 1RM & 250% Anomaly Guard",
    kicker: "GUIDE 05 · PROGRESS",
    description:
      "How FITAI calculates session volume in kg, estimates 1-rep max via the Epley formula without risky testing, and flags > 250% volume spikes before saving.",
    lane: "Plan",
    readTime: "4 min read",
    updatedAt: "2026-11-15",
    summaryPoints: [
      { label: "Set Volume", value: "max(0, reps) * max(0, weightKg)" },
      { label: "PR Metric", value: "Epley 1RM = weight * (1 + reps / 30)" },
      { label: "Anomaly Threshold", value: "> 250% mean of last 5 sessions" },
      { label: "Zero-Baseline Safety", value: "Never blocks bodyweight or Day 1 logs" },
    ],
    sections: [
      {
        questionHeading: "How does FITAI detect Personal Records without testing 1-rep maxes?",
        directAnswer:
          "For weighted exercises where both load and reps are positive, FITAI applies the standard Epley formula (weightKg * (1 + reps / 30)) across every completed set in your session and tracks the highest estimated 1RM per exercise.",
        bullets: [
          "Repetition-based progress at submaximal weights updates your estimated strength ceiling safely.",
          "Bodyweight exercises (0 kg external load) return 0 for Epley 1RM and measure progress via reps, hold time, and RPE instead.",
        ],
      },
      {
        questionHeading: "What is the 250% Anomalous Load Guardrail?",
        directAnswer:
          "Before persisting a weighted workout summary, FITAI compares total session volume against the mean of your last five comparable sessions. If current volume exceeds 250% (ratio > 2.5), the app asks you to confirm the numbers so accidental weight typos (like 200 kg instead of 20 kg) never corrupt your 4-week plan.",
      },
    ],
    faqs: [
      {
        question: "Does the 250% load check block beginners on their first workout?",
        answer:
          "No. When recent comparable session volume is zero (such as first sessions or bodyweight-only blocks), the anomaly guard explicitly returns false and never blocks saving.",
      },
      {
        question: "What formula does FITAI use for weighted set volume?",
        answer:
          "Each set's volume is calculated as max(0, actualReps) multiplied by max(0, weightKg), summed across all logged sets in the session.",
      },
      {
        question: "How does Epley 1RM help progressive overload across 4 weeks?",
        answer:
          "Because 8 reps at 60 kg (76 kg est. 1RM) and 10 reps at 57.5 kg (76.7 kg est. 1RM) map onto a shared scale, the adaptive planner recognizes strength gains even when weekly rep targets shift.",
      },
    ],
  },
];

function getGuideBySlug(slug: string): KnowledgeGuide | null {
  return KNOWLEDGE_GUIDES.find((g) => g.slug === slug) ?? null;
}

export { getGuideBySlug, KNOWLEDGE_GUIDES };
export type { GuideSection, KnowledgeGuide };
