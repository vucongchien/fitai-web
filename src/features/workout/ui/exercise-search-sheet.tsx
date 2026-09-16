"use client";

import { Plus, Search, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import type { ExerciseResult } from "@/features/workout/model/workout.types";
import { searchExercises } from "@/features/workout/server/workout-actions";

interface ExerciseSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (exercise: ExerciseResult) => void;
}

export function ExerciseSearchSheet({ isOpen, onClose, onAddExercise }: ExerciseSearchSheetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <ExerciseSearchSheetContent
      key="exercise-search-sheet-open"
      onClose={onClose}
      onAddExercise={onAddExercise}
    />
  );
}

function ExerciseSearchSheetContent({
  onClose,
  onAddExercise,
}: Omit<ExerciseSearchSheetProps, "isOpen">) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const containerRef = (node: HTMLDivElement | null) => {
    if (!node) return;

    startTransition(async () => {
      const data = await searchExercises("");
      setResults(data);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchExercises(val);
        setResults(data);
      });
    }, 250);
  };

  return (
    <div ref={containerRef} className="bottom-search-sheet-container">
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
            onChange={(e) => handleQueryChange(e.target.value)}
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
          ) : (results.length === 0 ? (
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
          ))}
        </div>
      </div>
    </div>
  );
}
