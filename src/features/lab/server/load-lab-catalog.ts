import { LAB_EXERCISES_META, type LabExerciseMeta } from "@/features/lab/model/lab-catalog";

import benchPressDialogue from "../../../../public/models/dialogue/bench_press_dialogue.json";
import bicepCurlDialogue from "../../../../public/models/dialogue/bicep_curl_dialogue.json";
import deadliftDialogue from "../../../../public/models/dialogue/deadlift_dialogue.json";
import lateralRaiseDialogue from "../../../../public/models/dialogue/lateral_raise_dialogue.json";
import lungeDialogue from "../../../../public/models/dialogue/lunge_dialogue.json";
import plankDialogue from "../../../../public/models/dialogue/plank_dialogue.json";
import pullUpDialogue from "../../../../public/models/dialogue/pull_up_dialogue.json";
import pushUpDialogue from "../../../../public/models/dialogue/push_up_dialogue.json";
import shoulderPressDialogue from "../../../../public/models/dialogue/shoulder_press_dialogue.json";
import sitUpDialogue from "../../../../public/models/dialogue/sit_up_dialogue.json";
import squatDialogue from "../../../../public/models/dialogue/squat_dialogue.json";
import tricepsDipDialogue from "../../../../public/models/dialogue/triceps_dip_dialogue.json";
import benchPressRule from "../../../../public/models/rules/bench_press_rule.json";
import bicepCurlRule from "../../../../public/models/rules/bicep_curl_rule.json";
import deadliftRule from "../../../../public/models/rules/deadlift_rule.json";
import lateralRaiseRule from "../../../../public/models/rules/lateral_raise_rule.json";
import lungeRule from "../../../../public/models/rules/lunge_rule.json";
import plankRule from "../../../../public/models/rules/plank_rule.json";
import pullUpRule from "../../../../public/models/rules/pull_up_rule.json";
import pushUpRule from "../../../../public/models/rules/push_up_rule.json";
import shoulderPressRule from "../../../../public/models/rules/shoulder_press_rule.json";
import sitUpRule from "../../../../public/models/rules/sit_up_rule.json";
import squatRule from "../../../../public/models/rules/squat_rule.json";
import tricepsDipRule from "../../../../public/models/rules/triceps_dip_rule.json";

interface RawThresholdRule {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  comment?: string;
}

interface RawRange {
  severity: number;
  status: string;
  min: number | null;
  max: number | null;
  comment?: string;
}

interface RawFormRule {
  metric: string;
  description?: string;
  evaluation_type?: string;
  apply_in_phases?: string[];
  apply_for_view?: string;
  ranges?: RawRange[];
  calculation?: {
    landmarks?: string[];
    formula?: string;
    description?: string;
  };
}

interface RawExerciseRuleJson {
  display_name?: string;
  rep_type?: string;
  notes?: string;
  phase_detection?: {
    metric?: string;
    thresholds?: Record<string, RawThresholdRule>;
    calculation?: {
      landmarks?: string[];
      formula?: string;
      description?: string;
    };
  };
  rules?: RawFormRule[];
}

interface RawDialogueFeedback {
  metric_name?: string;
  description?: string;
  severities?: Record<
    string,
    {
      severity_level?: number;
      status?: string;
      styles?: Record<string, { text?: string }>;
    }
  >;
}

interface RawDialogueJson {
  voice_feedbacks?: Record<string, RawDialogueFeedback>;
}

interface LabExerciseSpec extends LabExerciseMeta {
  displayName: string;
  repType: "counted" | "timed";
  notes: string;
  phaseMetric: string;
  phaseLandmarks: readonly string[];
  phaseFormula: string;
  phaseDescription: string;
  phases: readonly {
    name: string;
    condition: string;
    comment: string;
  }[];
  formRules: readonly {
    metric: string;
    description: string;
    view: string;
    phases: readonly string[];
    formula: string;
    landmarks: readonly string[];
    ranges: readonly RawRange[];
    coachingCues: readonly string[];
  }[];
}

