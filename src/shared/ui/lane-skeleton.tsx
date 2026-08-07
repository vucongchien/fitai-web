export function LaneSkeleton({ label = "Loading your plan" }: { label?: string }) {
  return (
    <output aria-busy="true" aria-label={label} className="lane-skeleton">
      <span className="lane-skeleton__track" />
      <span className="lane-skeleton__marker" />
      <span className="sr-only">{label}</span>
    </output>
  );
}
