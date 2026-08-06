"use client";

import { ArrowRight, Check, MoveHorizontal, Sun } from "lucide-react";

import type { CameraState } from "@/features/workout/model/use-camera-stream";
import type { CalibrationStatus } from "@/features/workout/model/use-motion-engine";
import { Button } from "@/shared/ui/button";

/**
 * Framing check before an AI set — a screen of its own, as ux-flow-spec §5.3 asks
 * for, with plain "step back / step closer" feedback rather than a number.
 * Assumption-01: 1.5–2 m from the camera, enough light.
 *
 * There is deliberately no "Start the set" button. The orchestrator starts the
 * set the moment the framing check passes, which is the same moment this view
 * closes — so a start control could only ever render disabled. Instead the view
 * says what it is waiting for.
 *
 * It never traps the user: manual logging is one tap away at all times.
 */
export function CalibrationView({
  calibration,
  cameraState,
  onRetryPermission,
  onUseManual,
  recommendedAngle,
}: {
  calibration: CalibrationStatus | null;
  cameraState: CameraState;
  recommendedAngle: string;
  onUseManual: () => void;
  onRetryPermission: () => void;
}) {
  const blocked = cameraState === "denied" || cameraState === "unavailable";
  const distanceOk = calibration?.distance === "ok";
  const lightOk = calibration?.lighting === "ok";
  const ready = Boolean(calibration?.ready);

  return (
    <div className="calibration">
      <div className="calibration__panel">
        <p className="utility-label">Camera check</p>
        <p className="calibration__hint" aria-live="polite">
          {blocked
            ? "Without the camera this set is logged by hand — nothing else changes."
            : (calibration?.hint ?? "Getting the camera ready…")}
        </p>

        {!blocked ? (
          <ul className="calibration__checks">
            <li data-ok={distanceOk || undefined}>
              {distanceOk ? (
                <Check aria-hidden="true" size={16} />
              ) : (
                <MoveHorizontal aria-hidden="true" size={16} />
              )}
              About two metres away
            </li>
            <li data-ok={lightOk || undefined}>
              {lightOk ? (
                <Check aria-hidden="true" size={16} />
              ) : (
                <Sun aria-hidden="true" size={16} />
              )}
              Enough light to see you
            </li>
            <li data-ok>
              <Check aria-hidden="true" size={16} />
              Best angle: {recommendedAngle}
            </li>
          </ul>
        ) : null}

        <div className="calibration__actions">
          {blocked ? (
            <>
              <Button onClick={onUseManual} size="large">
                Log this set by hand
                <ArrowRight aria-hidden="true" size={18} />
              </Button>
              {cameraState === "denied" ? (
                <button className="text-action" onClick={onRetryPermission} type="button">
                  Try the camera again
                </button>
              ) : null}
            </>
          ) : (
            <>
              <p aria-live="polite" className="calibration__status">
                {ready ? "Starting the set…" : "The set starts on its own once you are lined up."}
              </p>
              <Button onClick={onUseManual} size="large" variant="secondary">
                Skip the camera for this set
                <ArrowRight aria-hidden="true" size={18} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
