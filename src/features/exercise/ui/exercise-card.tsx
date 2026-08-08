import { Camera, Clock, Dumbbell } from "lucide-react";
import Link from "next/link";

import { DIFFICULTY_LABEL } from "@/features/exercise/domain/exercise";
import type { CatalogMetadata, ExerciseSummary } from "@/features/exercise/domain/exercise";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface ExerciseCardProps {
  exercise: ExerciseSummary;
  catalog: CatalogMetadata;
}

function isUuid(str?: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  return (
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed) ||
    /^[0-9a-fA-F-]{24,}$/.test(trimmed)
  );
}

function findName(pool: { id: string; name: string }[], id: string): string | undefined {
  if (!id || isUuid(id)) return undefined;
  return pool.find((entry) => entry.id === id || entry.name.toLowerCase() === id.toLowerCase())?.name;
}

export function ExerciseCard({ exercise, catalog }: ExerciseCardProps) {
  const bodyPart = findName(catalog.bodyParts, exercise.bodyPartId) || (isUuid(exercise.bodyPartId) ? undefined : exercise.bodyPartId);
  const equipment = findName(catalog.equipments, exercise.equipmentId) || (isUuid(exercise.equipmentId) ? undefined : exercise.equipmentId);
  const diffLabel = DIFFICULTY_LABEL[exercise.difficulty];

  const metaParts = [bodyPart, equipment, diffLabel].filter(Boolean);
  const metaText = metaParts.length > 0 ? metaParts.join(" · ") : "Movement";

  return (
    <Link
      aria-label={`Open ${exercise.name}`}
      className="ex-card"
      href={`/search/exercises/${exercise.id}`}
      transitionTypes={NAV_FORWARD}
    >
      <div className="ex-card__thumb">
        {exercise.thumbnailUrl ? (
          <img alt={exercise.name} className="ex-card__img" src={exercise.thumbnailUrl} />
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
