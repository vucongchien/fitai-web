import { notFound } from "next/navigation";

import { exerciseSearchRepository } from "@/features/exercise/api/search-repository";
import { ExerciseDetail } from "@/features/exercise/ui/exercise-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const exercise = await exerciseSearchRepository.getById(exerciseId);
  return { title: exercise?.name ?? "Exercise" };
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const [exercise, catalog] = await Promise.all([
    exerciseSearchRepository.getById(exerciseId),
    exerciseSearchRepository.getCatalog(),
  ]);

  if (!exercise) notFound();

  return <ExerciseDetail exercise={exercise} catalog={catalog} />;
}
