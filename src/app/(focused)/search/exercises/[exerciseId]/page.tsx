import { notFound } from "next/navigation";
import { Suspense } from "react";

import { exerciseSearchRepository } from "@/features/exercise/api/search-repository";
import { ExerciseDetail } from "@/features/exercise/ui/exercise-detail";

export async function generateMetadata({ params }: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = await params;
  const exercise = await exerciseSearchRepository.getById(exerciseId);
  return { title: exercise?.name ?? "Exercise" };
}

async function ExerciseDetailContent({ exerciseId }: { exerciseId: string }) {
  const [exercise, catalog] = await Promise.all([
    exerciseSearchRepository.getById(exerciseId),
    exerciseSearchRepository.getCatalog(),
  ]);

  if (!exercise) notFound();

  return <ExerciseDetail exercise={exercise} catalog={catalog} />;
}

function ExerciseDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 w-3/4 bg-gray-300 rounded" />
      <div className="h-64 w-full bg-gray-300 rounded" />
      <div className="h-32 w-full bg-gray-300 rounded" />
    </div>
  );
}

async function ExerciseDetailAsync({ params }: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = await params;
  return <ExerciseDetailContent exerciseId={exerciseId} />;
}

export default function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  return (
    <Suspense fallback={<ExerciseDetailSkeleton />}>
      <ExerciseDetailAsync params={params} />
    </Suspense>
  );
}
