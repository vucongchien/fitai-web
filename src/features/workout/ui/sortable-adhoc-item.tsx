"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import React from "react";

import type { AdhocExercise } from "@/features/workout/model/adhoc-types";

interface SortableAdhocItemProps {
  exercise: AdhocExercise;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableAdhocItem({ exercise, index, onEdit, onDelete }: SortableAdhocItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  });

  const style: React.CSSProperties = React.useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition],
  );

  const hasWeight = exercise.weightKg !== undefined && exercise.weightKg > 0;

  return (
    <li
      className={`adhoc-exercise-row ${isDragging ? "is-dnd-dragging" : ""}`}
      ref={setNodeRef}
      style={style}
    >
      <div className="adhoc-row-inner">
        <span
          aria-label="Hold handle to reorder"
          className="drag-grip-handle"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </span>

        <span className="data-value">{String(index + 1).padStart(2, "0")}</span>

        <div className="adhoc-row-info">
          <strong>{exercise.name}</strong>
          <span>
            {exercise.sets} × {exercise.reps}
            {hasWeight ? ` · ${exercise.weightKg}kg` : ""} · {exercise.rest} rest
          </span>
        </div>

        <div className="adhoc-row-actions">
          <button
            aria-label={`Edit ${exercise.name}`}
            className="adhoc-action-btn"
            onClick={onEdit}
            type="button"
          >
            <Pencil size={15} />
          </button>

          <button
            aria-label={`Delete ${exercise.name}`}
            className="adhoc-action-btn adhoc-action-btn--danger"
            onClick={onDelete}
            type="button"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </li>
  );
}
