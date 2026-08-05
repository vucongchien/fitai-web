"use client";

import { Plus, Search, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { searchExercises } from "@/features/workout/server/workout-actions";
import type { ExerciseResult } from "@/features/workout/model/workout.types";
import { useDebounce } from "@/shared/lib/use-debounce";

type ExerciseSearchSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (exercise: ExerciseResult) => void;
};

export function ExerciseSearchSheet({ isOpen, onClose, onAddExercise }: ExerciseSearchSheetProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [isPending, startTransition] = useTransition();

  // Search via Server Action khi debouncedQuery thay đổi (250ms delay chống lãng phí network request & server compute)
  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;

    startTransition(async () => {
      const data = await searchExercises(debouncedQuery);
      if (isCurrent) {
        setResults(data);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery, isOpen]);

  // Escape key handler cho a11y & Reset state khi đóng sheet
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="bottom-search-sheet-container">
      <div aria-hidden="true" className="bottom-search-sheet__backdrop" onClick={onClose} />
      <div
        aria-label="Add movement"
        aria-modal="true"
        className="bottom-search-sheet"
        role="dialog"
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
            aria-label="Search exercise library"
            autoFocus
            className="bottom-search-sheet__input"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by movement or target..."
            type="text"
            value={query}
          />
        </div>

        <div aria-busy={isPending} className="bottom-search-sheet__list">
          {isPending ? (
            <p aria-live="polite" className="bottom-search-sheet__empty">
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
