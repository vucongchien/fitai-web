import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  EdgeRefereeSession,
  keypointsToSkeletonPoints,
} from "@/features/workout/domain/edge-referee";
import { evaluateMotionRule, type SkeletonPoint } from "@/features/workout/domain/rule-evaluator";
import { parseMotionRule } from "@/features/workout/domain/rule-parser";
import { isTimedExercise } from "@/features/workout/domain/session-guards";
import { resolveVoiceFeedbackCueText } from "@/features/workout/model/use-live-workout-effects";
import { isPoseMatchingStencil } from "@/features/workout/ui/live/pose-stencil-overlay";

type PoseGenFunc = (
  t: number,
  faultMode: "good" | "bad_form" | "half_rep",
  rightSideDominant: boolean,
) => SkeletonPoint[];

interface ExerciseBenchSpec {
  slug: string;
  cameraAngle: string;
  expectedErrorCode: string;
  poseGen: PoseGenFunc;
}

function makeBaseSkeleton(rightSideDominant: boolean): SkeletonPoint[] {
  const visL = rightSideDominant ? 0.15 : 0.96;
  const visR = rightSideDominant ? 0.98 : 0.92;
  const pts: SkeletonPoint[] = [];
  for (let i = 0; i < 17; i++) {
    const vis = i === 0 ? 0.98 : i % 2 === 0 ? visR : visL;
    pts.push({ index: i, visibility: vis, x: 0.5, y: 0.5, z: 0 });
  }
  return pts;
}

function setBilateral(
  pts: SkeletonPoint[],
  leftIdx: number,
  rightIdx: number,
  x: number,
  y: number,
  spreadX = 0,
): void {
  const left = pts[leftIdx];
  const right = pts[rightIdx];
  if (left) {
    left.x = x - spreadX;
    left.y = y;
  }
  if (right) {
    right.x = x + spreadX;
    right.y = y;
  }
}

function pointFromAngle(
  gx: number,
  gy: number,
  px: number,
  py: number,
  lenSeg: number,
  angleDeg: number,
  dirSign: number,
): [number, number] {
  const vx = gx - px;
  const vy = gy - py;
  const baseAngle = Math.atan2(vy, vx);
  const rad = angleDeg * (Math.PI / 180.0);
  const targetAngle = baseAngle + dirSign * rad;
  return [px + lenSeg * Math.cos(targetAngle), py + lenSeg * Math.sin(targetAngle)];
}

