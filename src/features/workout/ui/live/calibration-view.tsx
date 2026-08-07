"use client";

import { ArrowRight, Check, MoveHorizontal, Sun } from "lucide-react";
import { useEffect, useRef } from "react";

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
  const panelRef = useRef<HTMLDivElement>(null);

  // A full-viewport blocking layer has to behave like one: focus moves in on
  // Mount, comes back out on unmount, and the screen underneath is unreachable
  // While it is up. Without this, Done, +10s, the header buttons and the
  // Tabbable coaching panel all stayed keyboard-reachable behind the overlay.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    // `inert` is the whole focus trap in one attribute. Browsers without it
    // (pre-2023 Safari/Firefox) ignore the attribute and keep the old
    // Behaviour — a degraded overlay, not a broken one.
    const background = document.querySelector(".live-screen");
    const supportsInert = typeof HTMLElement !== "undefined" && "inert" in HTMLElement.prototype;
    if (supportsInert) {background?.setAttribute("inert", "");}

    return () => {
      if (supportsInert) {background?.removeAttribute("inert");}
      previouslyFocused?.focus?.();
    };
  }, []);

  const blocked = cameraState === "denied" || cameraState === "unavailable";
  const distanceOk = calibration?.distance === "ok";
  const lightOk = calibration?.lighting === "ok";
  const ready = Boolean(calibration?.ready);

  return (
    <div aria-label="Camera check" aria-modal="true" className="calibration" role="dialog">
      <div className="calibration__panel" ref={panelRef} tabIndex={-1}>
        <p className="utility-label">Camera check</p>
        <p className="calibration__hint" aria-live="polite">
          {blocked
            ? "Without the camera this set is logged by hand — nothing else changes."
            : (calibration?.hint ?? "Getting the camera ready…")}
        </p>

        {blocked ? null : (
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
        )}

        <div className="calibration__actions">
          {blocked ? (
            <>
              {/* Secondary, not solid Relay Blue: DESIGN.md reserves Blue for
                  navigation, focus and planning, and neither live screen may
                  carry a second accent. */}
              <Button onClick={onUseManual} size="large" variant="secondary">
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
