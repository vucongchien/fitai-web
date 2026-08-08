"use client";

import { ArrowRight, Clock, Play } from "lucide-react";
import Link from "next/link";

import type { FeaturedExerciseItem } from "@/features/home/model/home-page.types";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface ExerciseShowcaseSectionProps {
  exercises: FeaturedExerciseItem[];
}

function isUuid(str?: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  return (
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed) ||
    /^[0-9a-fA-F-]{24,}$/.test(trimmed)
  );
}

function cleanLabel(val?: string, fallback: string = ""): string {
  if (!val || isUuid(val)) return fallback;
  return val;
}

export function ExerciseShowcaseSection({ exercises }: ExerciseShowcaseSectionProps) {
  if (!exercises || exercises.length === 0) {
    return null;
  }

  return (
    <section className="exercise-showcase-section">
      <div className="exercise-showcase-header">
        <h2>Featured Workouts</h2>
        <Link
          aria-label="See all exercises"
          className="exercise-showcase-link"
          href="/search"
          transitionTypes={NAV_FORWARD}
        >
          <span>See all</span>
          <ArrowRight aria-hidden="true" size={14} />
        </Link>
      </div>

      <div className="exercise-card-grid">
        {exercises.map((ex) => {
          const groupLabel = cleanLabel(ex.muscleGroup, "FULL BODY");
          const equipmentLabel = cleanLabel(ex.equipment, "");

          return (
            <div className="exercise-showcase-card" key={ex.id}>
              <div className="exercise-showcase-card__media">
                {ex.imageUrl ? (
                  <img alt={ex.name} className="exercise-showcase-card__img" src={ex.imageUrl} />
                ) : (
                  <div className="exercise-showcase-card__fallback-img" />
                )}
                <div className="exercise-showcase-card__overlay" />

                <div className="exercise-showcase-card__duration">
                  <Clock size={11} />
                  <span>{ex.durationMins}m</span>
                </div>
              </div>

              <div className="exercise-showcase-card__body">
                {groupLabel && <span className="exercise-showcase-card__tag">{groupLabel}</span>}

                <Link
                  className="exercise-showcase-card__title"
                  href={`/search?query=${encodeURIComponent(ex.name)}`}
                  transitionTypes={NAV_FORWARD}
                >
                  <h3>{ex.name}</h3>
                </Link>

                <div className="exercise-showcase-card__meta">
                  {equipmentLabel ? <span>{equipmentLabel}</span> : <span />}
                  <span className="font-mono">{ex.prescription}</span>
                </div>

                <div className="exercise-showcase-card__actions">
                  <Link
                    className="exercise-showcase-card__add-btn"
                    href={`/workouts/adhoc?exerciseId=${encodeURIComponent(ex.id)}&name=${encodeURIComponent(ex.name)}&prescription=${encodeURIComponent(ex.prescription)}`}
                    transitionTypes={NAV_FORWARD}
                  >
                    <Play fill="currentColor" size={12} />
                    <span>Start Exercise</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
