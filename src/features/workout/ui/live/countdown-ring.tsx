"use client";

/**
 * The countdown instrument for both live screens.
 *
 * The arc is the single accent its screen is allowed (DESIGN.md, One Leader
 * Rule): Sprint Coral while working, Field Green while recovering. Everything
 * else on the screen stays neutral.
 */

/** Geometry in SVG user units; the element scales via CSS. */
const SIZE = 100;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownRing({
  display,
  label,
  progress,
  tone,
}: {
  display: string;
  progress: number | null;
  tone: "effort" | "recovery";
  label: string;
}) {
  const filled = progress === null ? null : Math.min(1, Math.max(0, progress));

  return (
    <div aria-label={label} className="countdown-ring" data-tone={tone} role="timer">
      <svg aria-hidden="true" className="countdown-ring__svg" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          className="countdown-ring__track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          fill="none"
          r={RADIUS}
          strokeWidth={STROKE}
        />
        {filled === null ? null : (
          <circle
            className="countdown-ring__arc"
            cx={SIZE / 2}
            cy={SIZE / 2}
            fill="none"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
            strokeLinecap="round"
            strokeWidth={STROKE}
          />
        )}
      </svg>

      <span className="countdown-ring__value">{display}</span>
    </div>
  );
}
