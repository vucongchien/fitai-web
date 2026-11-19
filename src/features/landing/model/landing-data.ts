type LaneKey = "plan" | "move" | "recover";

interface TripleLaneItem {
  time: string;
  title: string;
  detail: string;
  state: "complete" | "next" | "planned";
}

interface TripleLanePhase {
  id: LaneKey;
  step: string;
  label: string;
  badge: string;
  headline: string;
  summary: string;
  metricLabel: string;
  metricValue: string;
  items: readonly TripleLaneItem[];
}

type RepPhaseKey = "REST" | "TRANSITION" | "ACTIVE";
type FormModeKey = "clean" | "warning" | "manual";
type ExerciseRuleId = "squat" | "push_up" | "plank";

interface JointPoint {
  id: number;
  label: string;
  x: number;
  y: number;
}

interface ExercisePhaseFrame {
  phase: RepPhaseKey;
  phaseLabel: string;
  primaryAngleLabel: string;
  primaryAngleDeg: number;
  secondaryMetricLabel: string;
  secondaryMetricClean: string;
  secondaryMetricWarning: string;
  thresholdRule: string;
  formula: string;
  cleanCue: string;
  warningCue: string;
  manualCue: string;
  warningJointIds: readonly number[];
  jointsClean: readonly JointPoint[];
  jointsWarning: readonly JointPoint[];
  angleArc: { ax: number; ay: number; bx: number; by: number; cx: number; cy: number };
}

interface BiomechanicalExerciseSpec {
  id: ExerciseRuleId;
  name: string;
  repType: "counted" | "timed";
  cameraView: string;
  summary: string;
  phases: Record<RepPhaseKey, ExercisePhaseFrame>;
}

type AdaptiveSignalId = "baseline" | "high-rpe" | "missed-slot" | "injury-guard";

interface RoadmapWeekSummary {
  week: number;
  phaseName: string;
  targetRpe: number;
  sessionsCount: number;
  intensityPercent: number;
  status: "done" | "current" | "adjusted" | "upcoming";
}

interface AdaptiveSessionSlot {
  day: string;
  time: string;
  title: string;
  prescription: string;
  status: "complete" | "next" | "adjusted" | "rest";
}

interface AdaptiveSignalScenario {
  id: AdaptiveSignalId;
  triggerLabel: string;
  badgeText: string;
  tone: LaneKey;
  coachNoteTitle: string;
  coachNoteBody: string;
  weeks: readonly RoadmapWeekSummary[];
  sessions: readonly AdaptiveSessionSlot[];
}

interface BodyZoneFocusInfo {
  id: "full" | "upper" | "core" | "lower";
  label: string;
  focusGroups: readonly string[];
  activeCue: string;
  loadScoreLabel: string;
  sessionsSplit: string;
}

interface InjuryGuardSimulation {
  injuredRegionLabel: string;
  injuredMuscleGroups: readonly string[];
  guardDurationText: string;
  loadCapText: string;
  replacedExercise: string;
  safeAlternative: string;
  explanation: string;
}

type Coord = readonly [number, number];

interface JointCoordsInput {
  shoulder: Coord;
  elbow: Coord;
  wrist: Coord;
  hip: Coord;
  knee: Coord;
  ankle: Coord;
  head: Coord;
}

function makeJoints(c: JointCoordsInput): readonly JointPoint[] {
  const torsoMidX = Math.round((c.shoulder[0] + c.hip[0]) / 2);
  const torsoMidY = Math.round((c.shoulder[1] + c.hip[1]) / 2);
  return [
    { id: 0, label: "Shoulder", x: c.shoulder[0], y: c.shoulder[1] },
    { id: 1, label: "Elbow", x: c.elbow[0], y: c.elbow[1] },
    { id: 2, label: "Wrist", x: c.wrist[0], y: c.wrist[1] },
    { id: 3, label: "Hip", x: c.hip[0], y: c.hip[1] },
    { id: 4, label: "Knee", x: c.knee[0], y: c.knee[1] },
    { id: 5, label: "Ankle", x: c.ankle[0], y: c.ankle[1] },
    { id: 6, label: "Head", x: c.head[0], y: c.head[1] },
    { id: 7, label: "Torso Mid", x: torsoMidX, y: torsoMidY },
  ];
}

