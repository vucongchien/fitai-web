"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowRight, GripVertical, Pencil, ShieldCheck, Trash2 } from "lucide-react";

import { useAdhocWorkout } from "@/features/workout/model/use-adhoc-workout";
import { AdhocEstimates } from "@/features/workout/ui/adhoc-estimates";
import { AdhocHero } from "@/features/workout/ui/adhoc-hero";
import { AdhocToolsRow } from "@/features/workout/ui/adhoc-tools-row";
import { ExerciseEditModal } from "@/features/workout/ui/exercise-edit-modal";
import { ExerciseSearchSheet } from "@/features/workout/ui/exercise-search-sheet";
import { SortableAdhocItem } from "@/features/workout/ui/sortable-adhoc-item";
import { buttonVariants } from "@/shared/ui/button";

export function AdhocWorkoutBuilder() {
  const {
    mounted,
    exerciseList,
    isSearchOpen,
    setIsSearchOpen,
    editingExercise,
    setEditingExercise,
    aiLoading,
    sessionLoading,
    sensors,
    estimatedDuration,
    targetRpe,
    handleDragEnd,
    handleDeleteExercise,
    handleAddExercise,
    handleAiRecommend,
    handleSaveEdit,
    handleBeginSession,
  } = useAdhocWorkout();

  return (
    <>
      <AdhocHero />

      <div className="workout-prep-grid">
        <section className="adhoc-exercise-section">
          <div className="content-section__header">
            <h2>Today&rsquo;s exercises</h2>
            <p>{exerciseList.length} movements · Hold handle to reorder</p>
          </div>

          {mounted ? (
            <DndContext
              collisionDetection={closestCenter}
              id="adhoc-workout-dnd-context"
              onDragEnd={handleDragEnd}
              sensors={sensors}
            >
              <SortableContext
                items={exerciseList.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="adhoc-list-container">
                  {exerciseList.map((exercise, index) => (
                    <SortableAdhocItem
                      exercise={exercise}
                      index={index}
                      key={exercise.id}
                      onDelete={() => handleDeleteExercise(exercise.id)}
                      onEdit={() => setEditingExercise(exercise)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          ) : (
            <ul className="adhoc-list-container">
              {exerciseList.map((exercise, index) => (
                <li className="adhoc-exercise-row" key={exercise.id}>
                  <div className="adhoc-row-inner">
                    <span aria-label="Hold handle to reorder" className="drag-grip-handle">
                      <GripVertical size={16} />
                    </span>
                    <span className="data-value">{String(index + 1).padStart(2, "0")}</span>
                    <div className="adhoc-row-info">
                      <strong>{exercise.name}</strong>
                      <span>
                        {exercise.sets} × {exercise.reps} · {exercise.rest} rest
                      </span>
                    </div>
                    <div className="adhoc-row-actions">
                      <button className="adhoc-action-btn" type="button">
                        <Pencil size={15} />
                      </button>
                      <button className="adhoc-action-btn adhoc-action-btn--danger" type="button">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <AdhocToolsRow
            aiLoading={aiLoading}
            onAiRecommend={handleAiRecommend}
            onOpenSearch={() => setIsSearchOpen(true)}
          />

          <AdhocEstimates
            estimatedDuration={estimatedDuration}
            exerciseCount={exerciseList.length}
            targetRpe={targetRpe}
          />
        </section>

        <aside className="prep-aside">
          <section className="prep-note prep-note--safe">
            <ShieldCheck aria-hidden="true" size={22} />
            <div>
              <h2>Adhoc Flexibility</h2>
              <p>Adhoc sessions do not alter your main 4-week roadmap progression.</p>
            </div>
          </section>
        </aside>
      </div>

      <footer className="workout-prep-action">
        <button
          className={buttonVariants({ size: "large", variant: "primary" })}
          disabled={sessionLoading}
          onClick={handleBeginSession}
          type="button"
        >
          {sessionLoading ? "Starting…" : "Begin session"}
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </footer>

      {editingExercise && (
        <ExerciseEditModal
          exercise={editingExercise}
          onClose={() => setEditingExercise(null)}
          onSave={handleSaveEdit}
        />
      )}

      <ExerciseSearchSheet
        isOpen={isSearchOpen}
        onAddExercise={handleAddExercise}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
