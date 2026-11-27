"use client";

import { AlertCircle, Dumbbell, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { countActiveFilters, EMPTY_FILTERS } from "@/features/exercise/domain/exercise";
import type { ExerciseFilters, ExerciseSummary } from "@/features/exercise/domain/exercise";
import { searchExercisesServerAction } from "@/features/exercise/server/catalog-actions";
import { ExerciseCard } from "@/features/exercise/ui/exercise-card";
import { FilterPanel } from "@/features/exercise/ui/filter-panel";
import { MuscleGroup } from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import { muscleGroupLabel } from "@/shared/lib/taxonomy";

const QUICK_MUSCLES: MuscleGroup[] = [
  MuscleGroup.CHEST,
  MuscleGroup.LATS,
  MuscleGroup.QUADRICEPS,
  MuscleGroup.SHOULDERS,
  MuscleGroup.BICEPS,
  MuscleGroup.ABDOMINALS,
];

const SEARCH_DEBOUNCE_MS = 200;

interface QuickSearchState {
  filters: ExerciseFilters;
  results: ExerciseSummary[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
}

const INITIAL_SEARCH_STATE: QuickSearchState = {
  filters: EMPTY_FILTERS,
  results: [],
  isLoading: false,
  hasLoaded: false,
  error: null,
};

class QuickSearchStore {
  private state: QuickSearchState = INITIAL_SEARCH_STATE;
  private fetching = false;
  private requestId = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (!this.state.hasLoaded && !this.fetching && typeof globalThis.window !== "undefined") {
      void this.search(this.state.filters);
    }
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;
  getServerSnapshot = () => INITIAL_SEARCH_STATE;

  search = (newFilters: ExerciseFilters, options?: { debounceMs?: number }) => {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    const currentRequestId = ++this.requestId;
    this.fetching = true;
    this.state = {
      ...this.state,
      filters: newFilters,
      isLoading: true,
      error: null,
    };
    this.emit();

    const debounceMs = options?.debounceMs ?? 0;
    if (debounceMs > 0) {
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        void this.executeSearch(newFilters, currentRequestId);
      }, debounceMs);
      return;
    }

    void this.executeSearch(newFilters, currentRequestId);
  };

  reset = () => {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.requestId += 1;
    this.fetching = false;
    this.state = INITIAL_SEARCH_STATE;
    this.emit();
  };

  private async executeSearch(filters: ExerciseFilters, requestId: number) {
    try {
      const res = await searchExercisesServerAction(filters);
      if (requestId !== this.requestId) {
        return;
      }
      this.state = {
        ...this.state,
        results: res || [],
        isLoading: false,
        hasLoaded: true,
        error: null,
      };
    } catch {
      if (requestId !== this.requestId) {
        return;
      }
      this.state = {
        ...this.state,
        results: [],
        isLoading: false,
        hasLoaded: true,
        error: "Could not load movements. Please try again.",
      };
    } finally {
      if (requestId === this.requestId) {
        this.fetching = false;
        this.emit();
      }
    }
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}

export const quickSearchStore = new QuickSearchStore();

function renderResultsBody(searchState: QuickSearchState, onRetry: () => void) {
  if (searchState.results.length > 0) {
    return searchState.results.map((exercise) => (
      <div key={exercise.id} className="py-2.5 first:pt-0 last:pb-0">
        <ExerciseCard exercise={exercise} />
      </div>
    ));
  }

  if (searchState.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
        <Loader2 className="animate-spin text-neutral-300 mb-2.5" size={32} />
        <p className="text-sm font-medium text-neutral-600">Loading movements...</p>
      </div>
    );
  }

  if (searchState.error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
        <AlertCircle className="text-neutral-300 mb-2.5" size={36} />
        <p className="text-sm font-medium text-neutral-700">{searchState.error}</p>
        <button
          className="mt-3 text-xs font-semibold text-[var(--color-action)] hover:underline cursor-pointer"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
      <Dumbbell className="text-neutral-300 mb-2.5" size={36} />
      <p className="text-sm font-medium text-neutral-700">No movements found</p>
      <p className="text-xs text-neutral-400 mt-1">Try a different keyword or adjust filters</p>
    </div>
  );
}

