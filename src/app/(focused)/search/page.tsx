import { exerciseSearchRepository } from "@/features/exercise/api/search-repository";
import { SearchExperience } from "@/features/exercise/ui/search-experience";

export const metadata = { title: "Search" };

export default async function SearchPage() {
  const [exercises, catalog] = await Promise.all([
    exerciseSearchRepository.search({
      q: "",
      bodyPartIds: [],
      equipmentIds: [],
      difficulty: [],
      tagIds: [],
      aiOnly: false,
    }),
    exerciseSearchRepository.getCatalog(),
  ]);

  return <SearchExperience exercises={exercises} catalog={catalog} />;
}
