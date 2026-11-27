"use client";

import { Filter, RotateCcw, Search } from "lucide-react";

import type {
  AdminExerciseStatus,
  ExerciseAdminFilters,
} from "@/features/admin/domain/admin-types";
import type { EnumOption } from "@/shared/lib/taxonomy";
import {
  CATEGORY_OPTIONS,
  EQUIPMENT_OPTIONS,
  LEVEL_OPTIONS,
  MUSCLE_GROUP_OPTIONS,
} from "@/shared/lib/taxonomy";

type EnumFilterKey = "primaryMuscle" | "equipment" | "category" | "level";

const ENUM_FILTERS: { key: EnumFilterKey; allLabel: string; options: EnumOption<number>[] }[] = [
  { key: "primaryMuscle", allLabel: "All Muscles", options: MUSCLE_GROUP_OPTIONS },
  { key: "equipment", allLabel: "All Equipment", options: EQUIPMENT_OPTIONS },
  { key: "category", allLabel: "All Categories", options: CATEGORY_OPTIONS },
  { key: "level", allLabel: "All Levels", options: LEVEL_OPTIONS },
];

const SELECT_CLASS =
  "w-full px-3 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] focus:outline-none transition-all cursor-pointer";

export interface ExerciseFiltersProps {
  filters: ExerciseAdminFilters;
  onChange: (filters: ExerciseAdminFilters) => void;
  onReset: () => void;
}

export function ExerciseFilters({ filters, onChange, onReset }: ExerciseFiltersProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-hero)] p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-action)]">
          <Filter className="size-3.5" />
          <span>Filters & Search</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-input)] text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search exercise name, ID..."
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none transition-all"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({ ...filters, status: e.target.value as AdminExerciseStatus | "all" })
            }
            className={SELECT_CLASS}
          >
            <option value="all">All Statuses</option>
            <option value="created">Draft</option>
            <option value="approved">Approved</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {ENUM_FILTERS.map(({ key, allLabel, options }) => (
          <div key={key}>
            <select
              aria-label={allLabel}
              value={filters[key]}
              onChange={(e) => onChange({ ...filters, [key]: Number(e.target.value) })}
              className={SELECT_CLASS}
            >
              <option value={0}>{allLabel}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
