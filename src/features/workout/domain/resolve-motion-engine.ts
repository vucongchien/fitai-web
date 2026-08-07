/**
 * Picks the motion engine for an exercise.
 *
 *   models reachable          → WorkerMotionEngine (mmpose inference in a worker)
 *   models missing, dev build → SimulatedMotionEngine (full UI, synthetic reps)
 *   models missing, prod      → ManualMotionEngine (silently the non-AI branch)
 *
 * The probe is a HEAD request, so a session never blocks on a multi-megabyte
 * download just to find out the model is not there.
 */

import { ManualMotionEngine } from "@/features/workout/domain/motion-engine";
import type { MotionEngine } from "@/features/workout/domain/motion-engine";
import { SimulatedMotionEngine } from "@/features/workout/domain/simulated-motion-engine";
import { WorkerMotionEngine } from "@/features/workout/domain/worker-motion-engine";
import type { MotionSpec } from "@/features/workout/model/live-session.types";

async function isReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function resolveMotionEngine(spec: MotionSpec | null): Promise<MotionEngine> {
  if (!spec) {
    return new ManualMotionEngine();
  }

  if (await isReachable(spec.onnxSkeletonUrl)) {
    return new WorkerMotionEngine();
  }

  return process.env.NODE_ENV === "production"
    ? new ManualMotionEngine()
    : new SimulatedMotionEngine();
}
