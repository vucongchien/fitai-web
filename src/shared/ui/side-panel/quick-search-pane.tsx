"use client";

import { Dumbbell, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useMemo, useState, useSyncExternalStore, useTransition } from "react";

import {
  countActiveFilters,
  EMPTY_FILTERS,
  type CatalogMetadata,
  type ExerciseFilters,
  type ExerciseSummary,
} from "@/features/exercise/domain/exercise";
import { catalogMetadataStore } from "@/features/exercise/model/catalog-metadata-store";
import { searchExercisesServerAction } from "@/features/exercise/server/catalog-actions";
import { ExerciseCard } from "@/features/exercise/ui/exercise-card";
import { FilterPanel } from "@/features/exercise/ui/filter-panel";

const QUICK_BODY_PARTS = [
  { id: "", label: "Tất cả" },
  { id: "chest", label: "Ngực" },
  { id: "back", label: "Lưng" },
  { id: "legs", label: "Chân" },
  { id: "shoulders", label: "Vai" },
  { id: "arms", label: "Tay" },
  { id: "core", label: "Cơ bụng" },
] as const;

export function QuickSearchPane() {
  const [filters, setFilters] = useState<ExerciseFilters>(EMPTY_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [results, setResults] = useState<ExerciseSummary[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, startTransition] = useTransition();

  const catalogState = useSyncExternalStore(
    catalogMetadataStore.subscribe,
    catalogMetadataStore.getSnapshot,
    catalogMetadataStore.getServerSnapshot,
  );

  const catalog: CatalogMetadata = useMemo(
    () => ({
      bodyParts: catalogState.bodyParts,
      equipments: catalogState.equipments,
      muscles: catalogState.muscles.map((m) => ({
        id: m.id,
        name: m.name,
        bodyPartId: m.bodyPartId || "",
      })),
      tags: [
        { id: "strength", name: "Strength" },
        { id: "hypertrophy", name: "Hypertrophy" },
        { id: "home-friendly", name: "Home Friendly" },
        { id: "no-equipment", name: "No Equipment" },
        { id: "warm-up", name: "Warm-up" },
      ],
    }),
    [catalogState],
  );

  const performSearch = useCallback((newFilters: ExerciseFilters) => {
    setFilters(newFilters);
    setHasSearched(true);
    startTransition(async () => {
      try {
        const res = await searchExercisesServerAction(newFilters);
        setResults(res || []);
      } catch {
        setResults([]);
      }
    });
  }, []);

  const activeCount = useMemo(() => countActiveFilters(filters, catalog), [filters, catalog]);

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
            onChange={(e) => performSearch({ ...filters, q: e.target.value })}
            placeholder="Tìm bài tập, cơ bắp, thiết bị..."
            type="search"
            value={filters.q}
          />
          {isSearching ? (
            <Loader2 className="animate-spin text-[var(--color-text-muted)]" size={16} />
          ) : filters.q ? (
            <button
              aria-label="Clear search"
              className="search-field__clear cursor-pointer"
              onClick={() => performSearch({ ...filters, q: "" })}
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
        {QUICK_BODY_PARTS.map((item) => {
          const isAll = item.id === "";
          const active = isAll
            ? filters.bodyPartIds.length === 0
            : filters.bodyPartIds.includes(item.id);

          return (
            <button
              key={item.id}
              aria-pressed={active}
              className="chip cursor-pointer"
              data-active={active || undefined}
              onClick={() => {
                const nextBody = isAll ? [] : [item.id];
                performSearch({ ...filters, bodyPartIds: nextBody });
              }}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 3. Search Metadata bar */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-neutral-500 border-b border-neutral-100 bg-neutral-50/50">
        <span>{results.length} bài tập</span>
        {activeCount > 0 && (
          <button
            className="text-xs font-semibold text-[var(--color-action)] hover:underline cursor-pointer"
            onClick={() => performSearch(EMPTY_FILTERS)}
            type="button"
          >
            Đặt lại bộ lọc ({activeCount})
          </button>
        )}
      </div>

      {/* 4. Exercise Card Results using standard ExerciseCard component */}
      <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-neutral-100">
        {results.length > 0 ? (
          results.map((exercise) => (
            <div key={exercise.id} className="py-2.5 first:pt-0 last:pb-0">
              <ExerciseCard catalog={catalog} exercise={exercise} />
            </div>
          ))
        ) : hasSearched && !isSearching ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
            <Dumbbell className="text-neutral-300 mb-2.5" size={36} />
            <p className="text-sm font-medium text-neutral-700">Không tìm thấy bài tập nào</p>
            <p className="text-xs text-neutral-400 mt-1">
              Thử từ khóa khác hoặc bấm nút Lọc để đổi tiêu chí
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
            <Search className="text-neutral-300 mb-2.5" size={36} />
            <p className="text-sm font-medium text-neutral-700">Khám phá bài tập nhanh</p>
            <p className="text-xs text-neutral-400 mt-1">
              Nhập tên bài tập hoặc chọn nhóm cơ bên trên để tìm kiếm
            </p>
          </div>
        )}
      </div>

      {/* 5. Mobile-style FilterPanel Sheet */}
      <FilterPanel
        catalog={catalog}
        filters={filters}
        onChange={performSearch}
        onClear={() => performSearch({ ...EMPTY_FILTERS, q: filters.q })}
        onClose={() => setPanelOpen(false)}
        open={panelOpen}
        resultCount={results.length}
      />
    </div>
  );
}
