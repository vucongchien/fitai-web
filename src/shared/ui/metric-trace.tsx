import { cn } from "@/shared/lib/cn";

type MetricTraceProps = {
  label: string;
  points: number[];
  tone?: "blue" | "coral" | "green";
  value: string;
};

function geometryFor(points: number[]) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);
  const step = 100 / Math.max(points.length - 1, 1);

  const coordinates = points.map((point, index) => {
    const x = index * step;
    const y = 88 - ((point - min) / range) * 66;
    return { x, y };
  });

  return {
    endpoint: coordinates.at(-1) ?? { x: 100, y: 55 },
    path: coordinates
      .map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(" "),
  };
}

export function MetricTrace({ label, points, tone = "blue", value }: MetricTraceProps) {
  const geometry = geometryFor(points);

  return (
    <figure className={cn("metric-trace", `metric-trace--${tone}`)}>
      <figcaption>
        <span>{label}</span>
        <strong>{value}</strong>
      </figcaption>
      <svg
        aria-label={`${label}: ${value}`}
        preserveAspectRatio="none"
        role="img"
        viewBox="0 0 100 100"
      >
        <path className="metric-trace__baseline" d="M 0 88 L 100 88" />
        <path className="metric-trace__line" d={geometry.path} />
        <circle cx={geometry.endpoint.x} cy={geometry.endpoint.y} r="3.2" />
      </svg>
    </figure>
  );
}
