export type MotionEngineEvent =
  | { type: "camera-ready" }
  | { type: "camera-blocked"; reason: string }
  | { type: "rep"; count: number }
  | { type: "form-note"; code: string; message: string };

export interface MotionEngine {
  prepare(exerciseId: string): Promise<void>;
  calibrate(): Promise<void>;
  start(onEvent: (event: MotionEngineEvent) => void): Promise<void>;
  stop(): Promise<void>;
}

export class ManualMotionEngine implements MotionEngine {
  async prepare() {}
  async calibrate() {}
  async start() {}
  async stop() {}
}
