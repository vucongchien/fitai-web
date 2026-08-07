import { AlertCircle, ArrowLeft, ArrowRight, Camera, CheckCircle2, Dumbbell } from "lucide-react";
import Link from "next/link";

import { DIFFICULTY_LABEL } from "@/features/exercise/domain/exercise";
import type { CatalogMetadata, ExerciseSummary } from "@/features/exercise/domain/exercise";
import { BrandMark } from "@/shared/ui/brand-mark";
import { HeaderActions } from "@/shared/ui/header-actions";
import { NAV_BACK, NAV_FORWARD } from "@/shared/ui/transition-types";

interface ExerciseDetailProps {
  exercise: ExerciseSummary;
  catalog: CatalogMetadata;
}

function findName(pool: { id: string; name: string }[], id: string): string | undefined {
  return pool.find((entry) => entry.id === id)?.name;
}

export function ExerciseDetail({ exercise, catalog }: ExerciseDetailProps) {
  const bodyPart = findName(catalog.bodyParts, exercise.bodyPartId);
  const equipment = findName(catalog.equipments, exercise.equipmentId);
  const targetMuscle = findName(catalog.muscles, exercise.targetMuscleId);
  const tagNames = exercise.tagIds
    .map((id) => findName(catalog.tags, id))
    .filter((name): name is string => Boolean(name));

  return (
    <div className="focused-page detail-page">
      <header className="focused-header">
        <Link
          aria-label="Back to search"
          className="focused-header__back"
          href="/search"
          transitionTypes={NAV_BACK}
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <BrandMark />
        <HeaderActions />
      </header>

      <main className="focused-main detail-main">
        <div className="detail-thumb" aria-hidden="true">
          <Dumbbell size={64} strokeWidth={1.2} />
          {exercise.hasAiSupported ? (
            <span className="ex-card__ai">
              <Camera size={12} strokeWidth={2} />
              AI form
            </span>
          ) : null}
        </div>

        <section className="detail-lede">
          <h1 className="detail-title">{exercise.name}</h1>
          <p className="detail-meta">
            {[bodyPart, equipment, DIFFICULTY_LABEL[exercise.difficulty]]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {exercise.instructions ? <p className="detail-body">{exercise.instructions}</p> : null}
        </section>

        <dl className="detail-facts">
          <div>
            <dt>Target muscle</dt>
            <dd>{targetMuscle ?? "—"}</dd>
          </div>
          <div>
            <dt>Rest per set</dt>
            <dd>{exercise.defaultRestSeconds}s</dd>
          </div>
          {tagNames.length > 0 ? (
            <div>
              <dt>Tags</dt>
              <dd className="detail-facts__chip-row">
                {tagNames.map((name) => (
                  <span className="chip" key={name}>
                    {name}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>

        {exercise.formCues && exercise.formCues.length > 0 ? (
          <section className="detail-section">
            <h2>Form cues</h2>
            <ul className="cue-list">
              {exercise.formCues.map((cue) => (
                <li key={cue}>
                  <CheckCircle2 aria-hidden="true" size={16} />
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {exercise.commonMistakes && exercise.commonMistakes.length > 0 ? (
          <section className="detail-section">
            <h2>Common mistakes</h2>
            <ul className="cue-list cue-list--warn">
              {exercise.commonMistakes.map((mistake) => (
                <li key={mistake}>
                  <AlertCircle aria-hidden="true" size={16} />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="detail-section">
          <h2>Video</h2>
          <p className="detail-body detail-body--muted">
            A guided video will ship in a future update. Use the cues above for now.
          </p>
        </section>
      </main>

      <footer className="detail-action">
        <Link
          className="secondary-button"
          href={`/sessions/new?prefill=${exercise.id}`}
          transitionTypes={NAV_FORWARD}
        >
          Add to ad-hoc
        </Link>
        <Link
          className="primary-button"
          href={`/sessions/new?prefill=${exercise.id}&start=1`}
          transitionTypes={NAV_FORWARD}
        >
          Start now
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </footer>
    </div>
  );
}