function getTwelveExerciseSpecs(): ExerciseBenchSpec[] {
  return [
    {
      cameraAngle: "SIDE",
      expectedErrorCode: "ERR_ELBOW_SWAY",
      poseGen: (t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        const sx = faultMode === "bad_form" ? 0.44 : 0.5;
        const sy = 0.3;
        const hx = 0.5;
        const hy = 0.6;
        setBilateral(pts, 5, 6, sx, sy);
        setBilateral(pts, 11, 12, hx, hy);
        setBilateral(pts, 13, 14, 0.5, 0.8);
        setBilateral(pts, 15, 16, 0.5, 0.95);
        const ex = faultMode === "bad_form" ? sx + 0.08 : sx;
        const ey = sy + 0.15;
        setBilateral(pts, 7, 8, ex, ey);
        const targetAngle = faultMode === "half_rep" ? 170 - t * (170 - 105) : 170 - t * (170 - 60);
        const [wx, wy] = pointFromAngle(sx, sy, ex, ey, 0.14, targetAngle, 1.0);
        setBilateral(pts, 9, 10, wx, wy);
        return pts;
      },
      slug: "bicep_curl",
    },
    {
      cameraAngle: "SIDE",
      expectedErrorCode: "ERR_TORSO_LEAN",
      poseGen: (t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        const ax = 0.5;
        const ay = 0.9;
        const kx = 0.52;
        const ky = 0.72;
        setBilateral(pts, 15, 16, ax, ay);
        setBilateral(pts, 13, 14, kx, ky);
        const kneeAngle = faultMode === "half_rep" ? 172 - t * (172 - 120) : 172 - t * (172 - 85);
        const [hx, hy] = pointFromAngle(ax, ay, kx, ky, 0.22, kneeAngle, -1.0);
        setBilateral(pts, 11, 12, hx, hy);
        const leanDeg = faultMode === "bad_form" ? 55.0 : 15.0 * t;
        const leanRad = leanDeg * (Math.PI / 180.0);
        const torsoLen = 0.28;
        const sx = hx + torsoLen * Math.sin(leanRad);
        const sy = hy - torsoLen * Math.cos(leanRad);
        setBilateral(pts, 5, 6, sx, sy);
        return pts;
      },
      slug: "squat",
    },
    {
      cameraAngle: "SIDE",
      expectedErrorCode: "ERR_TORSO_LEAN",
      poseGen: (t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        const ax = 0.5;
        const ay = 0.9;
        const kx = 0.52;
        const ky = 0.72;
        setBilateral(pts, 15, 16, ax, ay);
        setBilateral(pts, 13, 14, kx, ky);
        const kneeAngle = faultMode === "half_rep" ? 172 - t * (172 - 150) : 172 - t * (172 - 88);
        const [hx, hy] = pointFromAngle(ax, ay, kx, ky, 0.22, kneeAngle, -1.0);
        setBilateral(pts, 11, 12, hx, hy);
        const leanDeg = faultMode === "bad_form" ? 35.0 : 8.0 * t;
        const leanRad = leanDeg * (Math.PI / 180.0);
        const torsoLen = 0.28;
        const sx = hx + torsoLen * Math.sin(leanRad);
        const sy = hy - torsoLen * Math.cos(leanRad);
        setBilateral(pts, 5, 6, sx, sy);
        return pts;
      },
      slug: "lunge",
    },
    {
      cameraAngle: "SIDE",
      expectedErrorCode: "ERR_BAR_DRIFT",
      poseGen: (t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        const hx = 0.45;
        const hy = 0.58;
        const kx = 0.5;
        const ky = 0.76;
        const ax = 0.5;
        const ay = 0.94;
        setBilateral(pts, 11, 12, hx, hy);
        setBilateral(pts, 13, 14, kx, ky);
        setBilateral(pts, 15, 16, ax, ay);
        const hipAngle = faultMode === "half_rep" ? 172 - t * (172 - 128) : 172 - t * (172 - 88);
        const [sx, sy] = pointFromAngle(kx, ky, hx, hy, 0.28, hipAngle, -1.0);
        setBilateral(pts, 5, 6, sx, sy);
        const wx = faultMode === "bad_form" ? ax + 0.18 : ax + 0.02;
        const wy = sy + 0.22;
        setBilateral(pts, 7, 8, (sx + wx) / 2, (sy + wy) / 2);
        setBilateral(pts, 9, 10, wx, wy);
        return pts;
      },
      slug: "deadlift",
    },
    {
      cameraAngle: "SIDE",
      expectedErrorCode: "ERR_SIGNED_HIP_Y_DIFF",
      poseGen: (t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        const ax = 0.2;
        const ay = 0.7;
        const sx = 0.76;
        const sy = 0.54;
        const hx = 0.48;
        const hy = faultMode === "bad_form" ? 0.76 : 0.62;
        setBilateral(pts, 5, 6, sx, sy);
        setBilateral(pts, 11, 12, hx, hy);
        setBilateral(pts, 13, 14, 0.34, 0.66);
        setBilateral(pts, 15, 16, ax, ay);
        const elbowAngle = faultMode === "half_rep" ? 168 - t * (168 - 120) : 168 - t * (168 - 85);
        const ex = sx - 0.06;
        const ey = sy + 0.12;
        const [wx, wy] = pointFromAngle(sx, sy, ex, ey, 0.12, elbowAngle, 1.0);
        setBilateral(pts, 7, 8, ex, ey);
        setBilateral(pts, 9, 10, wx, wy);
        return pts;
      },
      slug: "push_up",
    },
    {
      cameraAngle: "FRONT",
      expectedErrorCode: "ERR_WRIST_SYMMETRY",
      poseGen: (t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        if (pts[9]) pts[9].visibility = 0.95;
        if (pts[10]) pts[10].visibility = 0.95;
        const sx = 0.5;
        const sy = 0.55;
        const hx = 0.22;
        const hy = 0.55;
        setBilateral(pts, 5, 6, sx, sy);
        setBilateral(pts, 11, 12, hx, hy);
        setBilateral(pts, 13, 14, 0.12, 0.7);
        setBilateral(pts, 15, 16, 0.12, 0.88);
        const [ex, ey] = pointFromAngle(hx, hy, sx, sy, 0.14, 60.0, 1.0);
        setBilateral(pts, 7, 8, ex, ey);
        const elbowAngle = faultMode === "half_rep" ? 168 - t * (168 - 115) : 168 - t * (168 - 82);
        const [wx, wy] = pointFromAngle(sx, sy, ex, ey, 0.14, elbowAngle, 1.0);
        setBilateral(pts, 9, 10, wx, wy);
        if (faultMode === "bad_form" && pts[10]) {
          pts[10].y = wy - 0.09;
        }
        return pts;
      },
      slug: "bench_press",
    },
    {
      cameraAngle: "FRONT",
      expectedErrorCode: "ERR_WRIST_SYMMETRY",
      poseGen: (t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        if (pts[9]) pts[9].visibility = 0.95;
        if (pts[10]) pts[10].visibility = 0.95;
        const sx = 0.5;
        const sy = 0.35;
        const hx = 0.5;
        const hy = 0.65;
        setBilateral(pts, 5, 6, sx, sy);
        setBilateral(pts, 11, 12, hx, hy);
        setBilateral(pts, 13, 14, 0.5, 0.82);
        setBilateral(pts, 15, 16, 0.5, 0.96);
        const ex = sx + 0.1;
        const ey = sy + 0.04;
        setBilateral(pts, 7, 8, ex, ey);
        const elbowAngle = faultMode === "half_rep" ? 80 + t * (130 - 80) : 80 + t * (168 - 80);
        const [wx, wy] = pointFromAngle(sx, sy, ex, ey, 0.14, elbowAngle, -1.0);
        setBilateral(pts, 9, 10, wx, wy);
        if (faultMode === "bad_form" && pts[10]) {
          pts[10].y = wy - 0.09;
        }
        return pts;
      },
      slug: "shoulder_press",
    },
    {
      cameraAngle: "FRONT",
      expectedErrorCode: "ERR_KIPPING_SWING",
      poseGen: (t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        const sx = 0.5;
        const sy = 0.35;
        const hx = 0.5;
        const hy = 0.65;
        setBilateral(pts, 5, 6, sx, sy);
        setBilateral(pts, 11, 12, hx, hy);
        const hipAngle = faultMode === "bad_form" ? 110.0 : 175.0;
        const [kx, ky] = pointFromAngle(sx, sy, hx, hy, 0.2, hipAngle, 1.0);
        setBilateral(pts, 13, 14, kx, ky);
        setBilateral(pts, 15, 16, kx, ky + 0.15);
        const ex = sx + 0.1;
        const ey = sy - 0.05;
        setBilateral(pts, 7, 8, ex, ey);
        const elbowAngle = faultMode === "half_rep" ? 168 - t * (168 - 110) : 168 - t * (168 - 72);
        const [wx, wy] = pointFromAngle(sx, sy, ex, ey, 0.14, elbowAngle, -1.0);
        setBilateral(pts, 9, 10, wx, wy);
        return pts;
      },
      slug: "pull_up",
    },
    {
      cameraAngle: "FRONT",
      expectedErrorCode: "ERR_BENT_ELBOW_CHEAT",
      poseGen: (t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        if (pts[9]) pts[9].visibility = 0.95;
        if (pts[10]) pts[10].visibility = 0.95;
        const sx = 0.5;
        const sy = 0.35;
        const hx = 0.5;
        const hy = 0.65;
        setBilateral(pts, 5, 6, sx, sy);
        setBilateral(pts, 11, 12, hx, hy);
        setBilateral(pts, 13, 14, 0.5, 0.82);
        setBilateral(pts, 15, 16, 0.5, 0.96);
        const abdAngle = faultMode === "half_rep" ? 15 + t * (55 - 15) : 15 + t * (85 - 15);
        const [ex, ey] = pointFromAngle(hx, hy, sx, sy, 0.15, abdAngle, -1.0);
        setBilateral(pts, 7, 8, ex, ey);
        const elbowAngle = faultMode === "bad_form" ? 95.0 : 165.0;
        const [wx, wy] = pointFromAngle(sx, sy, ex, ey, 0.14, elbowAngle, -1.0);
        setBilateral(pts, 9, 10, wx, wy);
        return pts;
      },
      slug: "lateral_raise",
    },
    {
      cameraAngle: "SIDE",
      expectedErrorCode: "ERR_HIPS_TOO_FAR",
      poseGen: (t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        let sx = 0.5;
        const sy = 0.38;
        const hx = 0.5;
        const hy = 0.66;
        setBilateral(pts, 5, 6, sx, sy);
        setBilateral(pts, 11, 12, hx, hy);
        setBilateral(pts, 13, 14, 0.62, 0.72);
        setBilateral(pts, 15, 16, 0.68, 0.9);
        const elbowAngle = faultMode === "half_rep" ? 168 - t * (168 - 148) : 168 - t * (168 - 86);
        if (faultMode === "bad_form") {
          if (pts[11]) pts[11].x = 0.68;
          if (pts[12]) pts[12].x = 0.68;
          if (pts[5]) pts[5].x = 0.68;
          if (pts[6]) pts[6].x = 0.68;
          sx = 0.68;
        }
        let ex = sx - 0.06;
        const ey = sy + 0.12;
        let [wxCalc, wyCalc] = pointFromAngle(sx, sy, ex, ey, 0.12, elbowAngle, 1.0);
        if (faultMode !== "bad_form") {
          const dx = 0.48 - wxCalc;
          ex += dx;
          wxCalc += dx;
        } else {
          const dx = 0.45 - wxCalc;
          ex += dx;
          wxCalc += dx;
          if (pts[5]) pts[5].x = sx + dx;
          if (pts[6]) pts[6].x = sx + dx;
        }
        setBilateral(pts, 7, 8, ex, ey);
        setBilateral(pts, 9, 10, wxCalc, wyCalc);
        return pts;
      },
      slug: "triceps_dip",
    },
    {
      cameraAngle: "SIDE",
      expectedErrorCode: "ERR_ANKLE_LIFT",
      poseGen: (t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        const hx = 0.5;
        const hy = 0.75;
        const kx = 0.65;
        const ky = 0.62;
        const ax = 0.78;
        const ay = faultMode === "bad_form" ? 0.65 : 0.75;
        setBilateral(pts, 11, 12, hx, hy);
        setBilateral(pts, 13, 14, kx, ky);
        setBilateral(pts, 15, 16, ax, ay);
        const hipAngle = faultMode === "half_rep" ? 135 - t * (135 - 112) : 135 - t * (135 - 65);
        const [sx, sy] = pointFromAngle(kx, ky, hx, hy, 0.28, hipAngle, -1.0);
        setBilateral(pts, 5, 6, sx, sy);
        setBilateral(pts, 7, 8, sx + 0.05, sy + 0.05);
        setBilateral(pts, 9, 10, sx + 0.08, sy);
        return pts;
      },
      slug: "sit_up",
    },
    {
      cameraAngle: "SIDE",
      expectedErrorCode: "ERR_SIGNED_HIP_Y_DIFF",
      poseGen: (_t, faultMode, rightSideDominant) => {
        const pts = makeBaseSkeleton(rightSideDominant);
        if (faultMode === "half_rep") {
          setBilateral(pts, 5, 6, 0.5, 0.3);
          setBilateral(pts, 11, 12, 0.5, 0.6);
          setBilateral(pts, 15, 16, 0.5, 0.9);
          setBilateral(pts, 7, 8, 0.5, 0.45);
          setBilateral(pts, 9, 10, 0.5, 0.55);
          return pts;
        }
        const sx = 0.75;
        const sy = 0.55;
        const ax = 0.2;
        const ay = 0.65;
        const hx = 0.475;
        const hy = faultMode === "bad_form" ? 0.72 : 0.6;
        setBilateral(pts, 5, 6, sx, sy);
        setBilateral(pts, 11, 12, hx, hy);
        setBilateral(pts, 13, 14, 0.34, 0.625);
        setBilateral(pts, 15, 16, ax, ay);
        const [ex, ey] = pointFromAngle(hx, hy, sx, sy, 0.14, 90.0, -1.0);
        const [wx, wy] = pointFromAngle(sx, sy, ex, ey, 0.14, 90.0, -1.0);
        setBilateral(pts, 7, 8, ex, ey);
        setBilateral(pts, 9, 10, wx, wy);
        return pts;
      },
      slug: "plank",
    },
  ];
}

