import { notFound } from "next/navigation";

import { WorkoutSummaryView } from "@/features/workout/ui/live/workout-summary-view";

export const metadata = { title: "Workout Summary | FITAI" };

export default async function WorkoutSummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  if (!sessionId || typeof sessionId !== "string" || sessionId.trim() === "") {
    notFound();
  }

  return <WorkoutSummaryView sessionId={sessionId.trim()} />;
}
