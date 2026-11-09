import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { EdgeRefereeSession } from "@/features/workout/domain/edge-referee";
import {
  resolveCanonicalExerciseSlug,
  resolveDialogueAssetUrl,
  resolveRulesAssetUrl,
} from "@/features/workout/domain/motion-asset-url";
import { parseMotionRule } from "@/features/workout/domain/rule-parser";
import { resolveVoiceFeedbackCueText } from "@/features/workout/model/use-live-workout-effects";

describe("Edge-First Personal Workout Session Lifecycle", () => {
  it("completes full edge session: rule load -> neutral frame -> flexed contraction -> rep count -> telemetry", () => {
    const rulePath = path.resolve(process.cwd(), "public/models/rules/bicep_curl_rule.json");
    const dialoguePath = path.resolve(
      process.cwd(),
      "public/models/dialogue/bicep_curl_dialogue.json",
    );
    const rawRule = JSON.parse(fs.readFileSync(rulePath, "utf-8"));
    const rawDialogue = JSON.parse(fs.readFileSync(dialoguePath, "utf-8"));

    const motionRule = parseMotionRule("bicep_curl", rawRule);
    const session = new EdgeRefereeSession(motionRule, "SIDE");

    const buildPose = (elbowAngleDeg: number, swayOffset = 0) => {
      const pts = Array.from({ length: 17 }, () => ({
        score: 0.95,
        x: 0.5,
        y: 0.5,
      }));
      const sx = 0.5;
      const sy = 0.3;
      const hx = 0.5;
      const hy = 0.6;
      const ex = sx + swayOffset;
      const ey = sy + 0.15;
      pts[5] = { score: 0.96, x: sx, y: sy };
      pts[6] = { score: 0.92, x: sx, y: sy };
      pts[11] = { score: 0.96, x: hx, y: hy };
      pts[12] = { score: 0.92, x: hx, y: hy };
      pts[13] = { score: 0.96, x: 0.5, y: 0.8 };
      pts[14] = { score: 0.92, x: 0.5, y: 0.8 };
      pts[15] = { score: 0.96, x: 0.5, y: 0.95 };
      pts[16] = { score: 0.92, x: 0.5, y: 0.95 };
      pts[7] = { score: 0.96, x: ex, y: ey };
      pts[8] = { score: 0.92, x: ex, y: ey };

      const baseAngle = Math.atan2(sy - ey, sx - ex);
      const targetAngle = baseAngle + (elbowAngleDeg * Math.PI) / 180;
      const wx = ex + 0.14 * Math.cos(targetAngle);
      const wy = ey + 0.14 * Math.sin(targetAngle);
      pts[9] = { score: 0.96, x: wx, y: wy };
      pts[10] = { score: 0.92, x: wx, y: wy };
      return pts;
    };

    let t = 1000;
    const stepFrame = (angle: number, sway = 0) => {
      t += 50;
      return session.processKeypoints(buildPose(angle, sway), t, "SIDE");
    };

    const startSnap = stepFrame(170);
    expect(startSnap.repPhase).toBe("REST");
    expect(startSnap.repCount).toBe(0);

    for (let i = 1; i <= 10; i++) {
      const angle = 170 - (i / 10) * (170 - 60);
      stepFrame(angle, 0.08);
    }

    const bottomSnap = stepFrame(60, 0.08);
    expect(bottomSnap.repPhase).toBe("ACTIVE");
    expect(bottomSnap.detectedErrors).toContain("ERR_ELBOW_SWAY");

    const cueText = resolveVoiceFeedbackCueText(
      rawDialogue.voice_feedbacks,
      "ERR_ELBOW_SWAY",
      2,
      "normal",
      "Khửu tay đung đưa",
      "elbow_sway",
    );
    expect(cueText.length).toBeGreaterThan(5);

    for (let i = 9; i >= 0; i--) {
      const angle = 170 - (i / 10) * (170 - 60);
      stepFrame(angle, 0);
    }

    expect(session.getConfirmedValue()).toBe(1);
    const summary = session.buildSetTelemetry(0.95);
    expect(summary.countedReps).toBe(1);
    expect(summary.reps).toHaveLength(1);
    expect(summary.reps[0]?.romPercentage).toBeGreaterThanOrEqual(80);
  });

  it("normalizes relative backend rules_url and dialogues_url to canonical public paths", () => {
    expect(resolveCanonicalExerciseSlug("barbell_squat")).toBe("squat");
    expect(resolveRulesAssetUrl("rules/squat_rule.json", "squat")).toBe(
      "/models/rules/squat_rule.json",
    );
    expect(resolveRulesAssetUrl("/models/rules/push_up.json", "push_up")).toBe(
      "/models/rules/push_up_rule.json",
    );
    expect(resolveDialogueAssetUrl("dialogues/plank_dialogue.json", "plank")).toBe(
      "/models/dialogue/plank_dialogue.json",
    );
  });
});
