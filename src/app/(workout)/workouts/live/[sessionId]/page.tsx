import { Suspense } from "react";

import { getLiveSessionData } from "@/features/workout/server/get-live-session-data";
import { LiveWorkout } from "@/features/workout/ui/live/live-workout";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Live workout" };

async function LiveWorkoutContent({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const plan = await getLiveSessionData(sessionId);
  return <LiveWorkout plan={plan} />;
}

function LiveWorkoutSkeleton() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse space-y-4">
        <div className="h-12 w-48 bg-gray-300 rounded" />
        <div className="h-64 w-96 bg-gray-300 rounded" />
      </div>
    </div>
  );
}

export default function LiveWorkoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <PageTransition>
      <Suspense fallback={<LiveWorkoutSkeleton />}>
        <LiveWorkoutContent params={params} />
      </Suspense>
    </PageTransition>
  );
}
