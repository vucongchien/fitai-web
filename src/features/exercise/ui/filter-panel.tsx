"use client";

import { X } from "lucide-react";

import { countActiveFilters, FILTER_FACETS } from "@/features/exercise/domain/exercise";
import type { ExerciseFilters, FilterFacet } from "@/features/exercise/domain/exercise";
import type { EnumOption } from "@/shared/lib/taxonomy";

interface FilterPanelProps {
  open: boolean;
  filters: ExerciseFilters;
  resultCount: number;
  onChange: (next: ExerciseFilters) => void;
  onClear: () => void;
  onClose: () => void;
}

const FACET_ORDER: FilterFacet[] = ["muscles", "equipment", "categories", "levels"];

export function FilterPanel({
  open,
  filters,
  resultCount,
  onChange,
  onClear,
  onClose,
}: FilterPanelProps) {
  const activeCount = countActiveFilters(filters);

  const toggle = (facet: FilterFacet, value: number) => {
    const current = filters[facet] as number[];
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    onChange({ ...filters, [facet]: next });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="filter-sheet">
      <button
        aria-label="Close filters"
        className="filter-sheet__backdrop"
        onClick={onClose}
        type="button"
      />

      <dialog aria-label="Filter exercises" className="filter-sheet__inner" open>
        <span aria-hidden="true" className="filter-sheet__handle" />

        <header className="filter-sheet__head">
          <h2 className="filter-sheet__title">Filters</h2>
          <button
            aria-label="Close filters"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className="filter-sheet__body">
          {FACET_ORDER.map((facet) => (
            <ChipGroup
              key={facet}
              label={FILTER_FACETS[facet].label}
              options={FILTER_FACETS[facet].options}
              activeValues={filters[facet]}
              onToggle={(value) => toggle(facet, value)}
            />
          ))}

          <label aria-label="AI form tracking only" className="switch-row">
            <div className="switch-row__text">
              <span>AI form tracking only</span>
              <small>Show movements the camera can score.</small>
            </div>
            <span className="switch">
              <input
                checked={filters.aiOnly}
                onChange={(event) => onChange({ ...filters, aiOnly: event.target.checked })}
                type="checkbox"
              />
              <span aria-hidden="true" className="switch__track" />
            </span>
          </label>
        </div>

        <footer className="filter-sheet__foot">
          <button
            className="text-button"
            disabled={activeCount === 0}
            onClick={onClear}
            type="button"
          >
            Clear all
          </button>
          <button className="primary-button" onClick={onClose} type="button">
            Show {resultCount} {resultCount === 1 ? "result" : "results"}
          </button>
        </footer>
      </dialog>
    </div>
  );
}

interface ChipGroupProps {
  label: string;
  options: readonly EnumOption<number>[];
  activeValues: readonly number[];
  onToggle: (value: number) => void;
}

function ChipGroup({ label, options, activeValues, onToggle }: ChipGroupProps) {
  return (
    <fieldset className="chip-set">
      <legend className="chip-set__label">{label}</legend>
      <div className="chip-set__row">
        {options.map((option) => {
          const active = activeValues.includes(option.value);
          return (
            <button
              aria-pressed={active}
              className="chip"
              data-active={active || undefined}
              key={option.value}
              onClick={() => onToggle(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
