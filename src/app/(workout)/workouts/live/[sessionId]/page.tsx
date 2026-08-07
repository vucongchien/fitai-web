import { Suspense } from "react";

import { getLiveSessionData } from "@/features/workout/server/get-live-session-data";
import { LiveWorkout } from "@/features/workout/ui/live/live-workout";
import { LaneSkeleton } from "@/shared/ui/lane-skeleton";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Live workout" };

/** Static element, hoisted so the fallback identity is stable across renders. */
const LIVE_FALLBACK = <LaneSkeleton label="Loading your session" />;

async function LiveWorkoutContent({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const plan = await getLiveSessionData(sessionId);
  return <LiveWorkout plan={plan} />;
}

export default function LiveWorkoutPage({ params }: { params: Promise<{ sessionId: string }> }) {
  return (
    <PageTransition>
      <Suspense fallback={LIVE_FALLBACK}>
        <LiveWorkoutContent params={params} />
      </Suspense>
    </PageTransition>
  );
}
