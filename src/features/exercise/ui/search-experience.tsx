"use client";
import { ArrowLeft, Loader2, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

import {
  countActiveFilters,
  EMPTY_FILTERS,
  FILTER_FACETS,
  filterExercises,
  parseFilterParams,
  sortExercises,
  toFilterSearchString,
} from "@/features/exercise/domain/exercise";
import type {
  ExerciseFilters,
  ExerciseSummary,
  FilterFacet,
} from "@/features/exercise/domain/exercise";
import { ExerciseCard } from "@/features/exercise/ui/exercise-card";
import { FilterPanel } from "@/features/exercise/ui/filter-panel";
import { EmptyState } from "@/shared/ui/empty-state";
import { NAV_BACK } from "@/shared/ui/transition-types";

interface SearchExperienceProps {
  initialExercises: ExerciseSummary[];
}

interface ActiveChip {
  id: string;
  label: string;
  facet: FilterFacet | "aiOnly";
  value: number;
}

export function SearchExperience({ initialExercises }: SearchExperienceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSearching, startTransition] = useTransition();

  const searchParamsString = searchParams.toString();

  const filters = useMemo(
    () => parseFilterParams(new URLSearchParams(searchParamsString)),
    [searchParamsString],
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const rawExercises = initialExercises;

  const syncUrl = useCallback(
    (next: ExerciseFilters) => {
      const qs = toFilterSearchString(next);
      const target = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => {
        router.replace(target, { scroll: false });
      });
    },
    [pathname, router],
  );

  const updateFilters = useCallback(
    (next: ExerciseFilters) => {
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
    () => sortExercises(filterExercises(rawExercises, filters), "relevance"),
    [rawExercises, filters],
  );

  const activeCount = countActiveFilters(filters);

  const activeChips = useMemo(() => {
    const chips: ActiveChip[] = [];
    for (const facet of Object.keys(FILTER_FACETS) as FilterFacet[]) {
      for (const value of filters[facet]) {
        const option = FILTER_FACETS[facet].options.find((entry) => entry.value === value);
        chips.push({ id: `${facet}-${value}`, label: option?.label ?? "", facet, value });
      }
    }
    if (filters.aiOnly) {
      chips.push({ id: "ai-only", label: "AI Feedback", facet: "aiOnly", value: 1 });
    }
    return chips;
  }, [filters]);

  const removeChip = useCallback(
    (facet: ActiveChip["facet"], value: number) => {
      if (facet === "aiOnly") {
        updateFilters({ ...filters, aiOnly: false });
        return;
      }
      updateFilters({
        ...filters,
        [facet]: (filters[facet] as number[]).filter((entry) => entry !== value),
      });
    },
    [filters, updateFilters],
  );

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
            autoFocus
            type="search"
            inputMode="search"
            placeholder="Find movements, muscles, equipment"
            value={filters.q}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search exercises"
          />
          {isSearching ? (
            <Loader2 className="animate-spin text-[var(--color-text-muted)]" size={16} />
          ) : filters.q ? (
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
            {results.length} of {rawExercises.length} movements
          </span>
          {activeCount > 0 ? (
            <button
              className="text-button text-xs font-semibold text-[var(--color-action)]"
              onClick={clearFacets}
              type="button"
            >
              Reset filters
            </button>
          ) : null}
        </div>

        {activeChips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pb-2">
            {activeChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-action)]"
                onClick={() => removeChip(chip.facet, chip.value)}
              >
                <span>{chip.label}</span>
                <X size={12} className="text-[var(--color-text-muted)]" />
              </button>
            ))}
          </div>
        ) : null}

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

            {rawExercises.length > 0 ? (
              <section className="search-recommendations border-t border-[var(--color-border)] pt-4">
                <h3 className="text-sm font-bold mb-3 text-[var(--color-text)]">
                  Suggested movements
                </h3>
                <ol className="ex-grid">
                  {rawExercises.slice(0, 8).map((exercise) => (
                    <li key={`rec-${exercise.id}`}>
                      <ExerciseCard exercise={exercise} />
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
                <ExerciseCard exercise={exercise} />
              </li>
            ))}
          </ol>
        )}
      </main>

      <FilterPanel
        open={panelOpen}
        filters={filters}
        resultCount={results.length}
        onChange={updateFilters}
        onClear={clearFacets}
        onClose={closePanel}
      />
    </div>
  );
}
