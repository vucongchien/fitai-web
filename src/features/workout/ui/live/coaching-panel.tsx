"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";

/** How close to the bottom counts as "there is nothing more to see". */
const BOTTOM_SLACK_PX = 8;

/**
 * The instruction, split into paragraphs.
 *
 * Only `instructions` reaches this screen: while a set is running the user is
 * mid-plank glancing down, and one voice reads faster than four labelled ones.
 * Form cues, breathing and common mistakes are still a tap away in the
 * exercise guide sheet, which is where someone reads *about* the movement.
 */
function paragraphsFor(exercise: LiveExercise): string[] {
  return (exercise.instructions ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function CoachingPanel({ exercise }: { exercise: LiveExercise }) {
  const panelRef = useRef<HTMLElement>(null);
  const [scrollable, setScrollable] = useState(false);

  const measure = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) {return;}
    const remaining = panel.scrollHeight - panel.clientHeight - panel.scrollTop;
    setScrollable(remaining > BOTTOM_SLACK_PX);
  }, []);

  // Re-measure whenever the exercise changes — a shorter description can
  // Remove the affordance entirely.
  useEffect(() => {
    measure();
  }, [exercise.exerciseId, measure]);

  // Re-measure on layout changes too — mobile browser chrome collapsing or
  // The on-screen keyboard opening changes clientHeight with no scroll
  // Event and no exercise change. jsdom has no ResizeObserver, so guard it.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver !== "function") {return;}

    const observer = new ResizeObserver(() => measure());
    observer.observe(panel);
    // The list grows and shrinks with the exercise; watch it too.
    if (panel.firstElementChild) {observer.observe(panel.firstElementChild);}

    return () => observer.disconnect();
  }, [measure]);

  return (
    <section
      // A named <section> is a landmark region on its own, so `role="region"`
      // Was redundant markup for the same semantics.
      //
      // `tabIndex={0}` stays deliberately: a scroll container must be reachable
      // By keyboard, or its content is unreachable for anyone not using a
      // Pointer (WCAG 2.1.1).
      aria-label="Coaching instructions"
      className="live-screen__coach"
      data-scrollable={scrollable}
      onScroll={measure}
      ref={panelRef}
      tabIndex={0}
    >
      <div className="live-coach">
        {paragraphsFor(exercise).map((text) => (
          <p className="live-coach__text" key={text}>
            {text}
          </p>
        ))}
      </div>
    </section>
  );
}
