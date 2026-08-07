"use client";

import { ArrowLeft, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  countActiveFilters,
  DIFFICULTY_ORDER,
  EMPTY_FILTERS,
  filterExercises,
  sortExercises,
} from "@/features/exercise/domain/exercise";
import type {
  CatalogMetadata,
  Difficulty,
  ExerciseFilters,
  ExerciseSummary,
} from "@/features/exercise/domain/exercise";
import { ExerciseCard } from "@/features/exercise/ui/exercise-card";
import { FilterPanel } from "@/features/exercise/ui/filter-panel";
import { EmptyState } from "@/shared/ui/empty-state";
import { NAV_BACK } from "@/shared/ui/transition-types";

interface SearchExperienceProps {
  exercises: ExerciseSummary[];
  catalog: CatalogMetadata;
}

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
  if (filters.q) {
    params.set("q", filters.q);
  }
  for (const id of filters.bodyPartIds) {
    params.append("body", id);
  }
  for (const id of filters.equipmentIds) {
    params.append("equipment", id);
  }
  for (const id of filters.tagIds) {
    params.append("tag", id);
  }
  for (const level of filters.difficulty) {
    params.append("level", level);
  }
  if (filters.aiOnly) {
    params.set("ai", "1");
  }
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

  const setQuery = useCallback(
    (q: string) => {
      updateFilters({ ...filters, q });
    },
    [filters, updateFilters],
  );

  const clearQuery = useCallback(() => setQuery(""), [setQuery]);

  /** Drops every facet but keeps what the user typed. */
  const clearFacets = useCallback(() => {
    updateFilters({ ...EMPTY_FILTERS, q: filters.q });
  }, [filters.q, updateFilters]);

  const resetSearch = useCallback(() => {
    updateFilters(EMPTY_FILTERS);
  }, [updateFilters]);

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

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
          transitionTypes={NAV_BACK}
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
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search exercises"
          />
          {filters.q ? (
            <button
              aria-label="Clear search"
              className="search-field__clear"
              onClick={clearQuery}
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
          onClick={openPanel}
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
            <button className="text-button" onClick={clearFacets} type="button">
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
              <button className="secondary-button" onClick={resetSearch} type="button">
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
        onClear={clearFacets}
        onClose={closePanel}
      />
    </div>
  );
}