const TRIPLE_LANE_PHASES: readonly TripleLanePhase[] = [
  {
    id: "plan",
    step: "01",
    label: "Plan",
    badge: "UC-02 · 4-Week Route",
    headline: "A weekly route paced to your real calendar",
    summary:
      "FitAI places sessions on real training days, capped at safe weekly volume with clear target RPE before you warm up.",
    metricLabel: "Week 1 Adherence",
    metricValue: "4 / 4 slots",
    items: [
      {
        time: "07:15",
        title: "Morning readiness check",
        detail: "Target RPE 6.5 · 35 min lower focus",
        state: "complete",
      },
      {
        time: "18:00",
        title: "Lower & Core Control",
        detail: "Squat 3×12 · Plank 3×45s · 3-1-1 tempo",
        state: "next",
      },
      {
        time: "20:00",
        title: "Protein & hydration anchor",
        detail: "135g daily target · Recovery window open",
        state: "planned",
      },
    ],
  },
  {
    id: "move",
    step: "02",
    label: "Move",
    badge: "UC-03 · Form & Manual",
    headline: "17-keypoint form rules with complete manual parity",
    summary:
      "On-device pose detection tracks joint angles and rep states locally—or switch to Manual Mode anytime with full workout credit.",
    metricLabel: "Live Form Signal",
    metricValue: "87° Knee · Clean",
    items: [
      {
        time: "Set 1",
        title: "Squat · 12 / 12 reps",
        detail: "Knee ≤100° · Torso lean 35° (Correct)",
        state: "complete",
      },
      {
        time: "Set 2",
        title: "Push-up · Live form cue",
        detail: "Elbow ≤98° · Hip alignment ≤0.26",
        state: "next",
      },
      {
        time: "Set 3",
        title: "Plank · Timed hold",
        detail: "45s target · Manual timer always available",
        state: "planned",
      },
    ],
  },
  {
    id: "recover",
    step: "03",
    label: "Recover",
    badge: "UC-04 · Adaptive Guard",
    headline: "Volume adapts before fatigue becomes setback",
    summary:
      "When reported RPE spikes, a session shifts, or a joint flags soreness, FitAI tapers intensity and swaps unsafe loads without punishing your streak.",
    metricLabel: "Active Guard",
    metricValue: "50% PR Cap · 3 sessions",
    items: [
      {
        time: "Signal",
        title: "Reported RPE 9.2 / 10",
        detail: "Upper push fatigue flagged after Set 3",
        state: "complete",
      },
      {
        time: "Replan",
        title: "Next load stepped down -15%",
        detail: "Target RPE eased from 8.0 to 6.5",
        state: "next",
      },
      {
        time: "Protect",
        title: "Streak & weekly rhythm intact",
        detail: "Adaptive rest slots carry zero adherence penalty",
        state: "planned",
      },
    ],
  },
];

// Joint IDs: 0=shoulder, 1=elbow, 2=wrist, 3=hip, 4=knee, 5=ankle, 6=head, 7=torsoMid
const SKELETON_BONE_PAIRS: readonly (readonly [number, number])[] = [
  [6, 0],
  [0, 7],
  [7, 3],
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 5],
];

