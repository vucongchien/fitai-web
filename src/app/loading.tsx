import { LaneSkeleton } from "@/shared/ui/lane-skeleton";

export default function Loading() {
  return (
    <main className="route-loading">
      <LaneSkeleton />
      <div className="route-loading__copy">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
