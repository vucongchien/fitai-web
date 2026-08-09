"use client";

import { X } from "lucide-react";

import {
  countActiveFilters,
  DIFFICULTY_LABEL,
  DIFFICULTY_ORDER,
  GROUP_SYNONYMS,
} from "@/features/exercise/domain/exercise";
import type {
  CatalogEntry,
  CatalogMetadata,
  Difficulty,
  ExerciseFilters,
} from "@/features/exercise/domain/exercise";

interface FilterPanelProps {
  open: boolean;
  filters: ExerciseFilters;
  catalog: CatalogMetadata;
  resultCount: number;
  onChange: (next: ExerciseFilters) => void;
  onClear: () => void;
  onClose: () => void;
}

export function FilterPanel({
  open,
  filters,
  catalog,
  resultCount,
  onChange,
  onClear,
  onClose,
}: FilterPanelProps) {
  const activeCount = countActiveFilters(filters, catalog);

  const toggleList = (
    key: "bodyPartIds" | "equipmentIds" | "targetMuscleIds" | "tagIds",
    id: string,
  ) => {
    const current = (filters[key] as string[]) || [];
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

  if (!open) {
    return null;
  }

  const musclesList = catalog.muscles && catalog.muscles.length > 0 ? catalog.muscles : [
    { id: "quadriceps", name: "Quadriceps", bodyPartId: "legs" },
    { id: "glutes", name: "Glutes", bodyPartId: "legs" },
    { id: "hamstrings", name: "Hamstrings", bodyPartId: "legs" },
    { id: "pectorals", name: "Pectorals", bodyPartId: "chest" },
    { id: "latissimus", name: "Lats", bodyPartId: "back" },
    { id: "abs", name: "Abs", bodyPartId: "core" },
    { id: "biceps", name: "Biceps", bodyPartId: "arms" },
    { id: "triceps", name: "Triceps", bodyPartId: "arms" },
    { id: "deltoids", name: "Deltoids", bodyPartId: "shoulders" },
  ];

  const tagsList = catalog.tags && catalog.tags.length > 0 ? catalog.tags : [
    { id: "strength", name: "Strength" },
    { id: "hypertrophy", name: "Hypertrophy" },
    { id: "home-friendly", name: "Home Friendly" },
    { id: "no-equipment", name: "No Equipment" },
    { id: "warm-up", name: "Warm-up" },
  ];

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
            label="Target Muscle"
            entries={musclesList}
            activeIds={filters.targetMuscleIds || []}
            onToggle={(id) => toggleList("targetMuscleIds", id)}
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
            entries={tagsList}
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

interface ChipGroupProps {
  label: string;
  entries: CatalogEntry[];
  activeIds: string[];
  onToggle: (id: string) => void;
}

function ChipGroup({ label, entries, activeIds, onToggle }: ChipGroupProps) {
  return (
    <fieldset className="chip-set">
      <legend className="chip-set__label">{label}</legend>
      <div className="chip-set__row">
        {entries.map((entry) => {
          const active = activeIds.some((id) => {
            if (id === entry.id) {
              return true;
            }
            const idLower = id.toLowerCase();
            const eIdLower = entry.id.toLowerCase();
            const eNameLower = entry.name.toLowerCase();

            if (idLower === eIdLower || idLower === eNameLower) {
              return true;
            }

            const synonyms = GROUP_SYNONYMS[idLower] || [idLower];
            return synonyms.some(
              (syn) =>
                eIdLower === syn ||
                eNameLower === syn ||
                eIdLower.includes(syn) ||
                syn.includes(eIdLower) ||
                eNameLower.includes(syn) ||
                syn.includes(eNameLower),
            );
          });
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
