export function LaneSkeleton({ label = "Loading your plan" }: { label?: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="lane-skeleton" role="status">
      <span className="lane-skeleton__track" />
      <span className="lane-skeleton__marker" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
