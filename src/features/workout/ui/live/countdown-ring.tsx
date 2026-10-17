"use client";

// Countdown instrument for workout screens.
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

  const getDynamicStroke = () => {
    if (progress === null) return undefined;
    if (progress >= 1.0) return "var(--color-recovery-strong)";
    if (progress >= 0.5) return "var(--color-action)";
    return "var(--color-effort)";
  };

  const dynamicStroke = getDynamicStroke();

  const valueStyle: React.CSSProperties =
    display.length > 8 ? { fontSize: "0.8rem" } : display.length > 6 ? { fontSize: "0.92rem" } : {};

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