export function QuickSearchPane() {
  const [panelOpen, setPanelOpen] = useState(false);

  const searchState = useSyncExternalStore(
    quickSearchStore.subscribe,
    quickSearchStore.getSnapshot,
    quickSearchStore.getServerSnapshot,
  );

  const { filters, results, isLoading, hasLoaded } = searchState;

  const activeCount = countActiveFilters(filters);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 1. Mobile-Matched Search Bar with Filter Button */}
      <div className="flex items-center gap-2 p-4 border-b border-neutral-100 bg-white">
        <label className="search-field flex-1">
          <Search aria-hidden="true" size={18} strokeWidth={2} />
          <input
            autoFocus
            aria-label="Search exercises"
            className="w-full text-sm"
            inputMode="search"
            onChange={(e) =>
              quickSearchStore.search(
                { ...filters, q: e.target.value },
                { debounceMs: SEARCH_DEBOUNCE_MS },
              )
            }
            placeholder="Search movements, muscles, equipment..."
            type="search"
            value={filters.q}
          />
          {isLoading ? (
            <Loader2 className="animate-spin text-[var(--color-text-muted)]" size={16} />
          ) : filters.q ? (
            <button
              aria-label="Clear search"
              className="search-field__clear cursor-pointer"
              onClick={() => quickSearchStore.search({ ...filters, q: "" })}
              type="button"
            >
              <X aria-hidden="true" size={16} />
            </button>
          ) : null}
        </label>

        <button
          aria-expanded={panelOpen}
          aria-label={activeCount === 0 ? "Filters" : `Filters, ${activeCount} active`}
          className="icon-button shrink-0 cursor-pointer"
          data-active={activeCount > 0 || undefined}
          onClick={() => setPanelOpen(true)}
          type="button"
        >
          <SlidersHorizontal aria-hidden="true" size={18} strokeWidth={2} />
          {activeCount > 0 && <span className="icon-button__badge">{activeCount}</span>}
        </button>
      </div>

      {/* 2. Quick Body Area Chips using native .chip design tokens */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2.5 border-b border-neutral-100 bg-white">
        <button
          aria-pressed={filters.muscles.length === 0}
          className="chip cursor-pointer"
          data-active={filters.muscles.length === 0 || undefined}
          onClick={() => quickSearchStore.search({ ...filters, muscles: [] })}
          type="button"
        >
          All
        </button>
        {QUICK_MUSCLES.map((muscle) => {
          const active = filters.muscles.includes(muscle);
          return (
            <button
              key={muscle}
              aria-pressed={active}
              className="chip cursor-pointer"
              data-active={active || undefined}
              onClick={() => quickSearchStore.search({ ...filters, muscles: [muscle] })}
              type="button"
            >
              {muscleGroupLabel(muscle)}
            </button>
          );
        })}
      </div>

      {/* 3. Search Metadata bar */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-neutral-500 border-b border-neutral-100 bg-neutral-50/50">
        <span>
          {isLoading && !hasLoaded ? "Loading movements..." : `${results.length} movements`}
        </span>
        {activeCount > 0 && (
          <button
            className="text-xs font-semibold text-[var(--color-action)] hover:underline cursor-pointer"
            onClick={() => quickSearchStore.search(EMPTY_FILTERS)}
            type="button"
          >
            Reset filters ({activeCount})
          </button>
        )}
      </div>

      {/* 4. Exercise Card Results using standard ExerciseCard component */}
      <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-neutral-100">
        {renderResultsBody(searchState, () => quickSearchStore.search(filters))}
      </div>

      {/* 5. Mobile-style FilterPanel Sheet */}
      <FilterPanel
        filters={filters}
        onChange={(nextFilters) => quickSearchStore.search(nextFilters)}
        onClear={() => quickSearchStore.search({ ...EMPTY_FILTERS, q: filters.q })}
        onClose={() => setPanelOpen(false)}
        open={panelOpen}
        resultCount={results.length}
      />
    </div>
  );
}
