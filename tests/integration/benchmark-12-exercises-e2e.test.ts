// @vitest-environment node
import fs from "fs";
import path from "path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { WebTransportRefereeClient } from "@/features/workout/domain/webtransport-client";
import {
  WorkoutTrackingChallengeType,
  type StreamWorkoutTrackingResponse,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";

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
  "12 Exercises Real Human Video Benchmark Suite (E2E over Network Stream)",
  () => {
    const allResults: ScenarioResult[] = [];
    const startTime = Date.now();

    beforeAll(() => {
      // @ts-expect-error test override for node environment
      globalThis.window = {
        location: {
          hostname: "localhost",
          port: "8080",
          protocol: "http:",
        },
      };
    });

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
        `📊 REAL VIDEO E2E STREAM COMPLETE: ${exactMatches}/${countedScenarios.length} EXACT REP MATCHES (${
          countedScenarios.length > 0
            ? ((exactMatches / countedScenarios.length) * 100).toFixed(1)
            : 0
        }%)`,
      );
      console.log(
        `   MAE: ${mae.toFixed(3)} reps | Avg Frame Latency: ${avgLatency.toFixed(2)}ms | Total Time: ${(
          totalTimeMs / 1000
        ).toFixed(2)}s`,
      );
      console.log(`======================================================\n`);
    });

    for (const exerciseId of CANONICAL_12_EXERCISES) {
      const exDir = path.join(datasetsRoot, exerciseId);
      if (!fs.existsSync(exDir)) continue;

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

          it(`streams real human pose frames for ${videoId}`, async () => {
            const poseDoc = JSON.parse(fs.readFileSync(posePath, "utf-8"));
            const annDoc = JSON.parse(fs.readFileSync(annPath, "utf-8"));
            const metaDoc = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

            const rawAngle = (
              metaDoc.environmental_conditions?.camera_angle || "side"
            ).toLowerCase();
            const cameraAngle = rawAngle === "front_45" ? "diagonal" : rawAngle;
            const challengeType = annDoc.is_timed
              ? WorkoutTrackingChallengeType.DURATION
              : WorkoutTrackingChallengeType.REPS;

            const client = new WebTransportRefereeClient();
            const responses: StreamWorkoutTrackingResponse[] = [];
            const latencies: number[] = [];
            const scenarioStart = Date.now();

            await client.connect({
              cameraAngle,
              challengeType,
              exerciseId,
              sessionId: `real-e2e-${videoId}-${Date.now()}`,
              onResponse: (resp) => {
                responses.push(resp);
              },
            });

            await new Promise((r) => setTimeout(r, 15));

            for (const frame of poseDoc.frames) {
              const landmarks = (frame.keypoints || []).map(
                (k: { x: number; y: number; visibility: number }) => ({
                  score: k.visibility,
                  x: k.x,
                  y: k.y,
                }),
              );
              const sendTime = performance.now();
              await client.sendFrame(landmarks, frame.timestamp_ms, cameraAngle);
              latencies.push(performance.now() - sendTime);
            }

            await client.submit();
            await new Promise((r) => setTimeout(r, 25));
            client.close();

            const durationMs = Date.now() - scenarioStart;
            const avgLatencyMs =
              latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

            const lastResp = responses[responses.length - 1];
            const actualReps = lastResp
              ? lastResp.repsCompleted > 0
                ? lastResp.repsCompleted
                : Math.round(lastResp.holdDurationSeconds)
              : 0;
            const actualErrors = Array.from(
              new Set(responses.flatMap((r) => r.detectedErrors || [])),
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

            expect(responses.length).toBeGreaterThan(0);
            expect(repsPassed).toBe(true);
          }, 20000);
        }
      });
    }
  },
);
