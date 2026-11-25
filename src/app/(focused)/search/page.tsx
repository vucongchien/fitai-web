import { connection } from "next/server";

import { exerciseSearchRepository } from "@/features/exercise/api/search-repository";
import { parseFilterParams } from "@/features/exercise/domain/exercise";
import { SearchExperience } from "@/features/exercise/ui/search-experience";

export const metadata = { title: "Search" };
export const instant = false;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function toUrlSearchParams(raw: Awaited<SearchParams>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const entry of Array.isArray(value) ? value : value ? [value] : []) {
      params.append(key, entry);
    }
  }
  return params;
}

export default async function SearchPage({ searchParams }: { searchParams?: SearchParams }) {
  await connection();
  const rawParams = searchParams ? await searchParams : {};
  const exercises = await exerciseSearchRepository.search(
    parseFilterParams(toUrlSearchParams(rawParams)),
  );

  return <SearchExperience initialExercises={exercises} />;
}
