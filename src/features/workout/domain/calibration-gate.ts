/**
 * When the framing check owns the screen.
 *
 * Pure module: no React, no browser APIs, so the rule can be asserted directly
 * instead of through a fully wired live session.
 *
 * Calibration is a *pre-set* step (ux-flow-spec §5.3). The motion engine is
 * re-prepared whenever the camera lifecycle effect re-runs — including on the
 * `ready → working` transition — which drops `kind` and `calibration` back to
 * null. Without the `status === "ready"` term the overlay would reappear over a
 * running set, covering Done and +10s and resetting the rep count mid-set.
 */
import type { LiveStatus } from "@/features/workout/model/use-live-session";

export function shouldCalibrate({
  cameraBranch,
  cameraOn,
  cameraReady,
  status,
}: {
  /** This exercise is AI-supported and has not fallen back to manual logging. */
  cameraBranch: boolean;
  /** The user has not switched the preview off. */
  cameraOn: boolean;
  /** The engine has finished preparing and the framing check passes. */
  cameraReady: boolean;
  /**
   * The live session's own status union — typing this as `string` once let a
   * mistyped literal read as "not ready", which re-covered Done and +10s.
   */
  status: LiveStatus;
}): boolean {
  // `cameraOn` matters on its own: with the preview off there is no video to
  // line up in, so an overlay asking the user to line up would be a dead end.
  return cameraBranch && cameraOn && status === "ready" && !cameraReady;
}
