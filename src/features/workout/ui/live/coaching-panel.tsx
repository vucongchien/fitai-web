"use client";

import { useCallback, useState } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";

/** How close to the bottom counts as "there is nothing more to see". */
const BOTTOM_SLACK_PX = 8;

// The instruction in paragraphs. Only `instructions` shows mid-set, where one voice reads faster;
// form cues, breathing and common mistakes stay a tap away in the exercise guide sheet.
function paragraphsFor(exercise: LiveExercise): string[] {
  return exercise.instructions.map((line) => line.trim()).filter(Boolean);
}

export function CoachingPanel({ exercise }: { exercise: LiveExercise }) {
  const [scrollable, setScrollable] = useState(false);

  const panelRefCallback = useCallback(
    (panel: HTMLElement | null) => {
      if (!panel) return;

      const measure = () => {
        const remaining = panel.scrollHeight - panel.clientHeight - panel.scrollTop;
        setScrollable(remaining > BOTTOM_SLACK_PX);
      };

      measure();

      if (typeof ResizeObserver === "function") {
        const observer = new ResizeObserver(() => measure());
        observer.observe(panel);
        if (panel.firstElementChild) {
          observer.observe(panel.firstElementChild);
        }
        return () => observer.disconnect();
      }
    },
    [exercise.exerciseId],
  );

  const onScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const panel = event.currentTarget;
    const remaining = panel.scrollHeight - panel.clientHeight - panel.scrollTop;
    setScrollable(remaining > BOTTOM_SLACK_PX);
  }, []);

  return (
    <section
      // A named <section> is already a landmark, so no role="region". tabIndex={0} stays: a scroll
      // container must be keyboard-reachable, or pointer-less users cannot reach it (WCAG 2.1.1).
      aria-label="Coaching instructions"
      className="live-screen__coach"
      data-scrollable={scrollable}
      onScroll={onScroll}
      ref={panelRefCallback}
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
