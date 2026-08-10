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
  tone: "effort" | "recovery" | "action";
  label: string;
}) {
  const filled = progress === null ? null : Math.min(1, Math.max(0, progress));

  // Dynamic stroke color based on completion percentage:
  // < 50%: Coral Red (#ff5252)
  // 50% - 99%: Vibrant Blue (#3b82f6)
  // >= 100%: Emerald Green (#10b981) for target met or exceeded (10/8, 20/8)!
  const getDynamicStroke = () => {
    if (progress === null) return undefined;
    if (progress >= 1.0) return "#10b981"; // Emerald green for >= 100%
    if (progress >= 0.5) return "#3b82f6"; // Blue for 50-99%
    return "#ff5252"; // Coral red for < 50%
  };

  const dynamicStroke = getDynamicStroke();

  const valueStyle: React.CSSProperties =
    display.length > 8
      ? { fontSize: "0.8rem" }
      : display.length > 6
        ? { fontSize: "0.92rem" }
        : {};

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
            className="countdown-ring__arc transition-all duration-300"
            cx={SIZE / 2}
            cy={SIZE / 2}
            fill="none"
            r={RADIUS}
            stroke={dynamicStroke}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
            strokeLinecap="round"
            strokeWidth={STROKE}
            style={dynamicStroke ? { stroke: dynamicStroke } : undefined}
          />
        )}
      </svg>

      <span className="countdown-ring__value" style={valueStyle}>
        {display}
      </span>
    </div>
  );
}
