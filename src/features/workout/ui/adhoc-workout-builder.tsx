"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  ArrowRight,
  Clock3,
  Gauge,
  GripVertical,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

import { useAdhocWorkout } from "@/features/workout/model/use-adhoc-workout";
import { ExerciseEditModal } from "@/features/workout/ui/exercise-edit-modal";
import { ExerciseSearchSheet } from "@/features/workout/ui/exercise-search-sheet";
import { SortableAdhocItem } from "@/features/workout/ui/sortable-adhoc-item";
import { buttonVariants } from "@/shared/ui/button";
import { TripleLane } from "@/shared/ui/triple-lane";

export function AdhocWorkoutBuilder() {
  const {
    mounted,
    exerciseList,
    isSearchOpen,
    setIsSearchOpen,
    editingExercise,
    setEditingExercise,
    aiLoading,
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
      <section className="workout-prep-hero">
        <TripleLane active="move" morph />
        <p className="utility-label">Adhoc Session · Custom Workout</p>
        <h1>Custom Workout Plan</h1>
        <p>Build capacity and strength with movements selected for today.</p>
      </section>

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

          {/* Tools Row at bottom of list */}
          <div className="adhoc-tools-row">
            <button
              aria-label="Add movement"
              className="ui-button ui-button--secondary ui-button--medium"
              onClick={() => setIsSearchOpen(true)}
              type="button"
            >
              <Plus size={16} />
              Add movement
            </button>

            <button
              aria-label="AI Recommend custom workout"
              className="ai-recommend-button"
              disabled={aiLoading}
              onClick={handleAiRecommend}
              type="button"
            >
              <Sparkles size={16} />
              <span>{aiLoading ? "Generating..." : "AI Recommend"}</span>
            </button>
          </div>

          {/* Dynamic Estimates at the bottom of the list */}
          <div className="session-facts adhoc-estimates-bottom">
            <span>
              <Clock3 aria-hidden="true" size={17} />~{estimatedDuration} min estimated
            </span>
            <span>
              <Gauge aria-hidden="true" size={17} />
              {exerciseList.length} movements
            </span>
            <span>Target {targetRpe} RPE</span>
          </div>
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
          onClick={handleBeginSession}
          type="button"
        >
          Begin session
          <ArrowRight aria-hidden="true" size={18} />
        </button>
      </footer>

      {/* Exercise Configure Modal Dialog */}
      {editingExercise && (
        <ExerciseEditModal
          exercise={editingExercise}
          onClose={() => setEditingExercise(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Bottom Sheet Search */}
      <ExerciseSearchSheet
        isOpen={isSearchOpen}
        onAddExercise={handleAddExercise}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
