// Picks the motion engine for an exercise: WorkerMotionEngine vs Manual

import { ManualMotionEngine } from "@/features/workout/domain/motion-engine";
import type { MotionEngine } from "@/features/workout/domain/motion-engine";
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

  return new ManualMotionEngine();
}