function generateRepTrajectory(
  spec: ExerciseBenchSpec,
  nReps: number,
  faultMode: "good" | "bad_form" | "half_rep",
  rightSideDominant: boolean,
  injectGlitch: boolean,
): SkeletonPoint[][] {
  const frames: SkeletonPoint[][] = [];
  for (let i = 0; i < 5; i++) {
    frames.push(spec.poseGen(0.0, faultMode, rightSideDominant));
  }
  for (let rep = 0; rep < nReps; rep++) {
    for (let i = 1; i <= 12; i++) {
      const t = i / 12.0;
      const mode = injectGlitch && rep === 1 && (i === 5 || i === 6) ? "bad_form" : faultMode;
      frames.push(spec.poseGen(t, mode, rightSideDominant));
    }
    for (let i = 0; i < 6; i++) {
      frames.push(spec.poseGen(1.0, faultMode, rightSideDominant));
    }
    for (let i = 11; i >= 0; i--) {
      const t = i / 12.0;
      frames.push(spec.poseGen(t, faultMode, rightSideDominant));
    }
  }
  return frames;
}

describe("Edge Biomechanical Referee Engine — 12 Exercises x 5 Scenarios (60 Benchmark Cases)", () => {
  const specs = getTwelveExerciseSpecs();

  for (const spec of specs) {
    const ruleFile = path.resolve(process.cwd(), `public/models/rules/${spec.slug}_rule.json`);
    const rawJson = JSON.parse(fs.readFileSync(ruleFile, "utf-8"));
    const motionRule = parseMotionRule(spec.slug, rawJson);
    const isReps = motionRule.challengeType === "REPS";

    describe(`Exercise: ${spec.slug}`, () => {
      it("1. Perfect Form -> 0 confirmed errors and exact rep/hold count", () => {
        const ref = new EdgeRefereeSession(motionRule, spec.cameraAngle);
        const frames = generateRepTrajectory(spec, 3, "good", false, false);
        let confirmedErrFrames = 0;
        let maxErrors: string[] = [];

        for (const pts of frames) {
          const snap = ref.processFrame(pts, undefined, spec.cameraAngle);
          if (snap.detectedErrors.length > 0) {
            confirmedErrFrames++;
            maxErrors = snap.detectedErrors;
          }
        }

        expect(confirmedErrFrames, `Unexpected errors: ${maxErrors.join(", ")}`).toBe(0);
        const val = ref.getConfirmedValue();
        expect(isReps ? val === 3 : val >= 4).toBeTruthy();
      });

      it("2. Shallow ROM Half-Reps or Idle Standing -> 0 reps / 0s hold duration", () => {
        const ref = new EdgeRefereeSession(motionRule, spec.cameraAngle);
        const frames = generateRepTrajectory(spec, 3, "half_rep", false, false);

        for (const pts of frames) {
          ref.processFrame(pts, undefined, spec.cameraAngle);
        }

        expect(ref.getConfirmedValue()).toBe(0);
      });

      it("3. Persistent Form Fault -> emits confirmed error while still counting full-ROM reps", () => {
        const ref = new EdgeRefereeSession(motionRule, spec.cameraAngle);
        const frames = generateRepTrajectory(spec, 2, "bad_form", false, false);
        let confirmedErrFrames = 0;
        const allConfirmed = new Set<string>();

        for (const pts of frames) {
          const snap = ref.processFrame(pts, undefined, spec.cameraAngle);
          if (snap.detectedErrors.length > 0) {
            confirmedErrFrames++;
            for (const c of snap.detectedErrors) allConfirmed.add(c);
          }
        }

        expect(confirmedErrFrames).toBeGreaterThan(0);
        const hasExpected = Array.from(allConfirmed).some((code) =>
          code.startsWith(spec.expectedErrorCode),
        );
        expect(hasExpected, `Got errors: ${Array.from(allConfirmed).join(", ")}`).toBeTruthy();
        expect(!isReps || ref.getConfirmedValue() === 2).toBeTruthy();
      });

      it("4. Transient 2-Frame Glitch (100ms < 150ms) -> suppressed by PersistenceFilter", () => {
        const ref = new EdgeRefereeSession(motionRule, spec.cameraAngle);
        const frames = generateRepTrajectory(spec, 2, "good", false, true);
        let confirmedErrFrames = 0;

        for (const pts of frames) {
          const snap = ref.processFrame(pts, undefined, spec.cameraAngle);
          if (snap.detectedErrors.length > 0) {
            confirmedErrFrames++;
          }
        }

        expect(confirmedErrFrames).toBe(0);
      });

      it("5. Side-View Self-Occlusion (Left vis=0.15, Right vis=0.98) -> bilateral mirror tracks accurately", () => {
        const ref = new EdgeRefereeSession(motionRule, spec.cameraAngle);
        const frames = generateRepTrajectory(spec, 3, "good", true, false);
        let confirmedErrFrames = 0;
        let lastPersonDetected = false;

        for (const pts of frames) {
          const snap = ref.processFrame(pts, undefined, spec.cameraAngle);
          lastPersonDetected = snap.personDetected;
          if (snap.detectedErrors.length > 0) {
            confirmedErrFrames++;
          }
        }

        expect(confirmedErrFrames).toBe(0);
        expect(lastPersonDetected).toBeTruthy();
        expect(!isReps || ref.getConfirmedValue() === 3).toBeTruthy();
      });
    });
  }

  it("handles edge cases: empty keypoints, shallow depth warning ERR_INCORRECT_DEPTH, and Plank timed guard", () => {
    const ruleFile = path.resolve(process.cwd(), "public/models/rules/plank_rule.json");
    const rawPlank = JSON.parse(fs.readFileSync(ruleFile, "utf-8"));
    const plankRule = parseMotionRule("plank", rawPlank);

    expect(
      isTimedExercise(
        { durationSeconds: 60, targetReps: 0 },
        {
          phase_detection: rawPlank.phase_detection,
          rep_type: rawPlank.rep_type,
        },
      ),
    ).toBeTruthy();

    const emptyEval = evaluateMotionRule([], plankRule, "SIDE");
    expect(emptyEval.detectedErrors).toStrictEqual(["ERR_NO_PERSON_DETECTED"]);

    const squatSpec = specs.find((s) => s.slug === "squat")!;
    const squatRulePath = path.resolve(process.cwd(), "public/models/rules/squat_rule.json");
    const squatRule = parseMotionRule("squat", JSON.parse(fs.readFileSync(squatRulePath, "utf-8")));
    const squatRef = new EdgeRefereeSession(squatRule, "SIDE");
    const halfRepFrames = generateRepTrajectory(squatSpec, 1, "half_rep", false, false);
    let sawDepthWarning = false;
    for (const pts of halfRepFrames) {
      const snap = squatRef.processFrame(pts, undefined, "SIDE");
      if (snap.detectedErrors.includes("ERR_INCORRECT_DEPTH")) {
        sawDepthWarning = true;
      }
    }
    expect(sawDepthWarning).toBeTruthy();
  });

  it("handles Plank transition from standing (65 deg) to flat 0-degree horizontal Plank and resumes hold after >5s form violation", () => {
    const ruleFile = path.resolve(process.cwd(), "public/models/rules/plank_rule.json");
    const rawPlank = JSON.parse(fs.readFileSync(ruleFile, "utf-8"));
    const plankRule = parseMotionRule("plank", rawPlank);
    const plankRef = new EdgeRefereeSession(plankRule, "SIDE");
    const plankSpec = specs.find((s) => s.slug === "plank")!;

    let nowMs = 1000;
    const standingPts = makeBaseSkeleton(false);
    setBilateral(standingPts, 5, 6, 0.5, 0.25);
    setBilateral(standingPts, 11, 12, 0.5, 0.55);
    setBilateral(standingPts, 13, 14, 0.5, 0.75);
    setBilateral(standingPts, 15, 16, 0.5, 0.95);

    const standSnap = plankRef.processFrame(standingPts, nowMs, "SIDE");
    expect(standSnap.repPhase).toBe("REST");
    expect(standSnap.currentAngle).toBeGreaterThan(45);

    for (let i = 0; i < 65; i++) {
      nowMs += 50;
      const flatGoodPts = plankSpec.poseGen(0.5, "good", false);
      setBilateral(flatGoodPts, 5, 6, 0.78, 0.65);
      setBilateral(flatGoodPts, 11, 12, 0.48, 0.65);
      setBilateral(flatGoodPts, 15, 16, 0.2, 0.65);
      plankRef.processFrame(flatGoodPts, nowMs, "SIDE");
    }
    expect(plankRef.getConfirmedValue()).toBe(3);

    for (let i = 0; i < 110; i++) {
      nowMs += 50;
      const badPlankPts = plankSpec.poseGen(0.5, "bad_form", false);
      plankRef.processFrame(badPlankPts, nowMs, "SIDE");
    }
    expect(plankRef.getConfirmedValue()).toBe(3);

    for (let i = 0; i < 65; i++) {
      nowMs += 50;
      const resumedPts = plankSpec.poseGen(0.5, "good", false);
      plankRef.processFrame(resumedPts, nowMs, "SIDE");
    }
    expect(plankRef.getConfirmedValue()).toBe(6);
  });

  it("preserves bilateral side dominance and wrist_symmetry confidence threshold when boostLiveConfidence is enabled", () => {
    const rawKeypoints = Array.from({ length: 17 }, (_, idx) => ({
      score: idx % 2 === 0 ? 0.95 : 0.42,
      x: 320,
      y: 240,
    }));
    rawKeypoints[9] = { score: 0.45, x: 280, y: 200 };
    rawKeypoints[10] = { score: 0.92, x: 360, y: 260 };

    const boosted = keypointsToSkeletonPoints(rawKeypoints, 640, 480, true);
    expect(boosted[5]?.visibility).toBeCloseTo(0.52, 2);
    expect(boosted[6]?.visibility).toBeCloseTo(0.95, 2);
    expect(boosted[9]?.visibility).toBeCloseTo(0.52, 2);

    const pressRulePath = path.resolve(
      process.cwd(),
      "public/models/rules/shoulder_press_rule.json",
    );
    const pressRule = parseMotionRule(
      "shoulder_press",
      JSON.parse(fs.readFileSync(pressRulePath, "utf-8")),
    );
    const evalRes = evaluateMotionRule(boosted, pressRule, "FRONT");
    expect(evalRes.detectedErrors).not.toContain("ERR_WRIST_SYMMETRY");
  });

  it("prioritizes exercise dialogue JSON warning over generic fallback when danger block is absent", () => {
    const pushUpDialoguePath = path.resolve(
      process.cwd(),
      "public/models/dialogue/push_up_dialogue.json",
    );
    const rawPushUpDialogue = JSON.parse(fs.readFileSync(pushUpDialoguePath, "utf-8"));
    const cue = resolveVoiceFeedbackCueText(
      rawPushUpDialogue.voice_feedbacks,
      "ERR_SIGNED_HIP_Y_DIFF",
      2,
      "normal",
      "Form error: signed_hip_y_diff",
      "signed_hip_y_diff",
    );

    expect(cue).toBe(
      rawPushUpDialogue.voice_feedbacks.signed_hip_y_diff.severities.warning.styles.normal.text,
    );
    expect(cue.toLowerCase()).not.toContain("plank");
  });

  it("matches horizontal floor posture in isPoseMatchingStencil when given a backend UUID and exerciseName/rulesUrl", () => {
    const floorPose = {
      keypoints: Array.from({ length: 17 }, () => ({ score: 0.9, x: 320, y: 320 })),
      score: 0.9,
      sourceHeight: 480,
      sourceWidth: 640,
    };
    floorPose.keypoints[5] = { score: 0.95, x: 160, y: 310 };
    floorPose.keypoints[6] = { score: 0.95, x: 160, y: 310 };
    floorPose.keypoints[11] = { score: 0.95, x: 360, y: 325 };
    floorPose.keypoints[12] = { score: 0.95, x: 360, y: 325 };
    floorPose.keypoints[15] = { score: 0.95, x: 520, y: 335 };
    floorPose.keypoints[16] = { score: 0.95, x: 520, y: 335 };

    expect(
      isPoseMatchingStencil(
        "d290f1ee-6c54-4b01-90e6-d701748f0851",
        floorPose,
        "Forearm Plank",
        "/models/rules/plank_rule.json",
      ),
    ).toBe(true);
  });
});
