import { ArrowLeft, ArrowRight, Camera, Dumbbell, Play, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { exerciseMetaLine } from "@/features/exercise/domain/exercise";
import type { ExerciseSummary } from "@/features/exercise/domain/exercise";
import {
  categoryLabel,
  equipmentLabel,
  forceLabel,
  levelLabel,
  mechanicLabel,
  muscleGroupLabel,
} from "@/shared/lib/taxonomy";
import { BrandMark } from "@/shared/ui/brand-mark";
import { HeaderActions } from "@/shared/ui/header-actions";
import { NAV_BACK, NAV_FORWARD } from "@/shared/ui/transition-types";

interface ExerciseDetailProps {
  exercise: ExerciseSummary;
}

// Source data ships a start and an end frame per exercise.
const MAX_FRAMES = 2;

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

export function ExerciseDetail({ exercise }: ExerciseDetailProps) {
  const frames = exercise.images.slice(0, MAX_FRAMES);
  const secondaryMuscles = exercise.secondaryMuscles.map(muscleGroupLabel).filter(Boolean);
  const instructionSteps = exercise.instructions.map((step) => step.trim()).filter(Boolean);
  const videoMediaUrl = exercise.videoUrl;
  const youtubeEmbed = videoMediaUrl ? formatYouTubeEmbedUrl(videoMediaUrl) : null;
  const force = forceLabel(exercise.force);
  const mechanic = mechanicLabel(exercise.mechanic);
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
          {frames.length > 0 ? (
            <div className="detail-thumb__frames">
              {frames.map((src, idx) => (
                <div className="detail-thumb__frame" key={src}>
                  <Image
                    alt={`${exercise.name} – ${idx === 0 ? "start" : "end"} position`}
                    className="detail-thumb__img"
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 768px) 50vw, 300px"
                    src={src}
                  />
                </div>
              ))}
            </div>
          ) : videoMediaUrl ? (
            <div className="detail-thumb__fallback">
              <Video size={56} strokeWidth={1.2} />
            </div>
          ) : (
            <div className="detail-thumb__fallback">
              <Dumbbell size={56} strokeWidth={1.2} />
            </div>
          )}

          {exercise.hasAiSupported ? (
            <span className="ex-card__ai detail-thumb__ai">
              <Camera size={12} strokeWidth={2} />
              AI Form Tracking Active
            </span>
          ) : null}
        </div>

        <section className="detail-lede">
          <h1 className="detail-title">{exercise.name}</h1>
          <p className="detail-meta">{exerciseMetaLine(exercise)}</p>

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
              Maintain proper posture and perform controlled reps focusing on full muscle range of
              motion.
            </p>
          )}
        </section>

        <dl className="detail-facts">
          <div>
            <dt>Target Muscle</dt>
            <dd>{muscleGroupLabel(exercise.primaryMuscle)}</dd>
          </div>

          {secondaryMuscles.length > 0 ? (
            <div>
              <dt>Secondary Muscles</dt>
              <dd>{secondaryMuscles.join(", ")}</dd>
            </div>
          ) : null}

          <div>
            <dt>Equipment</dt>
            <dd>{equipmentLabel(exercise.equipment)}</dd>
          </div>

          <div>
            <dt>Category</dt>
            <dd>{categoryLabel(exercise.category)}</dd>
          </div>

          <div>
            <dt>Level</dt>
            <dd>{levelLabel(exercise.level)}</dd>
          </div>

          {force ? (
            <div>
              <dt>Force</dt>
              <dd>{force}</dd>
            </div>
          ) : null}

          {mechanic ? (
            <div>
              <dt>Mechanic</dt>
              <dd>{mechanic}</dd>
            </div>
          ) : null}

          <div>
            <dt>Rest Per Set</dt>
            <dd>{exercise.defaultRestSeconds}s</dd>
          </div>
        </dl>

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
                <video controls src={videoMediaUrl} poster={frames[0]}>
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