const BIOMECHANICAL_EXERCISES: readonly BiomechanicalExerciseSpec[] = [
  {
    id: "squat",
    name: "Squat",
    repType: "counted",
    cameraView: "Side profile",
    summary:
      "Tracks hip-knee-ankle flexion to detect rep bottom while guarding lumbar spine lean and forward knee travel.",
    phases: {
      REST: {
        phase: "REST",
        phaseLabel: "Standing Readiness (>160°)",
        primaryAngleLabel: "Knee Angle",
        primaryAngleDeg: 172,
        secondaryMetricLabel: "Torso Lean",
        secondaryMetricClean: "6° (≤42° Correct)",
        secondaryMetricWarning: "19° (Pre-hinge drift)",
        thresholdRule: "REST: knee_angle > 160° · torso_lean ≤ 42°",
        formula: "θ = arccos((U · W) / (||U|| * ||W||)) * (180 / π)",
        cleanCue: "Tall stance locked over midfoot; ready to initiate descent.",
        warningCue: "Stack ribs over pelvis before descending; avoid early forward drift.",
        manualCue: "Manual mode active: tap +1 set or log 3×12 reps directly without camera.",
        warningJointIds: [0, 7],
        jointsClean: makeJoints({
          shoulder: [156, 42],
          elbow: [162, 68],
          wrist: [166, 94],
          hip: [150, 100],
          knee: [153, 144],
          ankle: [150, 188],
          head: [158, 24],
        }),
        jointsWarning: makeJoints({
          shoulder: [170, 46],
          elbow: [176, 72],
          wrist: [178, 98],
          hip: [150, 100],
          knee: [153, 144],
          ankle: [150, 188],
          head: [174, 28],
        }),
        angleArc: { ax: 150, ay: 100, bx: 153, by: 144, cx: 150, cy: 188 },
      },
      TRANSITION: {
        phase: "TRANSITION",
        phaseLabel: "Controlled Descent (100–160°)",
        primaryAngleLabel: "Knee Angle",
        primaryAngleDeg: 115,
        secondaryMetricLabel: "Torso Lean",
        secondaryMetricClean: "30° (≤42° Correct)",
        secondaryMetricWarning: "49° (42–52° Warning)",
        thresholdRule: "TRANSITION: 100° < knee_angle ≤ 160° · torso_lean 42–52° Warning",
        formula: "torso_lean = atan2(|X_shoulder - X_hip|, |Y_shoulder - Y_hip|) * (180 / π)",
        cleanCue: "Knees track cleanly while chest stays proud inside the 42° torso corridor.",
        warningCue: "Open chest and keep torso taller while lowering hips toward depth.",
        manualCue: "Manual mode active: self-pace 3-1-1 descent and record target RPE (6–8).",
        warningJointIds: [0, 7, 3],
        jointsClean: makeJoints({
          shoulder: [162, 64],
          elbow: [184, 72],
          wrist: [204, 68],
          hip: [132, 116],
          knee: [164, 147],
          ankle: [150, 188],
          head: [168, 46],
        }),
        jointsWarning: makeJoints({
          shoulder: [172, 76],
          elbow: [190, 90],
          wrist: [206, 94],
          hip: [126, 116],
          knee: [168, 147],
          ankle: [150, 188],
          head: [184, 62],
        }),
        angleArc: { ax: 132, ay: 116, bx: 164, by: 147, cx: 150, cy: 188 },
      },
      ACTIVE: {
        phase: "ACTIVE",
        phaseLabel: "Parallel Depth (≤100°)",
        primaryAngleLabel: "Knee Angle",
        primaryAngleDeg: 87,
        secondaryMetricLabel: "Torso Lean",
        secondaryMetricClean: "35° (≤42° Correct)",
        secondaryMetricWarning: "57° (>52° Danger)",
        thresholdRule: "ACTIVE: knee_angle ≤ 100° · torso_lean > 52° Danger",
        formula: "knee_over_toe = |X_knee - X_ankle| / torso_length (≤0.38 safe)",
        cleanCue: "Full parallel depth reached with balanced hip-to-ankle center of mass.",
        warningCue: "Danger: excessive forward torso lean (>52°). Drive chest up out of the hole.",
        manualCue: "Manual mode active: mark completed reps and rate session fatigue in 2 taps.",
        warningJointIds: [0, 7, 3, 4],
        jointsClean: makeJoints({
          shoulder: [158, 86],
          elbow: [184, 92],
          wrist: [208, 88],
          hip: [124, 134],
          knee: [166, 148],
          ankle: [150, 188],
          head: [164, 68],
        }),
        jointsWarning: makeJoints({
          shoulder: [168, 102],
          elbow: [188, 118],
          wrist: [204, 124],
          hip: [118, 134],
          knee: [176, 150],
          ankle: [150, 188],
          head: [182, 90],
        }),
        angleArc: { ax: 124, ay: 134, bx: 166, by: 148, cx: 150, cy: 188 },
      },
    },
  },
  {
    id: "push_up",
    name: "Push-up",
    repType: "counted",
    cameraView: "Side profile",
    summary:
      "Evaluates elbow flexion depth against shoulder-hip-ankle line deviation to prevent lumbar sag or piking.",
    phases: {
      REST: {
        phase: "REST",
        phaseLabel: "High Plank Lockout (>148°)",
        primaryAngleLabel: "Elbow Angle",
        primaryAngleDeg: 173,
        secondaryMetricLabel: "Hip Line Drift",
        secondaryMetricClean: "0.00 (≤0.26 Correct)",
        secondaryMetricWarning: "0.37 (>0.35 Danger)",
        thresholdRule: "REST: elbow_angle > 148° · signed_hip_y_diff ≤ 0.26",
        formula: "signed_hip_y_diff = dist(P_hip, line(P_shoulder, P_ankle)) / torso_length",
        cleanCue: "Straight rigid line from shoulders through hips to ankles.",
        warningCue: "Brace abs and glutes; stop hip sag before lowering into the rep.",
        manualCue: "Manual mode active: log bodyweight push-up sets with rest timer cues.",
        warningJointIds: [3, 7],
        jointsClean: makeJoints({
          shoulder: [226, 106],
          elbow: [231, 140],
          wrist: [238, 174],
          hip: [140, 139],
          knee: [97, 156],
          ankle: [54, 172],
          head: [248, 96],
        }),
        jointsWarning: makeJoints({
          shoulder: [226, 106],
          elbow: [231, 140],
          wrist: [238, 174],
          hip: [140, 184],
          knee: [97, 178],
          ankle: [54, 172],
          head: [248, 96],
        }),
        angleArc: { ax: 226, ay: 106, bx: 231, by: 140, cx: 238, cy: 174 },
      },
      TRANSITION: {
        phase: "TRANSITION",
        phaseLabel: "Eccentric Lowering (98–148°)",
        primaryAngleLabel: "Elbow Angle",
        primaryAngleDeg: 119,
        secondaryMetricLabel: "Hip Line Drift",
        secondaryMetricClean: "0.00 (≤0.26 Correct)",
        secondaryMetricWarning: "0.36 (>0.35 Danger)",
        thresholdRule: "TRANSITION: 98° < elbow_angle ≤ 148° · signed_hip_y_diff > 0.35 Danger",
        formula: "θ_elbow = arccos((U · W) / (||U|| * ||W||)) * (180 / π)",
        cleanCue: "Elbows track back at ~45° as torso lowers as one solid plank.",
        warningCue: "Hips dropping ahead of chest; keep pelvis tucked with ribcage.",
        manualCue: "Manual mode active: tap set complete or swap to incline variation anytime.",
        warningJointIds: [3, 7, 1],
        jointsClean: makeJoints({
          shoulder: [228, 122],
          elbow: [218, 152],
          wrist: [238, 174],
          hip: [141, 147],
          knee: [98, 160],
          ankle: [54, 172],
          head: [252, 114],
        }),
        jointsWarning: makeJoints({
          shoulder: [228, 122],
          elbow: [218, 152],
          wrist: [238, 174],
          hip: [141, 188],
          knee: [98, 180],
          ankle: [54, 172],
          head: [252, 114],
        }),
        angleArc: { ax: 228, ay: 122, bx: 218, by: 152, cx: 238, cy: 174 },
      },
      ACTIVE: {
        phase: "ACTIVE",
        phaseLabel: "Chest-to-Floor Bottom (≤98°)",
        primaryAngleLabel: "Elbow Angle",
        primaryAngleDeg: 82,
        secondaryMetricLabel: "Hip Line Drift",
        secondaryMetricClean: "0.00 (≤0.26 Correct)",
        secondaryMetricWarning: "0.38 (>0.35 Danger)",
        thresholdRule: "ACTIVE: elbow_angle ≤ 98° · signed_hip_y_diff ≤ 0.26 safe",
        formula: "hand_width_ratio = |X_wrist_L - X_wrist_R| / |X_shoulder_L - X_shoulder_R|",
        cleanCue: "Bottom depth confirmed (82°); press evenly through palms to finish rep.",
        warningCue: "Danger: lower-back sag (>0.35). Tighten core before pressing up.",
        manualCue: "Manual mode active: full rep credit preserved when training off-camera.",
        warningJointIds: [3, 7],
        jointsClean: makeJoints({
          shoulder: [236, 134],
          elbow: [214, 152],
          wrist: [238, 174],
          hip: [145, 153],
          knee: [100, 163],
          ankle: [54, 172],
          head: [260, 128],
        }),
        jointsWarning: makeJoints({
          shoulder: [236, 134],
          elbow: [214, 152],
          wrist: [238, 174],
          hip: [145, 194],
          knee: [100, 183],
          ankle: [54, 172],
          head: [260, 128],
        }),
        angleArc: { ax: 236, ay: 134, bx: 214, by: 152, cx: 238, cy: 174 },
      },
    },
  },
  {
    id: "plank",
    name: "Plank",
    repType: "timed",
    cameraView: "Side profile",
    summary:
      "Timed isometric hold gated by horizontal body incline (≤35°), elbow stacking (70–110°), and strict hip drift bounds.",
    phases: {
      REST: {
        phase: "REST",
        phaseLabel: "Setup / Idle (>35°)",
        primaryAngleLabel: "Body Incline",
        primaryAngleDeg: 39,
        secondaryMetricLabel: "Hip Drift",
        secondaryMetricClean: "0.00 (≤0.11 Correct)",
        secondaryMetricWarning: "0.22 (>0.20 Danger)",
        thresholdRule: "IDLE: body_incline_angle > 35° (timer paused until horizontal)",
        formula: "θ_incline = |atan2(Y_shoulder - Y_ankle, X_shoulder - X_ankle)| * (180 / π)",
        cleanCue: "Setup pose detected (>35°); lower hips into line to start hold timer.",
        warningCue: "Avoid sagging through the lumbar curve as you settle onto forearms.",
        manualCue: "Manual mode active: tap Start Hold to run the 45s countdown timer.",
        warningJointIds: [3, 7],
        jointsClean: makeJoints({
          shoulder: [206, 58],
          elbow: [216, 92],
          wrist: [244, 96],
          hip: [135, 116],
          knee: [100, 145],
          ankle: [64, 174],
          head: [228, 44],
        }),
        jointsWarning: makeJoints({
          shoulder: [206, 58],
          elbow: [216, 92],
          wrist: [244, 96],
          hip: [135, 148],
          knee: [100, 161],
          ankle: [64, 174],
          head: [228, 44],
        }),
        angleArc: { ax: 206, ay: 58, bx: 64, by: 174, cx: 144, cy: 174 },
      },
      TRANSITION: {
        phase: "TRANSITION",
        phaseLabel: "Settling into Hold (25–35°)",
        primaryAngleLabel: "Body Incline",
        primaryAngleDeg: 26,
        secondaryMetricLabel: "Hip Drift",
        secondaryMetricClean: "0.00 (≤0.11 Correct)",
        secondaryMetricWarning: "0.28 (>0.20 Danger)",
        thresholdRule: "ALIGN: body_incline_angle 25–35° Warning · ≤25° Optimal",
        formula: "arm_to_torso_angle = arccos((U · W) / (||U|| * ||W||)) * (180 / π)",
        cleanCue: "Timer engaged (≤35°); drop slightly flatter to reach optimal ≤25° zone.",
        warningCue: "Hips dipping below shoulder-ankle axis; brace anterior core now.",
        manualCue: "Manual mode active: hold steady breathing cadence while timer ticks.",
        warningJointIds: [3, 7, 1],
        jointsClean: makeJoints({
          shoulder: [220, 96],
          elbow: [220, 134],
          wrist: [248, 140],
          hip: [140, 135],
          knee: [100, 155],
          ankle: [60, 174],
          head: [244, 86],
        }),
        jointsWarning: makeJoints({
          shoulder: [220, 96],
          elbow: [220, 134],
          wrist: [248, 140],
          hip: [140, 168],
          knee: [100, 171],
          ankle: [60, 174],
          head: [244, 86],
        }),
        angleArc: { ax: 220, ay: 96, bx: 60, by: 174, cx: 140, cy: 174 },
      },
      ACTIVE: {
        phase: "ACTIVE",
        phaseLabel: "Timed Hold Active (≤25°)",
        primaryAngleLabel: "Body Incline",
        primaryAngleDeg: 11,
        secondaryMetricLabel: "Hip Drift",
        secondaryMetricClean: "0.00 (≤0.11 Correct)",
        secondaryMetricWarning: "0.34 (>0.20 Danger)",
        thresholdRule: "HOLD: body_incline_angle ≤ 25° · signed_hip_y_diff ≤ 0.11 Correct",
        formula: "signed_hip_y_diff = signed_dist(P_hip, P_shoulder, P_ankle) / torso_length",
        cleanCue: "Locked horizontal hold: elbows stacked at 83° and neutral pelvis.",
        warningCue: "Danger: hip sag >0.20 detected. Tuck tailbone and press forearms down.",
        manualCue: "Manual mode active: record completed hold seconds into today's session.",
        warningJointIds: [3, 7],
        jointsClean: makeJoints({
          shoulder: [224, 140],
          elbow: [220, 172],
          wrist: [252, 172],
          hip: [141, 156],
          knee: [100, 164],
          ankle: [58, 172],
          head: [248, 132],
        }),
        jointsWarning: makeJoints({
          shoulder: [224, 140],
          elbow: [220, 172],
          wrist: [252, 172],
          hip: [141, 190],
          knee: [100, 181],
          ankle: [58, 172],
          head: [248, 132],
        }),
        angleArc: { ax: 224, ay: 140, bx: 58, by: 172, cx: 138, cy: 172 },
      },
    },
  },
];

