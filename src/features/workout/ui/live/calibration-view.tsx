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
 * It never traps the user: manual logging is one tap away at all times.
 */
export function CalibrationView({
  calibration,
  cameraState,
  onRetryPermission,
  onStart,
  onUseManual,
  recommendedAngle,
}: {
  calibration: CalibrationStatus | null;
  cameraState: CameraState;
  recommendedAngle: string;
  onStart: () => void;
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
              <Button disabled={!ready} onClick={onStart} size="large">
                {ready ? "Start the set" : "Line yourself up"}
                <ArrowRight aria-hidden="true" size={18} />
              </Button>
              <button className="text-action" onClick={onUseManual} type="button">
                Skip the camera for this set
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
