"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";

/** How close to the bottom counts as "there is nothing more to see". */
const BOTTOM_SLACK_PX = 8;

type Block = { label: string; text: string };

function blocksFor(exercise: LiveExercise): Block[] {
  const blocks: Block[] = [];

  if (exercise.instructions?.trim()) {
    blocks.push({ label: "Description", text: exercise.instructions });
  }
  if (exercise.formCues[0]?.trim()) {
    blocks.push({ label: "Form Tip", text: exercise.formCues[0] });
  }
  if (exercise.breathingCue?.trim()) {
    blocks.push({ label: "Breathing", text: exercise.breathingCue });
  }
  if (exercise.commonMistakes[0]?.trim()) {
    blocks.push({ label: "Common Mistake", text: exercise.commonMistakes[0] });
  }

  return blocks;
}

export function CoachingPanel({ exercise }: { exercise: LiveExercise }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);

  const measure = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const remaining = panel.scrollHeight - panel.clientHeight - panel.scrollTop;
    setScrollable(remaining > BOTTOM_SLACK_PX);
  }, []);

  // Re-measure whenever the exercise changes — a shorter description can
  // remove the affordance entirely.
  useEffect(() => {
    measure();
  }, [exercise.exerciseId, measure]);

  // Re-measure on layout changes too — mobile browser chrome collapsing or
  // the on-screen keyboard opening changes clientHeight with no scroll
  // event and no exercise change. jsdom has no ResizeObserver, so guard it.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver !== "function") return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(panel);
    // The list grows and shrinks with the exercise; watch it too.
    if (panel.firstElementChild) observer.observe(panel.firstElementChild);

    return () => observer.disconnect();
  }, [measure]);

  return (
    <div
      // A scroll container must be reachable by keyboard, or its content is
      // unreachable for anyone not using a pointer.
      aria-label="Coaching instructions"
      className="live-screen__coach"
      data-scrollable={scrollable}
      onScroll={measure}
      ref={panelRef}
      role="region"
      tabIndex={0}
    >
      <dl className="live-coach">
        {blocksFor(exercise).map((block) => (
          <div className="live-coach__block" key={block.label}>
            <dt className="live-coach__label">{block.label}</dt>
            <dd className="live-coach__text">{block.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