const SUPPORTED_EXERCISES_LIST: readonly string[] = [
  "Squat",
  "Push-up",
  "Plank",
  "Lunge",
  "Deadlift",
  "Bench Press",
  "Bicep Curl",
  "Shoulder Press",
  "Pull-up",
  "Sit-up",
  "Lateral Raise",
  "Triceps Dip",
];

const ADAPTIVE_ROADMAP_SIGNALS: readonly AdaptiveSignalScenario[] = [
  {
    id: "baseline",
    triggerLabel: "On Track",
    badgeText: "Baseline Progression",
    tone: "plan",
    coachNoteTitle: "Steady build from Foundation to Deload",
    coachNoteBody:
      "Completed sets matched target RPE 6.5–7.5 with clean form scores. Your 4-week volume ramps predictably and caps at 5 sessions/week.",
    weeks: [
      {
        week: 1,
        phaseName: "Foundation",
        targetRpe: 6.5,
        sessionsCount: 4,
        intensityPercent: 68,
        status: "done",
      },
      {
        week: 2,
        phaseName: "Accumulation",
        targetRpe: 7.2,
        sessionsCount: 4,
        intensityPercent: 78,
        status: "current",
      },
      {
        week: 3,
        phaseName: "Intensification",
        targetRpe: 8,
        sessionsCount: 5,
        intensityPercent: 86,
        status: "upcoming",
      },
      {
        week: 4,
        phaseName: "Deload",
        targetRpe: 6,
        sessionsCount: 3,
        intensityPercent: 58,
        status: "upcoming",
      },
    ],
    sessions: [
      {
        day: "Mon",
        time: "18:00",
        title: "Lower & Squat Mechanics",
        prescription: "Squat 3×12 · Lunge 3×10 · Plank 3×45s",
        status: "complete",
      },
      {
        day: "Wed",
        time: "18:00",
        title: "Upper Push & Core",
        prescription: "Push-up 4×10 · Shoulder Press 3×10 · Sit-up 3×15",
        status: "next",
      },
      {
        day: "Thu",
        time: "Rest",
        title: "Active Recovery & Walk",
        prescription: "20 min low-strain mobility",
        status: "rest",
      },
      {
        day: "Fri",
        time: "18:30",
        title: "Posterior Chain & Pull",
        prescription: "Deadlift 3×8 · Pull-up 3×6 · Bicep Curl 3×12",
        status: "next",
      },
    ],
  },
  {
    id: "high-rpe",
    triggerLabel: "High RPE Fatigue",
    badgeText: "Load Tapered -15%",
    tone: "move",
    coachNoteTitle: "High effort noticed—intensity tapered, not canceled",
    coachNoteBody:
      "You rated Wednesday at RPE 9.2/10. FitAI stepped Week 2 and Week 3 working intensity down by 15% and trimmed one peak set so you recover ahead of Intensification.",
    weeks: [
      {
        week: 1,
        phaseName: "Foundation",
        targetRpe: 6.5,
        sessionsCount: 4,
        intensityPercent: 68,
        status: "done",
      },
      {
        week: 2,
        phaseName: "Accumulation",
        targetRpe: 6.4,
        sessionsCount: 4,
        intensityPercent: 66,
        status: "adjusted",
      },
      {
        week: 3,
        phaseName: "Intensification",
        targetRpe: 7.4,
        sessionsCount: 4,
        intensityPercent: 78,
        status: "adjusted",
      },
      {
        week: 4,
        phaseName: "Deload",
        targetRpe: 5.8,
        sessionsCount: 3,
        intensityPercent: 55,
        status: "upcoming",
      },
    ],
    sessions: [
      {
        day: "Mon",
        time: "18:00",
        title: "Lower & Squat Mechanics",
        prescription: "Logged RPE 9.2 · Fatigue trigger recorded",
        status: "complete",
      },
      {
        day: "Wed",
        time: "18:00",
        title: "Upper Push (Tapered)",
        prescription: "Push-up 3×8 (-1 set) · Lateral Raise 2×12",
        status: "adjusted",
      },
      {
        day: "Thu",
        time: "Rest",
        title: "Extra Sleep & Mobility",
        prescription: "Zero missed-day penalty",
        status: "rest",
      },
      {
        day: "Fri",
        time: "18:30",
        title: "Posterior Chain Control",
        prescription: "Deadlift 2×8 @ RPE 6.5 · Pull-up 3×5",
        status: "adjusted",
      },
    ],
  },
  {
    id: "missed-slot",
    triggerLabel: "Schedule Conflict",
    badgeText: "Slots Re-routed",
    tone: "plan",
    coachNoteTitle: "Missed Wednesday shifted cleanly to Saturday",
    coachNoteBody:
      "Life interrupted midweek. Instead of stacking back-to-back high-fatigue days, FitAI consolidated accessory work and moved Upper Push to Saturday while keeping your 4-day rhythm.",
    weeks: [
      {
        week: 1,
        phaseName: "Foundation",
        targetRpe: 6.5,
        sessionsCount: 4,
        intensityPercent: 68,
        status: "done",
      },
      {
        week: 2,
        phaseName: "Accumulation",
        targetRpe: 7,
        sessionsCount: 4,
        intensityPercent: 74,
        status: "adjusted",
      },
      {
        week: 3,
        phaseName: "Intensification",
        targetRpe: 7.8,
        sessionsCount: 5,
        intensityPercent: 84,
        status: "upcoming",
      },
      {
        week: 4,
        phaseName: "Deload",
        targetRpe: 6,
        sessionsCount: 3,
        intensityPercent: 58,
        status: "upcoming",
      },
    ],
    sessions: [
      {
        day: "Mon",
        time: "18:00",
        title: "Lower & Squat Mechanics",
        prescription: "Squat 3×12 · Plank 3×45s",
        status: "complete",
      },
      {
        day: "Wed",
        time: "Open",
        title: "Busy Day · Slot Cleared",
        prescription: "Moved automatically without streak break",
        status: "rest",
      },
      {
        day: "Fri",
        time: "18:30",
        title: "Posterior Chain & Pull",
        prescription: "Deadlift 3×8 · Pull-up 3×6",
        status: "next",
      },
      {
        day: "Sat",
        time: "09:30",
        title: "Upper Push (Rescheduled)",
        prescription: "Bench Press 3×10 · Triceps Dip 3×10",
        status: "adjusted",
      },
    ],
  },
  {
    id: "injury-guard",
    triggerLabel: "Recovery Guard",
    badgeText: "50% PR Cap Active",
    tone: "recover",
    coachNoteTitle: "Shoulder discomfort protected for 3 sessions",
    coachNoteBody:
      "You flagged anterior shoulder tightness. FitAI swapped overhead Shoulder Press for floor-angled Incline Push-up & Lower Focus, capping pressing load at 50% PR for 3 sessions.",
    weeks: [
      {
        week: 1,
        phaseName: "Foundation",
        targetRpe: 6.5,
        sessionsCount: 4,
        intensityPercent: 68,
        status: "done",
      },
      {
        week: 2,
        phaseName: "Accumulation",
        targetRpe: 6.2,
        sessionsCount: 4,
        intensityPercent: 56,
        status: "adjusted",
      },
      {
        week: 3,
        phaseName: "Intensification",
        targetRpe: 7.2,
        sessionsCount: 4,
        intensityPercent: 74,
        status: "adjusted",
      },
      {
        week: 4,
        phaseName: "Deload",
        targetRpe: 6,
        sessionsCount: 3,
        intensityPercent: 58,
        status: "upcoming",
      },
    ],
    sessions: [
      {
        day: "Mon",
        time: "18:00",
        title: "Lower & Squat Mechanics",
        prescription: "Full load maintained · Squat 3×12 · Lunge 3×10",
        status: "complete",
      },
      {
        day: "Wed",
        time: "18:00",
        title: "Incline Push-up & Lower Focus",
        prescription: "Replaces Shoulder Press · 50% PR cap (1 / 3)",
        status: "adjusted",
      },
      {
        day: "Fri",
        time: "18:30",
        title: "Core & Hinge Stability",
        prescription: "Deadlift 3×8 · Plank 3×45s · Bicep Curl 2×12",
        status: "adjusted",
      },
      {
        day: "Sun",
        time: "Rest",
        title: "Joint Check-in Scheduled",
        prescription: "Re-evaluate overhead readiness before Week 3",
        status: "rest",
      },
    ],
  },
];

