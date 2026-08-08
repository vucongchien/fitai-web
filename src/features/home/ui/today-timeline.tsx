"use client";

import { Apple, ChevronRight, Dumbbell, Sparkles, Soup } from "lucide-react";
import Link from "next/link";

import type { TodayItemCategory, TodayTimelineItem } from "@/features/home/model/home-page.types";
import { cn } from "@/shared/lib/cn";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface TodayTimelineProps {
  items: TodayTimelineItem[];
  onGenerateRoadmap?: () => void;
  isGeneratingRoadmap?: boolean;
}

function EventIcon({ category }: { category: TodayItemCategory }) {
  if (category === "workout") {
    return <Dumbbell aria-hidden="true" size={15} />;
  }
  if (category === "snack") {
    return <Apple aria-hidden="true" size={15} />;
  }
  return <Soup aria-hidden="true" size={15} />;
}

export function TodayTimeline({
  items,
  onGenerateRoadmap,
  isGeneratingRoadmap = false,
}: TodayTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center rounded-2xl border border-dashed border-neutral-200 bg-white space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[var(--color-action)]">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text)]">No active training roadmap</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Generate your personalized 4-week AI training schedule or start an ad-hoc session.
          </p>
        </div>
        <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
          {onGenerateRoadmap ? (
            <button
              onClick={onGenerateRoadmap}
              disabled={isGeneratingRoadmap}
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-action)] text-white hover:bg-[var(--color-action-hover)] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{isGeneratingRoadmap ? "Generating Roadmap..." : "Generate AI Roadmap"}</span>
            </button>
          ) : null}
          <Link
            href="/workouts/adhoc"
            transitionTypes={NAV_FORWARD}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 text-[var(--color-text-muted)] hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
          >
            <Dumbbell size={14} />
            <span>Start Extra Workout</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ol className="week-route">
      {items.map((item) => {
        const content = (
          <>
            <span className="week-route__marker">
              <EventIcon category={item.category} />
            </span>
            <div className="week-route__date">
              <strong>{item.time}</strong>
            </div>
            <div className="week-route__session">
              <h3>{item.title}</h3>
              <span>{item.subtitle}</span>
            </div>
            <ChevronRight aria-hidden="true" className="week-route__chevron" size={18} />
          </>
        );

        return (
          <li className={cn("week-route__item", `week-route__item--${item.status}`)} key={item.id}>
            {item.href ? (
              <Link
                aria-label={
                  item.category === "workout" ? "Begin session" : `View ${item.title}`
                }
                className="week-route__row"
                href={item.href}
                transitionTypes={NAV_FORWARD}
              >
                {content}
              </Link>
            ) : (
              <div className="week-route__row">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
