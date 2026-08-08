import { AlertCircle, ArrowLeft, ArrowRight, Camera, CheckCircle2, Dumbbell, Play, Video } from "lucide-react";
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

function isUuid(str?: string): boolean {
  if (!str) {return false;}
  const trimmed = str.trim();
  return (
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed) ||
    /^[0-9a-fA-F-]{24,}$/.test(trimmed)
  );
}

function findName(pool: { id: string; name: string }[], id: string): string | undefined {
  if (!id || isUuid(id)) {return undefined;}
  return pool.find((entry) => entry.id === id || entry.name.toLowerCase() === id.toLowerCase())?.name;
}

function parseInstructionSteps(raw?: string): string[] {
  if (!raw) {return [];}
  const splitSteps = raw
    .split(/(?=\b\d+\.\s+)/g)
    .map((s) => s.trim())
    .filter(Boolean);

  if (splitSteps.length > 1) {
    return splitSteps.map((s) => s.replace(/^\d+\.\s*/, ""));
  }

  const lineSteps = raw
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return lineSteps;
}

function formatYouTubeEmbedUrl(url: string): string | null {
  try {
    if (url.includes("youtube.com/watch")) {
      const v = new URL(url).searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.includes("youtube.com/embed/")) {
      return url;
    }
  } catch {
    return null;
  }
  return null;
}

export function ExerciseDetail({ exercise, catalog }: ExerciseDetailProps) {
  const bodyPart = findName(catalog.bodyParts, exercise.bodyPartId) || (isUuid(exercise.bodyPartId) ? undefined : exercise.bodyPartId);
  const equipment = findName(catalog.equipments, exercise.equipmentId) || (isUuid(exercise.equipmentId) ? undefined : exercise.equipmentId);
  const targetMuscle = findName(catalog.muscles, exercise.targetMuscleId) || (isUuid(exercise.targetMuscleId) ? undefined : exercise.targetMuscleId);
  const secondaryMuscles = (exercise.secondaryMuscleIds || [])
    .map((id) => findName(catalog.muscles, id) || (isUuid(id) ? undefined : id))
    .filter((name): name is string => Boolean(name));
  const tagNames = (exercise.tagIds || [])
    .map((id) => findName(catalog.tags, id) || (isUuid(id) ? undefined : id))
    .filter((name): name is string => Boolean(name));

  const instructionSteps = parseInstructionSteps(exercise.instructions);
  const videoMediaUrl = exercise.videoUrl || exercise.mediaUrl;
  const youtubeEmbed = videoMediaUrl ? formatYouTubeEmbedUrl(videoMediaUrl) : null;
  const startAdhocUrl = `/workouts/adhoc?exerciseId=${encodeURIComponent(exercise.id)}&name=${encodeURIComponent(exercise.name)}&prescription=3%20%C3%97%2010%20reps`;

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
        <div className="detail-thumb">
          {exercise.thumbnailUrl ? (
            <img alt={exercise.name} className="detail-thumb__img" src={exercise.thumbnailUrl} />
          ) : (videoMediaUrl ? (
            <div className="detail-thumb__fallback">
              <Video size={56} strokeWidth={1.2} />
            </div>
          ) : (
            <div className="detail-thumb__fallback">
              <Dumbbell size={56} strokeWidth={1.2} />
            </div>
          ))}

          {exercise.hasAiSupported ? (
            <span className="ex-card__ai detail-thumb__ai">
              <Camera size={12} strokeWidth={2} />
              AI Form Tracking Active
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

          {instructionSteps.length > 0 ? (
            <div className="detail-instructions">
              <h3>Execution Instructions</h3>
              <ol className="detail-steps-list">
                {instructionSteps.map((step, idx) => (
                  <li className="detail-step-item" key={idx}>
                    <span className="detail-step-num">{idx + 1}</span>
                    <span className="detail-step-text">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="detail-body detail-body--muted">
              Maintain proper posture and perform controlled reps focusing on full muscle range of motion.
            </p>
          )}
        </section>

        <dl className="detail-facts">
          <div>
            <dt>Target Muscle</dt>
            <dd>{targetMuscle ?? bodyPart ?? "Full Body"}</dd>
          </div>

          {secondaryMuscles.length > 0 ? (
            <div>
              <dt>Secondary Muscles</dt>
              <dd>{secondaryMuscles.join(", ")}</dd>
            </div>
          ) : null}

          <div>
            <dt>Equipment</dt>
            <dd>{equipment ?? "Standard Equipment"}</dd>
          </div>

          <div>
            <dt>Rest Per Set</dt>
            <dd>{exercise.defaultRestSeconds ? `${exercise.defaultRestSeconds}s` : "90s"}</dd>
          </div>

          <div>
            <dt>Difficulty</dt>
            <dd>{DIFFICULTY_LABEL[exercise.difficulty] || "Beginner"}</dd>
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
            <h2>Form Cues</h2>
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
            <h2>Common Mistakes</h2>
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

        {videoMediaUrl ? (
          <section className="detail-section">
            <h2>Demonstration Video</h2>
            <div className="detail-video-wrapper">
              {youtubeEmbed ? (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="detail-video-iframe"
                  src={youtubeEmbed}
                  title={`${exercise.name} video demonstration`}
                />
              ) : (
                <video controls src={videoMediaUrl} poster={exercise.thumbnailUrl || undefined}>
                  <track kind="captions" />
                  Your browser does not support HTML5 video playback.
                </video>
              )}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="detail-action">
        <Link
          className="primary-button full-width-btn"
          href={startAdhocUrl}
          transitionTypes={NAV_FORWARD}
        >
          <Play fill="currentColor" size={16} />
          <span>Start Workout With This Exercise</span>
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </footer>
    </div>
  );
}