const BODY_ZONE_FOCUSES: readonly BodyZoneFocusInfo[] = [
  {
    id: "full",
    label: "Full",
    focusGroups: ["chest", "shoulders", "back", "core", "quads", "glutes", "hamstrings"],
    activeCue: "Balanced weekly distribution across push, pull, hinge, and squat patterns.",
    loadScoreLabel: "7.1 / 10 avg weekly load",
    sessionsSplit: "4 sessions · 12 compound & core sets",
  },
  {
    id: "upper",
    label: "Upper",
    focusGroups: ["chest", "shoulders", "back", "biceps", "triceps"],
    activeCue:
      "Push-pull equilibrium across pectorals, deltoids, lats, and elbow flexors/extensors.",
    loadScoreLabel: "6.6 / 10 upper load",
    sessionsSplit: "2 upper sessions · Push-up, Pull-up, Press",
  },
  {
    id: "core",
    label: "Core",
    focusGroups: ["abdominals", "obliques", "lower back", "serratus anterior"],
    activeCue:
      "Anti-extension bracing and spinal stability anchored by timed Plank and Sit-up progressions.",
    loadScoreLabel: "6.5 / 10 trunk load",
    sessionsSplit: "Integrated across all 4 weekly slots",
  },
  {
    id: "lower",
    label: "Lower",
    focusGroups: ["quads", "glutes", "hamstrings", "calves"],
    activeCue:
      "Primary force production driven by Squat depth tracking, Lunge stability, and Deadlift hinge.",
    loadScoreLabel: "7.8 / 10 lower load",
    sessionsSplit: "2 lower sessions · Squat, Lunge, Deadlift",
  },
];

