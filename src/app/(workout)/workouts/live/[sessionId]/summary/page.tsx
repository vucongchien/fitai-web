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
    <div className="min-h-screen bg-white sm:bg-canvas px-0 sm:px-4 pt-4 sm:pt-6 pb-12">
      <div className="w-full max-w-[640px] mx-auto bg-white overflow-hidden shadow-none rounded-none border-0 sm:rounded-[24px] sm:border sm:border-neutral-300 p-6 sm:p-8">
        <div
          aria-busy="true"
          aria-label="Loading workout summary"
          className="workout-prep-skeleton"
        >
          <div className="skeleton-box h-48 w-full rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)]" />
        </div>
      </div>
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
