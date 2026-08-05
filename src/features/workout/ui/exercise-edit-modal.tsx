"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { AdhocExercise, isWeightedExercise } from "@/features/workout/model/adhoc-types";

interface ExerciseEditModalProps {
  exercise: AdhocExercise;
  onClose: () => void;
  onSave: (updated: { sets: number; reps: number; rest: string; weightKg?: number }) => void;
}

export function ExerciseEditModal({ exercise, onClose, onSave }: ExerciseEditModalProps) {
  const isWeighted = isWeightedExercise(exercise.name);

  const [sets, setSets] = useState(exercise.sets || 3);
  const [reps, setReps] = useState(exercise.reps || 10);
  const [weightKg, setWeightKg] = useState<number | undefined>(exercise.weightKg);
  const [rest, setRest] = useState(exercise.rest || "60 sec");

  const handleSave = () => {
    onSave({
      sets,
      reps,
      rest,
      weightKg: isWeighted ? weightKg : undefined,
    });
  };

  return (
    <div className="exercise-edit-modal-backdrop">
      <div className="exercise-edit-modal" role="dialog" aria-modal="true">
        <div className="exercise-edit-modal__header">
          <h2>Configure {exercise.name}</h2>
          <button
            aria-label="Close edit modal"
            className="exercise-edit-modal__close"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="exercise-edit-modal__body">
          <div className={`edit-form-grid ${isWeighted ? "edit-form-grid--3col" : ""}`}>
            <label className="edit-field">
              <span>Sets</span>
              <input
                className="edit-field__input"
                max={15}
                min={1}
                onChange={(e) => setSets(Math.max(1, Number(e.target.value) || 1))}
                type="number"
                value={sets}
              />
            </label>

            <label className="edit-field">
              <span>Reps</span>
              <input
                className="edit-field__input"
                max={100}
                min={1}
                onChange={(e) => setReps(Math.max(1, Number(e.target.value) || 1))}
                type="number"
                value={reps}
              />
            </label>

            {isWeighted && (
              <label className="edit-field">
                <span>Weight (kg)</span>
                <input
                  className="edit-field__input"
                  min={0}
                  onChange={(e) => setWeightKg(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="e.g. 14"
                  type="number"
                  value={weightKg ?? ""}
                />
              </label>
            )}
          </div>

          <label className="edit-field">
            <span>Rest Period</span>
            <select
              className="edit-field__input edit-field__select"
              onChange={(e) => setRest(e.target.value)}
              value={rest}
            >
              <option value="30 sec">30 sec</option>
              <option value="45 sec">45 sec</option>
              <option value="60 sec">60 sec</option>
              <option value="75 sec">75 sec</option>
              <option value="90 sec">90 sec</option>
              <option value="120 sec">120 sec</option>
            </select>
          </label>
        </div>

        <div className="exercise-edit-modal__footer">
          <button
            className="ui-button ui-button--secondary ui-button--medium"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="ui-button ui-button--primary ui-button--medium"
            onClick={handleSave}
            type="button"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
