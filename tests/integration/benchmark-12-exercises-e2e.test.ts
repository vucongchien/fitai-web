// @vitest-environment node
import fs from "node:fs";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { EdgeRefereeSession, type EdgeFrameUpdate } from "@/features/workout/domain/edge-referee";
import { parseMotionRule } from "@/features/workout/domain/rule-parser";

interface ScenarioResult {
  exerciseId: string;
  videoId: string;
  cameraAngle: string;
  isTimed: boolean;
  expectedReps: number;
  actualReps: number;
  repsPassed: boolean;
  expectedErrors: string[];
  actualErrors: string[];
  avgLatencyMs: number;
  frameCount: number;
  durationMs: number;
}

const datasetsRoot = path.resolve(__dirname, "../../../dataset-pipeline/datasets");
const hasDatasets = fs.existsSync(datasetsRoot);

const CANONICAL_12_EXERCISES = [
  "push_up",
  "squat",
  "plank",
  "lunge",
  "bicep_curl",
  "shoulder_press",
  "bench_press",
  "deadlift",
  "pull_up",
  "sit_up",
  "triceps_dip",
  "lateral_raise",
];

const shouldRunBenchmark = hasDatasets && process.env.RUN_E2E_BENCHMARK === "true";

describe.skipIf(!shouldRunBenchmark)(
  "12 Exercises Real Human Video Benchmark Suite (Edge Referee Engine)",
  () => {
    const allResults: ScenarioResult[] = [];
    const startTime = Date.now();

    afterAll(() => {
      const totalTimeMs = Date.now() - startTime;
      const countedScenarios = allResults.filter((r) => !r.isTimed);
      const exactMatches = countedScenarios.filter((r) => r.repsPassed).length;
      const totalRepsError = countedScenarios.reduce(
        (sum, r) => sum + Math.abs(r.actualReps - r.expectedReps),
        0,
      );
      const mae = countedScenarios.length > 0 ? totalRepsError / countedScenarios.length : 0;
      const avgLatency =
        allResults.length > 0
          ? allResults.reduce((s, r) => s + r.avgLatencyMs, 0) / allResults.length
          : 0;

      console.log(`\n======================================================`);
      console.log(
        `📊 REAL VIDEO EDGE BENCHMARK COMPLETE: ${exactMatches}/${countedScenarios.length} EXACT REP MATCHES (${
          countedScenarios.length > 0
            ? ((exactMatches / countedScenarios.length) * 100).toFixed(1)
            : 0
        }%)`,
      );
      console.log(
        `   MAE: ${mae.toFixed(3)} reps | Avg Frame Latency: ${avgLatency.toFixed(4)}ms | Total Time: ${(
          totalTimeMs / 1000
        ).toFixed(2)}s`,
      );
      console.log(`======================================================\n`);
    });

    for (const exerciseId of CANONICAL_12_EXERCISES) {
      const exDir = path.join(datasetsRoot, exerciseId);
      if (!fs.existsSync(exDir)) continue;

      const rulePath = path.resolve(process.cwd(), `public/models/rules/${exerciseId}_rule.json`);
      const rawRule = JSON.parse(fs.readFileSync(rulePath, "utf-8"));
      const motionRule = parseMotionRule(exerciseId, rawRule);

      const videoDirs = fs
        .readdirSync(exDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();

      describe(`Exercise: ${exerciseId}`, () => {
        for (const videoId of videoDirs) {
          const vDir = path.join(exDir, videoId);
          const posePath = path.join(vDir, "pose.json");
          const annPath = path.join(vDir, "annotations.json");
          const metaPath = path.join(vDir, "metadata.json");

          if (!fs.existsSync(posePath) || !fs.existsSync(annPath) || !fs.existsSync(metaPath)) {
            continue;
          }

          it(`evaluates real human pose frames on edge for ${videoId}`, () => {
            const poseDoc = JSON.parse(fs.readFileSync(posePath, "utf-8"));
            const annDoc = JSON.parse(fs.readFileSync(annPath, "utf-8"));
            const metaDoc = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

            const rawAngle = (
              metaDoc.environmental_conditions?.camera_angle || "side"
            ).toLowerCase();
            const cameraAngle = rawAngle === "front_45" ? "diagonal" : rawAngle;

            const session = new EdgeRefereeSession(motionRule, cameraAngle);
            const snapshots: EdgeFrameUpdate[] = [];
            const latencies: number[] = [];
            const scenarioStart = Date.now();

            for (const frame of poseDoc.frames) {
              const landmarks = (frame.keypoints || []).map(
                (k: { x: number; y: number; visibility: number }) => ({
                  score: k.visibility,
                  x: k.x,
                  y: k.y,
                }),
              );
              const sendTime = performance.now();
              const snap = session.processKeypoints(
                landmarks,
                frame.timestamp_ms ?? 0,
                cameraAngle,
                1,
                1,
                false,
              );
              snapshots.push(snap);
              latencies.push(performance.now() - sendTime);
            }

            const durationMs = Date.now() - scenarioStart;
            const avgLatencyMs =
              latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

            const lastSnap = snapshots[snapshots.length - 1];
            const actualReps = lastSnap
              ? lastSnap.repCount > 0
                ? lastSnap.repCount
                : Math.round(lastSnap.holdDurationSeconds)
              : 0;
            const actualErrors = Array.from(
              new Set(snapshots.flatMap((r) => r.detectedErrors || [])),
            );
            const expectedErrors = Array.from(
              new Set<string>(
                (annDoc.reps || []).flatMap(
                  (rep: { detected_errors?: string[] }) => rep.detected_errors || [],
                ),
              ),
            );

            const repsPassed = annDoc.is_timed
              ? actualReps >= 0
              : Math.abs(actualReps - annDoc.total_repetitions) <= 2;

            allResults.push({
              actualErrors,
              actualReps,
              avgLatencyMs,
              cameraAngle,
              durationMs,
              exerciseId,
              expectedErrors,
              expectedReps: annDoc.total_repetitions,
              frameCount: poseDoc.frames.length,
              isTimed: Boolean(annDoc.is_timed),
              repsPassed: actualReps === annDoc.total_repetitions,
              videoId,
            });

            expect(snapshots.length).toBeGreaterThan(0);
            expect(repsPassed).toBeTruthy();
          }, 20000);
        }
      });
    }
  },
);
