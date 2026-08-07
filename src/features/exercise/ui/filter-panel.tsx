"use client";

import { X } from "lucide-react";

import {
  type CatalogEntry,
  type CatalogMetadata,
  countActiveFilters,
  DIFFICULTY_LABEL,
  DIFFICULTY_ORDER,
  type Difficulty,
  type ExerciseFilters,
} from "@/features/exercise/domain/exercise";

type FilterPanelProps = {
  open: boolean;
  filters: ExerciseFilters;
  catalog: CatalogMetadata;
  resultCount: number;
  onChange: (next: ExerciseFilters) => void;
  onClear: () => void;
  onClose: () => void;
};

export function FilterPanel({
  open,
  filters,
  catalog,
  resultCount,
  onChange,
  onClear,
  onClose,
}: FilterPanelProps) {
  const activeCount = countActiveFilters(filters);

  const toggleList = (key: "bodyPartIds" | "equipmentIds" | "tagIds", id: string) => {
    const current = filters[key];
    const next = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id];
    onChange({ ...filters, [key]: next });
  };

  const toggleDifficulty = (value: Difficulty) => {
    const current = filters.difficulty;
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    onChange({ ...filters, difficulty: next });
  };

  if (!open) return null;

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
          <ChipGroup
            label="Body area"
            entries={catalog.bodyParts}
            activeIds={filters.bodyPartIds}
            onToggle={(id) => toggleList("bodyPartIds", id)}
          />

          <ChipGroup
            label="Equipment"
            entries={catalog.equipments}
            activeIds={filters.equipmentIds}
            onToggle={(id) => toggleList("equipmentIds", id)}
          />

          <fieldset className="chip-set">
            <legend className="chip-set__label">Difficulty</legend>
            <div className="chip-set__row">
              {DIFFICULTY_ORDER.map((value) => {
                const active = filters.difficulty.includes(value);
                return (
                  <button
                    aria-pressed={active}
                    className="chip"
                    data-active={active || undefined}
                    key={value}
                    onClick={() => toggleDifficulty(value)}
                    type="button"
                  >
                    {DIFFICULTY_LABEL[value]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <ChipGroup
            label="Tag"
            entries={catalog.tags}
            activeIds={filters.tagIds}
            onToggle={(id) => toggleList("tagIds", id)}
          />

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

type ChipGroupProps = {
  label: string;
  entries: CatalogEntry[];
  activeIds: string[];
  onToggle: (id: string) => void;
};

function ChipGroup({ label, entries, activeIds, onToggle }: ChipGroupProps) {
  return (
    <fieldset className="chip-set">
      <legend className="chip-set__label">{label}</legend>
      <div className="chip-set__row">
        {entries.map((entry) => {
          const active = activeIds.includes(entry.id);
          return (
            <button
              aria-pressed={active}
              className="chip"
              data-active={active || undefined}
              key={entry.id}
              onClick={() => onToggle(entry.id)}
              type="button"
            >
              {entry.name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