const RULES_BY_FILE_ID: Record<string, RawExerciseRuleJson> = {
  bench_press: benchPressRule,
  bicep_curl: bicepCurlRule,
  deadlift: deadliftRule,
  lateral_raise: lateralRaiseRule,
  lunge: lungeRule,
  plank: plankRule,
  pull_up: pullUpRule,
  push_up: pushUpRule,
  shoulder_press: shoulderPressRule,
  sit_up: sitUpRule,
  squat: squatRule,
  triceps_dip: tricepsDipRule,
};

const DIALOGUES_BY_FILE_ID: Record<string, RawDialogueJson> = {
  bench_press: benchPressDialogue,
  bicep_curl: bicepCurlDialogue,
  deadlift: deadliftDialogue,
  lateral_raise: lateralRaiseDialogue,
  lunge: lungeDialogue,
  plank: plankDialogue,
  pull_up: pullUpDialogue,
  push_up: pushUpDialogue,
  shoulder_press: shoulderPressDialogue,
  sit_up: sitUpDialogue,
  squat: squatDialogue,
  triceps_dip: tricepsDipDialogue,
};

function formatThresholdCondition(t: RawThresholdRule): string {
  const parts: string[] = [];
  if (t.gt !== undefined) {
    parts.push(`> ${t.gt}`);
  }
  if (t.gte !== undefined) {
    parts.push(`>= ${t.gte}`);
  }
  if (t.lt !== undefined) {
    parts.push(`< ${t.lt}`);
  }
  if (t.lte !== undefined) {
    parts.push(`<= ${t.lte}`);
  }
  return parts.join(" & ") || "Any";
}

function extractVoiceCues(feedback: RawDialogueFeedback | undefined): string[] {
  if (!feedback?.severities) {
    return [];
  }
  const cues: string[] = [];
  for (const sev of Object.values(feedback.severities)) {
    const normalText = sev.styles?.normal?.text?.trim();
    if (normalText) {
      cues.push(`${sev.status ?? "Cue"}: ${normalText}`);
    }
  }
  return cues;
}

function buildSpec(meta: LabExerciseMeta): LabExerciseSpec {
  const ruleJson = RULES_BY_FILE_ID[meta.fileId] ?? {};
  const dialogueJson = DIALOGUES_BY_FILE_ID[meta.fileId] ?? {};

  const thresholds = ruleJson.phase_detection?.thresholds ?? {};
  const phases = Object.entries(thresholds).map(([name, val]) => ({
    name: name.toUpperCase(),
    condition: formatThresholdCondition(val),
    comment: val.comment ?? "",
  }));

  const formRules = (ruleJson.rules ?? []).map((rule) => ({
    metric: rule.metric,
    description: rule.description ?? "",
    view: rule.apply_for_view ?? "any",
    phases: rule.apply_in_phases ?? [],
    formula: rule.calculation?.formula ?? "",
    landmarks: rule.calculation?.landmarks ?? [],
    ranges: rule.ranges ?? [],
    coachingCues: extractVoiceCues(dialogueJson.voice_feedbacks?.[rule.metric]),
  }));

  return {
    ...meta,
    displayName: ruleJson.display_name ?? meta.slug,
    repType: ruleJson.rep_type === "timed" ? "timed" : "counted",
    notes: ruleJson.notes ?? "",
    phaseMetric: ruleJson.phase_detection?.metric ?? "angle",
    phaseLandmarks: ruleJson.phase_detection?.calculation?.landmarks ?? [],
    phaseFormula: ruleJson.phase_detection?.calculation?.formula ?? "",
    phaseDescription: ruleJson.phase_detection?.calculation?.description ?? "",
    phases,
    formRules,
  };
}

function loadLabExerciseBySlug(slug: string): Promise<LabExerciseSpec | null> {
  const meta = LAB_EXERCISES_META.find((item) => item.slug === slug);
  return Promise.resolve(meta ? buildSpec(meta) : null);
}

function loadAllLabExercises(): Promise<LabExerciseSpec[]> {
  return Promise.resolve(LAB_EXERCISES_META.map((meta) => buildSpec(meta)));
}

export { loadAllLabExercises, loadLabExerciseBySlug };
export type { LabExerciseSpec };
