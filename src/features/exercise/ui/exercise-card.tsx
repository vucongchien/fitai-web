import { Camera, Dumbbell } from "lucide-react";
import Link from "next/link";

import type { CatalogMetadata, ExerciseSummary } from "@/features/exercise/domain/exercise";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface ExerciseCardProps {
  exercise: ExerciseSummary;
  catalog: CatalogMetadata;
}

function findName(pool: { id: string; name: string }[], id: string): string | undefined {
  return pool.find((entry) => entry.id === id)?.name;
}

export function ExerciseCard({ exercise, catalog }: ExerciseCardProps) {
  const bodyPart = findName(catalog.bodyParts, exercise.bodyPartId);
  const equipment = findName(catalog.equipments, exercise.equipmentId);
  const meta = [bodyPart, equipment].filter(Boolean).join(" · ");

  return (
    <Link
      aria-label={`Open ${exercise.name}`}
      className="ex-card"
      href={`/search/exercises/${exercise.id}`}
      transitionTypes={NAV_FORWARD}
    >
      <div className="ex-card__thumb" aria-hidden="true">
        <Dumbbell size={36} strokeWidth={1.3} />
        {exercise.hasAiSupported ? (
          <span className="ex-card__ai" aria-label="AI form tracking">
            <Camera size={12} strokeWidth={2} />
            AI
          </span>
        ) : null}
      </div>
      <div className="ex-card__body">
        <p className="ex-card__title">{exercise.name}</p>
        <p className="ex-card__meta">{meta}</p>
      </div>
    </Link>
  );
}
