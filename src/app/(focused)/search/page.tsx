import { connection } from "next/server";

import { exerciseSearchRepository } from "@/features/exercise/api/search-repository";
import { SearchExperience } from "@/features/exercise/ui/search-experience";

export const metadata = { title: "Search" };
export const instant = false;

export default async function SearchPage() {
  await connection();
  const [exercises, catalog] = await Promise.all([
    exerciseSearchRepository.search({
      q: "",
      bodyPartIds: [],
      equipmentIds: [],
      targetMuscleIds: [],
      difficulty: [],
      tagIds: [],
      aiOnly: false,
    }),
    exerciseSearchRepository.getCatalog(),
  ]);

  return <SearchExperience exercises={exercises} catalog={catalog} />;
}
