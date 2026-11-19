type ExerciseCategory = "Lower Body" | "Upper Push" | "Upper Pull" | "Core";

interface LabFaqItem {
  question: string;
  answer: string;
}

interface LabExerciseMeta {
  slug: string;
  fileId: string;
  category: ExerciseCategory;
  cameraView: string;
  primaryMuscles: readonly string[];
  answerSummary: string;
  faqs: readonly LabFaqItem[];
}

const LAB_EXERCISES_META: readonly LabExerciseMeta[] = [
  {
    slug: "squat",
    fileId: "squat",
    category: "Lower Body",
    cameraView: "Side profile",
    primaryMuscles: ["Quadriceps", "Glutes", "Core"],
    answerSummary:
      "FITAI evaluates Squat depth using the hip-knee-ankle angle (knee_angle <= 100 deg marks the active bottom phase) while checking side-view torso lean (<= 42 deg) and horizontal knee-over-toe travel.",
    faqs: [
      {
        question: "What knee angle counts as a full Squat rep in FITAI?",
        answer:
          "Standing readiness starts above 160 degrees, controlled descent runs between 100 and 160 degrees, and reaching 100 degrees or lower triggers the active bottom phase before returning to standing.",
      },
      {
        question: "How much forward torso lean is safe during a Squat?",
        answer:
          "FITAI classifies 0 to 42 degrees of torso lean as Correct, 42 to 52 degrees as Warning, and above 52 degrees as Danger to help limit lower-back shear.",
      },
      {
        question: "Can I log Squats without turning on the camera?",
        answer:
          "Yes. Every workout session provides complete manual logging parity so you can record sets, reps, and RPE without camera tracking.",
      },
    ],
  },
  {
    slug: "push-up",
    fileId: "push_up",
    category: "Upper Push",
    cameraView: "Side & front profile",
    primaryMuscles: ["Pectorals", "Anterior Deltoids", "Triceps", "Core"],
    answerSummary:
      "FITAI tracks Push-up repetitions through elbow flexion angle from lockout down to the active bottom zone while checking hip sag or pike alignment and hand-width symmetry.",
    faqs: [
      {
        question: "Which body faults does FITAI detect during Push-ups?",
        answer:
          "The biomechanical referee checks signed_hip_y_diff from a side camera for hip sag or piking, and hand_width_ratio from a front angle to verify even shoulder spacing.",
      },
      {
        question: "Where is Push-up pose inference processed?",
        answer:
          "Keypoint detection and angle evaluation run locally in your browser using ONNX Runtime Web and a 3-phase state machine, without streaming camera frames to an inference server.",
      },
      {
        question: "How does FITAI adjust Push-ups if wrist or shoulder pain is reported?",
        answer:
          "Reporting an active injury triggers Injury Guard, halts the session, and routes your 4-week roadmap toward safe recovery and lower-load alternatives.",
      },
    ],
  },
  {
    slug: "plank",
    fileId: "plank",
    category: "Core",
    cameraView: "Side & front profile",
    primaryMuscles: ["Transverse Abdominis", "Rectus Abdominis", "Shoulders"],
    answerSummary:
      "FITAI scores Plank as a timed hold: timing activates once body incline is at or below 35 degrees, while five biomechanical rules monitor hip alignment, elbow angle, shoulder stack, and hand width.",
    faqs: [
      {
        question: "When does FITAI pause or start the Plank timer?",
        answer:
          "If body_incline_angle exceeds 35 degrees from horizontal, the state stays idle and pauses timing; at 35 degrees or below, timing and live form checks run continuously.",
      },
      {
        question: "What hip alignment range keeps a Plank in the Correct zone?",
        answer:
          "FITAI checks normalized hip deviation (signed_hip_y_diff) relative to the shoulder-ankle line: 0 to 0.11 is Correct, 0.11 to 0.20 triggers Warning, and above 0.20 triggers Danger.",
      },
      {
        question: "What elbow angle is recommended for a forearm Plank?",
        answer:
          "An elbow angle between 70 and 110 degrees keeps the forearm stacked stably beneath the shoulder joint.",
      },
    ],
  },
  {
    slug: "deadlift",
    fileId: "deadlift",
    category: "Lower Body",
    cameraView: "Side profile",
    primaryMuscles: ["Hamstrings", "Glutes", "Erector Spinae"],
    answerSummary:
      "FITAI tracks Barbell Deadlift reps via hip hinge extension and flexion (hip_angle) from a side view, flagging excessive knee flexion (squatting the deadlift) and horizontal bar drift away from midfoot.",
    faqs: [
      {
        question: "What primary joint angle drives Deadlift rep counting?",
        answer:
          "Deadlift uses hip_angle across the shoulder-hip-knee landmarks to distinguish standing lockout, hinge transition, and bottom pull position.",
      },
      {
        question: "How does FITAI distinguish a Deadlift from a Squatting pull?",
        answer:
          "The excessive_knee_flexion rule monitors whether the knees bend too deeply relative to hip hinge depth during transition and active pull phases.",
      },
      {
        question: "Why does FITAI monitor horizontal bar drift?",
        answer:
          "Keeping the bar path close to the ankle-midfoot vertical line minimizes lower-back moment arm and keeps hinge mechanics consistent.",
      },
    ],
  },
  {
    slug: "lunge",
    fileId: "lunge",
    category: "Lower Body",
    cameraView: "Side profile",
    primaryMuscles: ["Quadriceps", "Glutes", "Adductors"],
    answerSummary:
      "FITAI evaluates Lunge repetitions through front knee_angle flexion and checks side-profile torso_lean and knee_over_toe travel to protect the knee joint and maintain upright balance.",
    faqs: [
      {
        question: "What angles does FITAI check on a Lunge?",
        answer:
          "Primary rep phases use knee_angle, while form rules guard excessive forward torso lean and forward knee drift past the ankle.",
      },
      {
        question: "Which camera angle works best for Lunge form feedback?",
        answer:
          "Place the camera in a side profile view so shoulder, hip, knee, and ankle keypoints remain clearly separated throughout the split stance.",
      },
      {
        question: "What if unilateral lunges cause knee discomfort?",
        answer:
          "Flagging knee soreness in FITAI triggers Injury Guard to swap high-stress movements and cap training intensity during recovery.",
      },
    ],
  },
  {
    slug: "bench-press",
    fileId: "bench_press",
    category: "Upper Push",
    cameraView: "Front & side profile",
    primaryMuscles: ["Pectorals", "Anterior Deltoids", "Triceps"],
    answerSummary:
      "FITAI counts Barbell Bench Press reps via elbow_angle extension and flexion while monitoring wrist symmetry from the front and excessive elbow flare from the side.",
    faqs: [
      {
        question: "Why does FITAI check elbow flare during Bench Press?",
        answer:
          "Excessive 90-degree shoulder abduction increases anterior shoulder stress; the side-view elbow_flare rule encourages a controlled tuck.",
      },
      {
        question: "How is bar tilt detected on Bench Press?",
        answer:
          "Front-view wrist_symmetry compares left and right wrist heights normalized by torso dimensions to flag uneven pressing.",
      },
      {
        question: "Is manual logging supported for heavy barbell sets?",
        answer:
          "Yes, you can log barbell weight, reps, and RPE manually anytime without camera tracking.",
      },
    ],
  },
  {
    slug: "bicep-curl",
    fileId: "bicep_curl",
    category: "Upper Pull",
    cameraView: "Side profile",
    primaryMuscles: ["Biceps Brachii", "Brachialis", "Forearms"],
    answerSummary:
      "FITAI evaluates Bicep Curl repetitions using elbow_angle flexion while checking side-profile elbow_sway and spine_sway_angle to prevent momentum cheating.",
    faqs: [
      {
        question: "How does FITAI detect momentum cheating in Bicep Curls?",
        answer:
          "Two rules run together: elbow_sway tracks whether the upper arm drifts forward or backward, and spine_sway_angle flags leaning back to swing the weight.",
      },
      {
        question: "Which camera placement is recommended for Bicep Curls?",
        answer:
          "A side profile view lets the 17-keypoint detector accurately measure shoulder-elbow-wrist angle and torso lean.",
      },
      {
        question: "Does FITAI support dumbbell curls without camera tracking?",
        answer:
          "Yes, manual mode records completed sets and feeds directly into your 4-week progression model.",
      },
    ],
  },
  {
    slug: "lateral-raise",
    fileId: "lateral_raise",
    category: "Upper Push",
    cameraView: "Front profile",
    primaryMuscles: ["Lateral Deltoids", "Upper Trapezius"],
    answerSummary:
      "FITAI measures Lateral Raise reps via shoulder_abduction_angle from a front camera view, checking for bent-elbow shortening (bent_elbow_cheat) and left-right wrist symmetry.",
    faqs: [
      {
        question: "What joint angle defines a Lateral Raise rep in FITAI?",
        answer:
          "FITAI measures shoulder_abduction_angle between the torso line (hip-shoulder) and upper arm (shoulder-elbow).",
      },
      {
        question: "Why does FITAI flag overly bent elbows on Lateral Raises?",
        answer:
          "Excessive elbow bending shortens the lever arm and shifts load away from the lateral deltoid; maintaining a slight soft bend keeps tension consistent.",
      },
      {
        question: "What camera angle is required for Lateral Raises?",
        answer:
          "Front view is best so both arms, shoulders, and wrists can be compared simultaneously for symmetry.",
      },
    ],
  },
  {
    slug: "pull-up",
    fileId: "pull_up",
    category: "Upper Pull",
    cameraView: "Front or side profile",
    primaryMuscles: ["Latissimus Dorsi", "Biceps", "Mid-Back"],
    answerSummary:
      "FITAI detects Pull-up reps via elbow_angle flexion from dead hang to top pull while checking kipping_swing and spine_sway_angle to keep reps strict and controlled.",
    faqs: [
      {
        question: "How does FITAI detect strict vs kipping Pull-ups?",
        answer:
          "The kipping_swing and spine_sway_angle rules evaluate horizontal lower-body and torso swing during ascent and descent.",
      },
      {
        question: "Which angle triggers rep completion on a Pull-up?",
        answer:
          "Elbow flexion angle transitions from extended rest hang through active top pull and back to full extension.",
      },
      {
        question: "Can assisted or band Pull-ups be logged manually?",
        answer:
          "Yes, FITAI supports full manual rep and RPE logging when training with bands or machines.",
      },
    ],
  },
  {
    slug: "shoulder-press",
    fileId: "shoulder_press",
    category: "Upper Push",
    cameraView: "Front & side profile",
    primaryMuscles: ["Anterior Deltoids", "Triceps", "Upper Chest"],
    answerSummary:
      "FITAI tracks Overhead Shoulder Press reps through elbow_angle lockout and monitors wrist_symmetry plus spine_sway_angle to prevent excessive lower-back hyperextension.",
    faqs: [
      {
        question: "Why does FITAI check spine_sway_angle during Shoulder Press?",
        answer:
          "Leaning backward turns an overhead press into an upper-chest incline and compresses the lumbar spine; FITAI flags excessive backward sway.",
      },
      {
        question: "What does wrist_symmetry check overhead?",
        answer:
          "It compares left and right wrist elevation to alert you if one side presses ahead or stalls.",
      },
      {
        question: "How does RPE affect next week's pressing load?",
        answer:
          "If reported RPE exceeds your target zone, FITAI steps down upcoming volume or load to keep progression sustainable.",
      },
    ],
  },
  {
    slug: "sit-up",
    fileId: "sit_up",
    category: "Core",
    cameraView: "Side profile",
    primaryMuscles: ["Rectus Abdominis", "Hip Flexors"],
    answerSummary:
      "FITAI counts Sit-up repetitions using hip_flexion_angle between torso and thigh from a side view while checking ankle_lift so legs stay anchored on the floor.",
    faqs: [
      {
        question: "What fault does ankle_lift catch during Sit-ups?",
        answer:
          "When feet lift off the ground, hip momentum compensates for core strength; ankle_lift warns when ankle height deviates from floor baseline.",
      },
      {
        question: "Which landmarks measure Sit-up range of motion?",
        answer:
          "Shoulder, hip, and knee keypoints form hip_flexion_angle to track lying start, transition crunch, and top flexion.",
      },
      {
        question: "Are timed holds and counted core exercises tracked differently?",
        answer:
          "Yes. Counted movements like Sit-up use the 3-phase rep state machine, whereas Plank uses an incline-activated timer.",
      },
    ],
  },
  {
    slug: "triceps-dip",
    fileId: "triceps_dip",
    category: "Upper Push",
    cameraView: "Side profile",
    primaryMuscles: ["Triceps Brachii", "Anterior Deltoids", "Lower Chest"],
    answerSummary:
      "FITAI evaluates Triceps Dip depth via elbow_angle flexion from a side profile while guarding shoulder stress through hips_too_far distance and torso_lean checks.",
    faqs: [
      {
        question: "Why does hips_too_far matter on bench or bar Triceps Dips?",
        answer:
          "Letting the hips drift far forward from the hands places excessive anterior shear on the shoulder capsule.",
      },
      {
        question: "How does FITAI check Dip depth safely?",
        answer:
          "Elbow angle tracks descent from lockout into the active zone while side-view torso_lean prevents collapsing forward.",
      },
      {
        question: "Can Triceps Dips be swapped automatically on shoulder soreness?",
        answer:
          "Yes. Flagging shoulder discomfort triggers Injury Guard to replace aggravating pressing movements.",
      },
    ],
  },
];

export { LAB_EXERCISES_META };
export type { ExerciseCategory, LabExerciseMeta, LabFaqItem };
