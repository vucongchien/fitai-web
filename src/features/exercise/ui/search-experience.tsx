"use client";

import { ArrowLeft, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  type CatalogMetadata,
  countActiveFilters,
  DIFFICULTY_ORDER,
  type Difficulty,
  EMPTY_FILTERS,
  type ExerciseFilters,
  type ExerciseSummary,
  filterExercises,
  sortExercises,
} from "@/features/exercise/domain/exercise";
import { ExerciseCard } from "@/features/exercise/ui/exercise-card";
import { FilterPanel } from "@/features/exercise/ui/filter-panel";
import { EmptyState } from "@/shared/ui/empty-state";

type SearchExperienceProps = {
  exercises: ExerciseSummary[];
  catalog: CatalogMetadata;
};

function parseFilters(params: URLSearchParams, catalog: CatalogMetadata): ExerciseFilters {
  const bodyPartIds = params
    .getAll("body")
    .filter((id) => catalog.bodyParts.some((entry) => entry.id === id));
  const equipmentIds = params
    .getAll("equipment")
    .filter((id) => catalog.equipments.some((entry) => entry.id === id));
  const tagIds = params.getAll("tag").filter((id) => catalog.tags.some((entry) => entry.id === id));
  const difficulty = params
    .getAll("level")
    .filter((entry): entry is Difficulty => DIFFICULTY_ORDER.includes(entry as Difficulty));
  return {
    q: params.get("q") ?? "",
    bodyPartIds,
    equipmentIds,
    difficulty,
    tagIds,
    aiOnly: params.get("ai") === "1",
  };
}

function toSearchString(filters: ExerciseFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  for (const id of filters.bodyPartIds) params.append("body", id);
  for (const id of filters.equipmentIds) params.append("equipment", id);
  for (const id of filters.tagIds) params.append("tag", id);
  for (const level of filters.difficulty) params.append("level", level);
  if (filters.aiOnly) params.set("ai", "1");
  return params.toString();
}

export function SearchExperience({ exercises, catalog }: SearchExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const [filters, setFilters] = useState<ExerciseFilters>(() =>
    parseFilters(new URLSearchParams(searchParams), catalog),
  );
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const syncUrl = useCallback(
    (next: ExerciseFilters) => {
      const qs = toSearchString(next);
      const target = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => {
        router.replace(target, { scroll: false });
      });
    },
    [pathname, router],
  );

  const updateFilters = useCallback(
    (next: ExerciseFilters) => {
      setFilters(next);
      syncUrl(next);
    },
    [syncUrl],
  );

  const results = useMemo(
    () => sortExercises(filterExercises(exercises, filters, catalog), "relevance"),
    [exercises, filters, catalog],
  );

  const activeCount = countActiveFilters(filters);

  return (
    <div className="focused-page search-focus">
      <header className="focused-header search-header">
        <Link
          aria-label="Back"
          className="focused-header__back"
          href="/home"
          transitionTypes={["nav-back"]}
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>

        <label className="search-field">
          <Search aria-hidden="true" size={18} strokeWidth={2} />
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            placeholder="Find movements, muscles, tags"
            value={filters.q}
            onChange={(event) => updateFilters({ ...filters, q: event.target.value })}
            aria-label="Search exercises"
          />
          {filters.q ? (
            <button
              aria-label="Clear search"
              className="search-field__clear"
              onClick={() => updateFilters({ ...filters, q: "" })}
              type="button"
            >
              <X aria-hidden="true" size={16} />
            </button>
          ) : null}
        </label>

        <button
          aria-expanded={panelOpen}
          aria-label={activeCount === 0 ? "Filters" : `Filters, ${activeCount} active`}
          className="icon-button"
          data-active={activeCount > 0 || undefined}
          onClick={() => setPanelOpen(true)}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={18} strokeWidth={2} />
          {activeCount > 0 ? <span className="icon-button__badge">{activeCount}</span> : null}
        </button>
      </header>

      <main className="focused-main">
        <div className="search-meta">
          <span>
            {results.length} of {exercises.length} movements
          </span>
          {activeCount > 0 ? (
            <button
              className="text-button"
              onClick={() => updateFilters({ ...EMPTY_FILTERS, q: filters.q })}
              type="button"
            >
              Reset filters
            </button>
          ) : null}
        </div>

        {results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No movements match"
            description="Try removing a filter or broadening the search."
            action={
              <button
                className="secondary-button"
                onClick={() => updateFilters(EMPTY_FILTERS)}
                type="button"
              >
                Reset search
              </button>
            }
          />
        ) : (
          <ol className="ex-grid">
            {results.map((exercise) => (
              <li key={exercise.id}>
                <ExerciseCard exercise={exercise} catalog={catalog} />
              </li>
            ))}
          </ol>
        )}
      </main>

      <FilterPanel
        open={panelOpen}
        filters={filters}
        catalog={catalog}
        resultCount={results.length}
        onChange={updateFilters}
        onClear={() => updateFilters({ ...EMPTY_FILTERS, q: filters.q })}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}
