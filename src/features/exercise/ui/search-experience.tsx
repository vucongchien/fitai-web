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

export const GROUP_SYNONYMS: Record<string, string[]> = {
  "arms-shoulders": ["arms", "shoulders", "upper arms", "lower arms", "biceps", "triceps", "deltoids", "forearms"],
  arms: ["arms", "upper arms", "lower arms", "biceps", "triceps", "forearms"],
  shoulders: ["shoulders", "deltoids"],

  "chest-back": ["chest", "back", "pectorals", "lats", "traps", "latissimus", "neck"],
  chest: ["chest", "pectorals"],
  back: ["back", "lats", "traps", "latissimus"],

  "legs-glutes": ["legs", "glutes", "upper legs", "lower legs", "quadriceps", "hamstrings", "calves", "thighs"],
  legs: ["legs", "upper legs", "lower legs", "quadriceps", "hamstrings", "calves"],

  "core-abs": ["core", "abs", "waist", "abdominals", "midsection"],
  core: ["core", "abs", "waist", "abdominals"],
  waist: ["waist", "core", "abs", "abdominals"],
};

function parseFilters(params: URLSearchParams, catalog: CatalogMetadata): ExerciseFilters {
  const queryVal = params.get("q") || params.get("query") || "";

  const rawBodyParams = [
    ...params.getAll("body"),
    ...params.getAll("bodyPart"),
    ...params.getAll("bodyPartId"),
    ...params.getAll("muscle"),
  ];

  const bodyPartIds: string[] = [];

  rawBodyParams.forEach((rawParam) => {
    const pLower = rawParam.toLowerCase();
    if (GROUP_SYNONYMS[pLower]) {
      if (!bodyPartIds.includes(pLower)) {
        bodyPartIds.push(pLower);
      }
      return;
    }

    const exactMatch = catalog.bodyParts.find(
      (entry) => entry.id === rawParam || entry.id.toLowerCase() === pLower,
    );

    if (exactMatch) {
      if (!bodyPartIds.includes(exactMatch.id)) {
        bodyPartIds.push(exactMatch.id);
      }
      return;
    }

    const synonyms: string[] = [pLower];
    let foundAny = false;
    catalog.bodyParts.forEach((entry) => {
      const eId = entry.id.toLowerCase();
      const eName = entry.name.toLowerCase();

      const isMatch = synonyms.some(
        (syn: string) =>
          eId === syn ||
          eName === syn ||
          eId.includes(syn) ||
          syn.includes(eId) ||
          eName.includes(syn) ||
          syn.includes(eName),
      );

      if (isMatch && !bodyPartIds.includes(entry.id)) {
        bodyPartIds.push(entry.id);
        foundAny = true;
      }
    });

    if (!foundAny && !bodyPartIds.includes(rawParam)) {
      bodyPartIds.push(rawParam);
    }
  });

  const targetMuscleIds = [
    ...params.getAll("targetMuscle"),
    ...params.getAll("muscle"),
  ].filter((id) => Boolean(id));

  const equipmentIds = params
    .getAll("equipment")
    .map(
      (eq) =>
        catalog.equipments.find(
          (entry) =>
            entry.id === eq ||
            entry.id.toLowerCase() === eq.toLowerCase() ||
            entry.name.toLowerCase() === eq.toLowerCase(),
        )?.id || eq,
    );

  const tagIds = params.getAll("tag").filter((id) => catalog.tags.some((entry) => entry.id === id));
  const difficulty = params
    .getAll("level")
    .filter((entry): entry is Difficulty => DIFFICULTY_ORDER.includes(entry as Difficulty));

  return {
    q: queryVal,
    bodyPartIds,
    equipmentIds,
    targetMuscleIds,
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
  for (const id of filters.targetMuscleIds || []) {
    params.append("targetMuscle", id);
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

  const searchParamsString = searchParams.toString();

  const [filters, setFilters] = useState<ExerciseFilters>(() =>
    parseFilters(new URLSearchParams(searchParamsString), catalog),
  );
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const nextFilters = parseFilters(new URLSearchParams(searchParamsString), catalog);
    setFilters(nextFilters);
  }, [searchParamsString, catalog]);

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

  const activeCount = countActiveFilters(filters, catalog);

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
            <button className="text-button text-xs font-semibold text-[var(--color-action)]" onClick={clearFacets} type="button">
              Reset filters
            </button>
          ) : null}
        </div>

        {results.length === 0 ? (
          <div className="search-empty-flow flex flex-col gap-6 py-4">
            <EmptyState
              icon={SearchX}
              title="No movements match"
              description="Try removing a filter or broadening your search options."
              action={
                <button className="secondary-button" onClick={resetSearch} type="button">
                  Reset search
                </button>
              }
            />

            {exercises.length > 0 ? (
              <section className="search-recommendations border-t border-[var(--color-border)] pt-4">
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text-main)]">
                  Suggested movements
                </h3>
                <ol className="ex-grid">
                  {exercises.slice(0, 8).map((exercise) => (
                    <li key={`rec-${exercise.id}`}>
                      <ExerciseCard exercise={exercise} catalog={catalog} />
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>
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
