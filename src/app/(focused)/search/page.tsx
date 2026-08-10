import { connection } from "next/server";

import { exerciseSearchRepository } from "@/features/exercise/api/search-repository";
import { SearchExperience } from "@/features/exercise/ui/search-experience";

export const metadata = { title: "Search" };
export const instant = false;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  await connection();
  const rawParams = searchParams ? await searchParams : {};
  const catalog = await exerciseSearchRepository.getCatalog();

  const q = typeof rawParams.q === "string" ? rawParams.q : (typeof rawParams.query === "string" ? rawParams.query : "");
  const bodyPartIds = Array.isArray(rawParams.body)
    ? rawParams.body
    : typeof rawParams.body === "string"
      ? [rawParams.body]
      : [];
  const equipmentIds = Array.isArray(rawParams.equipment)
    ? rawParams.equipment
    : typeof rawParams.equipment === "string"
      ? [rawParams.equipment]
      : [];

  const initialFilters = {
    q,
    bodyPartIds,
    equipmentIds,
    targetMuscleIds: [],
    difficulty: [],
    tagIds: [],
    aiOnly: rawParams.ai === "1",
  };

  const exercises = await exerciseSearchRepository.search(initialFilters);

  return <SearchExperience initialExercises={exercises} catalog={catalog} />;
}
