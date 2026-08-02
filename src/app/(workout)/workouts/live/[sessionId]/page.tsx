import { LiveWorkout } from "@/features/workout/ui/live-workout";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Live workout" };

export default async function LiveWorkoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return (
    <PageTransition>
      <LiveWorkout sessionId={sessionId} />
    </PageTransition>
  );
}
