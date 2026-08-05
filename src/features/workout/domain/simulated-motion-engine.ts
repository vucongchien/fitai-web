/**
 * Camera branch without a model.
 *
 * It uses the real camera (framing and lighting feedback come from actual frames)
 * but synthesises the skeleton, so the whole AI flow — calibration, overlay, rep
 * counting, form cues, the review sheet — is exercisable before the mmpose .onnx
 * files land on S3. `resolveMotionEngine` picks it only when the models are
 * missing, and only outside production.
 */

import { FrameSampler, meanBrightness } from "@/features/workout/domain/frame-sampler";
import {
  type MotionEngine,
  type MotionEngineContext,
  type MotionEventHandler,
  type SetTelemetry,
} from "@/features/workout/domain/motion-engine";
import {
  calibrationDistance,
  calibrationHint,
  calibrationLighting,
  KEYPOINT_NAMES,
  type Keypoint,
  type Pose,
  romPercent,
} from "@/features/workout/domain/pose-metrics";
import {
  type Accumulator,
  feedCounter,
  freshAccumulator,
  summarise,
} from "@/features/workout/domain/set-telemetry";
import type { MotionSpec } from "@/features/workout/model/live-session.types";

/** One rep every ~3 seconds. */
const REP_PERIOD_MS = 3000;
/** A form error roughly every fourth rep, so the cue path is visible. */
const ERROR_EVERY_N_REPS = 4;

/** A plausible standing skeleton that breathes with the rep phase. */
function syntheticPose(width: number, height: number, progress: number): Pose {
  const centreX = width / 2;
  const dip = Math.sin(progress * Math.PI) * height * 0.06;
  const positions: Partial<Record<(typeof KEYPOINT_NAMES)[number], [number, number]>> = {
    left_ankle: [centreX - 30, height * 0.94],
    left_ear: [centreX - 14, height * 0.12],
    left_elbow: [centreX - 52, height * 0.42 + dip * 1.4],
    left_eye: [centreX - 8, height * 0.11],
    left_hip: [centreX - 26, height * 0.56 + dip],
    left_knee: [centreX - 28, height * 0.75 + dip * 0.5],
    left_shoulder: [centreX - 40, height * 0.28 + dip],
    left_wrist: [centreX - 58, height * 0.54 + dip * 1.8],
    nose: [centreX, height * 0.1],
    right_ankle: [centreX + 30, height * 0.94],
    right_ear: [centreX + 14, height * 0.12],
    right_elbow: [centreX + 52, height * 0.42 + dip * 1.4],
    right_eye: [centreX + 8, height * 0.11],
    right_hip: [centreX + 26, height * 0.56 + dip],
    right_knee: [centreX + 28, height * 0.75 + dip * 0.5],
    right_shoulder: [centreX + 40, height * 0.28 + dip],
    right_wrist: [centreX + 58, height * 0.54 + dip * 1.8],
  };

  const keypoints: Keypoint[] = KEYPOINT_NAMES.map((name) => {
    const point = positions[name];
    return point ? { score: 0.92, x: point[0], y: point[1] } : { score: 0, x: 0, y: 0 };
  });
  return { keypoints, score: 0.92 };
}

export class SimulatedMotionEngine implements MotionEngine {
  readonly kind = "simulated" as const;

  private sampler: FrameSampler | null = null;
  private video: HTMLVideoElement | null = null;
  private spec: MotionSpec | null = null;
  private timer: number | null = null;
  private accumulator: Accumulator = freshAccumulator();
  private setStartedAt = 0;
  private tracking = false;

  async prepare(context: MotionEngineContext): Promise<void> {
    this.spec = context.spec;
    this.video = context.video ?? null;
    if (context.video) this.sampler = new FrameSampler(context.video, 160, 213);
  }

  startCalibration(onEvent: MotionEventHandler): void {
    this.stopLoop();
    this.timer = window.setInterval(() => {
      const frame = this.sampler?.grab();
      const lighting = frame ? calibrationLighting(meanBrightness(frame.data)) : "ok";
      const height = this.video?.videoHeight ?? 720;
      const pose = syntheticPose(this.video?.videoWidth ?? 1280, height, 0);
      // The synthetic body is framed correctly by construction, so distance only
      // fails here when the frame itself is unusable.
      const distance = lighting === "low" ? ("unknown" as const) : calibrationDistance(pose, height);
      onEvent({ pose, type: "pose" });
      onEvent({
        distance,
        hint: calibrationHint(distance, lighting),
        lighting,
        ready: lighting === "ok" && distance === "ok",
        type: "calibration",
      });
    }, 250);
  }

  stopCalibration(): void {
    this.stopLoop();
  }

  startSet(onEvent: MotionEventHandler): void {
    this.stopLoop();
    this.accumulator = freshAccumulator();
    this.setStartedAt = Date.now();
    this.tracking = true;

    const spec = this.spec;
    let lastRepCount = 0;

    this.timer = window.setInterval(() => {
      if (!this.tracking || !spec) return;
      const accumulator = this.accumulator;
      accumulator.totalFrames += 1;
      accumulator.validFrames += 1;

      const elapsed = Date.now() - this.setStartedAt;
      const progress = (elapsed % REP_PERIOD_MS) / REP_PERIOD_MS;
      const height = this.video?.videoHeight ?? 720;
      onEvent({ pose: syntheticPose(this.video?.videoWidth ?? 1280, height, progress), type: "pose" });

      // Sweep the tracked joint through its full range once per period.
      const { startDeg, endDeg } = spec.romRange;
      const angle = startDeg + (endDeg - startDeg) * Math.sin(progress * Math.PI);
      const repEvent = feedCounter(accumulator, romPercent(angle, spec.romRange));

      if (repEvent) {
        onEvent(repEvent);
        lastRepCount += 1;
        const rule = spec.rules[0];
        if (rule && lastRepCount % ERROR_EVERY_N_REPS === 0) {
          accumulator.errorCodes.push(rule.code);
          accumulator.pendingErrors.add(rule.code);
          onEvent({
            code: rule.code,
            message: rule.message,
            severity: rule.severity,
            type: "form-error",
          });
        }
      }
    }, 100);
  }

  stopSet(): SetTelemetry {
    this.tracking = false;
    this.stopLoop();
    return summarise(this.accumulator);
  }

  dispose(): void {
    this.tracking = false;
    this.stopLoop();
    this.sampler?.dispose();
    this.sampler = null;
  }

  private stopLoop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}
