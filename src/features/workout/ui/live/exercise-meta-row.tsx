function formatCameraAngle(angle?: string): string | null {
  if (!angle) {
    return null;
  }
  const lower = angle.toLowerCase().trim();
  if (lower === "side") {
    return "Side view";
  }
  if (lower === "front") {
    return "Front view";
  }
  if (lower.includes("45")) {
    return "45° view";
  }
  return `${angle} view`;
}

export function ExerciseMetaRow({
  currentSet,
  name,
  recommendedAngle,
  target,
  totalSets,
}: {
  name: string;
  recommendedAngle?: string;
  target: string;
  currentSet: number;
  totalSets: number;
}) {
  const angleLabel = formatCameraAngle(recommendedAngle);

  return (
    <div className="live-meta">
      {/* Row one: what you are doing, and where you are in it. */}
      <div className="live-meta__top">
        <p className="live-meta__name">
          <span>{name}</span>
          {angleLabel ? (
            <span className="live-meta__angle-badge">
              ({angleLabel})
            </span>
          ) : null}
        </p>

        {/* Spaces sit inside the spans, not in a flex gap */}
        <p className="live-meta__sets">
          <span className="live-meta__sets-current">{currentSet}</span>
          <span className="live-meta__sets-total">
            {" / "}
            {totalSets} {totalSets === 1 ? "Set" : "Sets"}
          </span>
        </p>
      </div>

      {/* Row two: the prescription */}
      <p className="live-meta__target">{target}</p>
    </div>
  );
}
