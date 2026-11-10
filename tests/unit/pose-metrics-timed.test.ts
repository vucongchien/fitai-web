import { describe, expect, it } from "vitest";

import {
  detectPhaseFromRuleJson,
  evaluateGenericRuleJson,
  evaluateMetricValue,
  resolveLandmarkPoint,
  signedHipYDiff,
} from "@/features/workout/domain/pose-metrics";
import type { GenericRuleFile, Pose } from "@/features/workout/domain/pose-metrics";

describe("Dynamic Rule Calculation & Metric Evaluation Engine", () => {
  it("detects phase as 'always' for metric: 'none' or thresholds.always", () => {
    const plankRuleJson: GenericRuleFile = {
      display_name: "Plank",
      rep_type: "timed",
      phase_detection: {
        metric: "none",
        thresholds: {
          always: {
            comment: "Bài tập tĩnh, kiểm tra liên tục toàn bộ thời gian giữ tư thế",
          },
        },
      },
    };

    const dummyPose: Pose = {
      keypoints: [
        { name: "nose", score: 0.9, x: 100, y: 100 },
        { name: "left_shoulder", score: 0.9, x: 100, y: 200 },
        { name: "right_shoulder", score: 0.9, x: 100, y: 200 },
        { name: "left_hip", score: 0.9, x: 250, y: 200 },
        { name: "right_hip", score: 0.9, x: 250, y: 200 },
        { name: "left_ankle", score: 0.9, x: 450, y: 200 },
        { name: "right_ankle", score: 0.9, x: 450, y: 200 },
      ] as any,
      score: 0.9,
    };

    const result = detectPhaseFromRuleJson(plankRuleJson, dummyPose);
    expect(result.phase).toBe("always");
  });

  it("dynamically resolves keypoint landmarks from rule JSON descriptors", () => {
    const pose: Pose = {
      keypoints: [
        { x: 100, y: 100, score: 0.9 }, // nose (P0)
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 100, y: 200, score: 0.9 }, // left_shoulder (P5)
        { x: 120, y: 200, score: 0.9 }, // right_shoulder (P6)
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 200, y: 300, score: 0.9 }, // left_hip (P11)
        { x: 220, y: 300, score: 0.9 }, // right_hip (P12)
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 300, y: 400, score: 0.9 }, // left_ankle (P15)
        { x: 320, y: 400, score: 0.9 }, // right_ankle (P16)
      ],
      score: 0.9,
    };

    const shoulderPt = resolveLandmarkPoint(pose, "Mid-Shoulder (P5, P6)");
    expect(shoulderPt).toEqual({ x: 110, y: 200 });

    const hipPt = resolveLandmarkPoint(pose, "Hip (P11, P12)");
    expect(hipPt).toEqual({ x: 210, y: 300 });
  });

  it("dynamically evaluates 3-point joint angles from rule JSON formula & landmarks", () => {
    // Right angle at elbow: shoulder(100, 100), elbow(100, 200), wrist(200, 200) -> 90°
    const pose90: Pose = {
      keypoints: [
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 100, y: 100, score: 0.9 }, // left_shoulder
        { x: 100, y: 100, score: 0.9 },
        { x: 100, y: 200, score: 0.9 }, // left_elbow
        { x: 100, y: 200, score: 0.9 },
        { x: 200, y: 200, score: 0.9 }, // left_wrist
        { x: 200, y: 200, score: 0.9 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
      ],
      score: 0.9,
    };

    const val = evaluateMetricValue(
      "elbow_angle",
      ["Shoulder (P5, P6)", "Elbow (P7, P8)", "Wrist (P9, P10)"],
      "θ = arccos((U · W) / (||U|| * ||W||)) * (180 / π)",
      pose90,
    );

    expect(val).toBeCloseTo(90, 1);
  });

  it("evaluates Plank rules dynamically for Warning (severity 1) and Danger (severity 2)", () => {
    const plankRuleFile: GenericRuleFile = {
      display_name: "Plank",
      rep_type: "timed",
      phase_detection: {
        metric: "none",
        thresholds: {
          always: { comment: "Bài tập tĩnh" },
        },
      },
      rules: [
        {
          metric: "signed_hip_y_diff",
          description: "Độ lệch hông so với đường thẳng vai-cổ chân",
          evaluation_type: "absolute_upper_bound",
          ranges: [
            {
              severity: 0,
              status: "Correct",
              min: 0.0,
              max: 0.09,
              comment: "≤9cm: hông thẳng hàng",
            },
            {
              severity: 1,
              status: "Warning",
              min: 0.09,
              max: 0.18,
              comment: "9-18cm: hông bắt đầu mất alignment",
            },
            {
              severity: 2,
              status: "Danger",
              min: 0.18,
              max: null,
              comment: ">18cm: mất kiểm soát hoàn toàn",
            },
          ],
          calculation: {
            landmarks: ["Shoulder (P5, P6)", "Hip (P11, P12)", "Ankle (P15, P16)"],
            formula:
              "signed_hip_y_diff = signed_distance_point_to_line(P_hip_mid, P_shoulder_mid, P_ankle_mid) / torso_length",
          },
        },
      ],
    };

    const dangerPose: Pose = {
      keypoints: [
        { x: 100, y: 100, score: 0.9 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 100, y: 200, score: 0.9 },
        { x: 100, y: 200, score: 0.9 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 250, y: 235, score: 0.9 },
        { x: 250, y: 235, score: 0.9 },
        { x: 0, y: 0, score: 0 },
        { x: 0, y: 0, score: 0 },
        { x: 450, y: 200, score: 0.9 },
        { x: 450, y: 200, score: 0.9 },
      ],
      score: 0.9,
    };

    const resDanger = evaluateGenericRuleJson(plankRuleFile, dangerPose);
    expect(resDanger.violations.length).toBe(1);
    expect(resDanger.violations[0]?.severity).toBe(2);
    expect(resDanger.violations[0]?.message).toContain(">18cm: mất kiểm soát hoàn toàn");
  });

  it("handles two_sided ranges without false-flagging valid 90-degree angles or misclassifying warning as danger", () => {
    const twoSidedPlankRule: GenericRuleFile = {
      display_name: "Plank",
      phase_detection: {
        calculation: {
          formula: "degrees(arctan2(|y_shoulder - y_ankle|, |x_shoulder - x_ankle|))",
          landmarks: ["left_shoulder (11)", "left_ankle (15)"],
        },
        metric: "body_incline_angle",
        thresholds: {
          always: { lte: 35 },
          idle: { gt: 35 },
        },
      },
      rep_type: "timed",
      rules: [
        {
          calculation: {
            formula: "degrees(arccos(dot(BA, BC) / (|BA| * |BC|)))",
            landmarks: ["Shoulder (P5, P6)", "Elbow (P7, P8)", "Wrist (P9, P10)"],
          },
          evaluation_type: "two_sided",
          metric: "elbow_angle",
          ranges: [
            { comment: "Valid 70-110", max: 110, min: 70, severity: 0, status: "Correct" },
            { comment: "Warning 60-120", max: 120, min: 60, severity: 1, status: "Warning" },
            { comment: "Danger <60 or >120", max: null, min: 0, severity: 2, status: "Danger" },
          ],
        },
      ],
    };

    const makePlankPose = (wristX: number, wristY: number, ankleY = 200): Pose => ({
      keypoints: [
        { score: 0.9, x: 100, y: 100 },
        { score: 0, x: 0, y: 0 },
        { score: 0, x: 0, y: 0 },
        { score: 0, x: 0, y: 0 },
        { score: 0, x: 0, y: 0 },
        { score: 0.9, x: 100, y: 100 },
        { score: 0.9, x: 100, y: 100 },
        { score: 0.9, x: 100, y: 200 },
        { score: 0.9, x: 100, y: 200 },
        { score: 0.9, x: wristX, y: wristY },
        { score: 0.9, x: wristX, y: wristY },
        { score: 0.9, x: 250, y: 150 },
        { score: 0.9, x: 250, y: 150 },
        { score: 0, x: 0, y: 0 },
        { score: 0, x: 0, y: 0 },
        { score: 0.9, x: 450, y: ankleY },
        { score: 0.9, x: 450, y: ankleY },
      ],
      score: 0.9,
    });

    const validRes = evaluateGenericRuleJson(twoSidedPlankRule, makePlankPose(200, 200, 100));
    expect(validRes.currentPhase).toBe("always");
    expect(validRes.violations).toHaveLength(0);

    const warnRes = evaluateGenericRuleJson(twoSidedPlankRule, makePlankPose(190, 158, 100));
    expect(warnRes.currentPhase).toBe("always");
    expect(warnRes.violations).toHaveLength(1);
    expect(warnRes.violations[0]?.severity).toBe(1);

    const idleRes = evaluateGenericRuleJson(twoSidedPlankRule, makePlankPose(200, 200, 500));
    expect(idleRes.currentPhase).toBe("idle");
    expect(idleRes.violations).toHaveLength(0);
  });
});
