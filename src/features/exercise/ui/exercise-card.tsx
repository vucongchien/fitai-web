import { Camera, Clock, Dumbbell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { exerciseMetaLine } from "@/features/exercise/domain/exercise";
import type { ExerciseSummary } from "@/features/exercise/domain/exercise";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface ExerciseCardProps {
  exercise: ExerciseSummary;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const metaText = exerciseMetaLine(exercise) || "Movement";
  const thumbnail = exercise.images[0];

  return (
    <Link
      aria-label={`Open ${exercise.name}`}
      className="ex-card"
      href={`/search/exercises/${exercise.id}`}
      transitionTypes={NAV_FORWARD}
    >
      <div className="ex-card__thumb">
        {thumbnail ? (
          <Image
            alt={exercise.name}
            className="ex-card__img"
            fill
            sizes="(max-width: 640px) 100vw, 320px"
            src={thumbnail}
          />
        ) : (
          <div className="ex-card__icon-fallback">
            <Dumbbell size={32} strokeWidth={1.3} />
          </div>
        )}

        {exercise.hasAiSupported ? (
          <span className="ex-card__ai" aria-label="AI form tracking">
            <Camera size={11} strokeWidth={2} />
            AI
          </span>
        ) : null}
      </div>

      <div className="ex-card__body">
        <h4 className="ex-card__title">{exercise.name}</h4>
        <p className="ex-card__meta">{metaText}</p>

        <div className="ex-card__chips">
          {exercise.defaultRestSeconds ? (
            <span className="chip chip--subtle">
              <Clock size={10} />
              {exercise.defaultRestSeconds}s rest
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
