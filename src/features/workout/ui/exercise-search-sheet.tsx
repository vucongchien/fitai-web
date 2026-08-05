"use client";

import { Plus, Search, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { searchExercises } from "@/shared/api/bff/workout/actions";
import type { ExerciseResult } from "@/shared/api/bff/workout/types";

type ExerciseSearchSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (exercise: ExerciseResult) => void;
};

export function ExerciseSearchSheet({ isOpen, onClose, onAddExercise }: ExerciseSearchSheetProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [isPending, startTransition] = useTransition();

  // Search via Server Action khi query thay đổi
  useEffect(() => {
    if (!isOpen) return;

    startTransition(async () => {
      const data = await searchExercises(query);
      setResults(data);
    });
  }, [query, isOpen]);

  // Reset state khi đóng sheet
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="bottom-search-sheet-container">
      <div aria-hidden="true" className="bottom-search-sheet__backdrop" onClick={onClose} />
      <div
        className="bottom-search-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Add movement"
      >
        <div className="bottom-search-sheet__handle" />
        <div className="bottom-search-sheet__header">
          <h2>Add movement</h2>
          <button
            aria-label="Close search sheet"
            className="bottom-search-sheet__close"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bottom-search-sheet__input-wrap">
          <Search className="bottom-search-sheet__search-icon" size={17} />
          <input
            autoFocus
            aria-label="Search exercise library"
            className="bottom-search-sheet__input"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by movement or target..."
            type="text"
            value={query}
          />
        </div>

        <div className="bottom-search-sheet__list" aria-busy={isPending}>
          {isPending ? (
            <p className="bottom-search-sheet__empty" aria-live="polite">
              Searching...
            </p>
          ) : results.length === 0 ? (
            <p className="bottom-search-sheet__empty">No matching movements found.</p>
          ) : (
            results.map((item) => (
              <div className="bottom-search-sheet__item" key={item.id}>
                <div className="bottom-search-sheet__item-info">
                  <strong>{item.name}</strong>
                  <span>
                    {item.prescription} · {item.rest} rest
                  </span>
                </div>
                <button
                  aria-label={`Add ${item.name}`}
                  className="ui-button ui-button--secondary ui-button--medium"
                  onClick={() => {
                    onAddExercise(item);
                    onClose();
                  }}
                  type="button"
                >
                  <Plus size={15} />
                  Add
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
