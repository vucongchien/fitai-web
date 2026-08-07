import { notFound } from "next/navigation";
import { Suspense } from "react";

import { WorkoutSummaryView } from "@/features/workout/ui/live/workout-summary-view";

export const metadata = { title: "Workout Summary | FITAI" };

async function SummaryContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await paramsPromise;

  if (!sessionId || typeof sessionId !== "string" || sessionId.trim() === "") {
    notFound();
  }

  return <WorkoutSummaryView sessionId={sessionId.trim()} />;
}

function SummarySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading workout summary"
      className="workout-prep-skeleton px-4 py-8"
    >
      <div className="skeleton-box h-48 w-full rounded-[14px] bg-[var(--color-surface-hover,#eee)]" />
    </div>
  );
}

export default function WorkoutSummaryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  return (
    <Suspense fallback={<SummarySkeleton />}>
      <SummaryContent paramsPromise={params} />
    </Suspense>
  );
}