const SHOULDER_GUARD_SIMULATION: InjuryGuardSimulation = {
  injuredRegionLabel: "Shoulder / Anterior Deltoid",
  injuredMuscleGroups: ["shoulders"],
  guardDurationText: "3 sessions",
  loadCapText: "50% PR load cap",
  replacedExercise: "Shoulder Press",
  safeAlternative: "Incline Push-up & Lower Focus",
  explanation:
    "Overhead pressing pauses automatically for 3 sessions while anterior deltoid load caps at 50% PR. Lower-body and core progression continues with zero streak penalty.",
};

const LANDING_MUSCLE_LOAD: Record<string, { muscleName: string; loadScore: number }> = {
  chest: { muscleName: "chest", loadScore: 7.4 },
  shoulders: { muscleName: "shoulders", loadScore: 6.2 },
  back: { muscleName: "back", loadScore: 7.8 },
  biceps: { muscleName: "biceps", loadScore: 5.5 },
  triceps: { muscleName: "triceps", loadScore: 6 },
  abdominals: { muscleName: "abdominals", loadScore: 7.2 },
  obliques: { muscleName: "obliques", loadScore: 6.4 },
  lower_back: { muscleName: "lower back", loadScore: 5.8 },
  quads: { muscleName: "quads", loadScore: 8.6 },
  glutes: { muscleName: "glutes", loadScore: 8.1 },
  hamstrings: { muscleName: "hamstrings", loadScore: 7 },
  calves: { muscleName: "calves", loadScore: 5.4 },
};

export type {
  AdaptiveSessionSlot,
  AdaptiveSignalId,
  AdaptiveSignalScenario,
  BiomechanicalExerciseSpec,
  BodyZoneFocusInfo,
  ExercisePhaseFrame,
  ExerciseRuleId,
  FormModeKey,
  InjuryGuardSimulation,
  JointPoint,
  LaneKey,
  RepPhaseKey,
  RoadmapWeekSummary,
  TripleLaneItem,
  TripleLanePhase,
};

export {
  ADAPTIVE_ROADMAP_SIGNALS,
  BIOMECHANICAL_EXERCISES,
  BODY_ZONE_FOCUSES,
  LANDING_MUSCLE_LOAD,
  SHOULDER_GUARD_SIMULATION,
  SKELETON_BONE_PAIRS,
  SUPPORTED_EXERCISES_LIST,
  TRIPLE_LANE_PHASES,
};
