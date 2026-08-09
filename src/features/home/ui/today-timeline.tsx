"use client";

import { Apple, Check, ChevronRight, Dumbbell, Sparkles, Soup } from "lucide-react";
import Link from "next/link";

import type { TodayItemCategory, TodayTimelineItem } from "@/features/home/model/home-page.types";
import { cn } from "@/shared/lib/cn";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface TodayTimelineProps {
  items: TodayTimelineItem[];
  onGenerateRoadmap?: () => void;
  isGeneratingRoadmap?: boolean;
}

function EventIcon({ category, isComplete }: { category: TodayItemCategory; isComplete?: boolean }) {
  if (isComplete) {
    return <Check aria-hidden="true" size={16} strokeWidth={2.5} />;
  }
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
  onGenerateRoadmap: _onGenerateRoadmap,
  isGeneratingRoadmap: _isGeneratingRoadmap = false,
}: TodayTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center rounded-2xl border border-dashed border-neutral-200 bg-white space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[var(--color-action)]">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text)]">No meals or workouts scheduled for today</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Enjoy active recovery today, or view your full weekly schedule in Roadmap.
          </p>
        </div>
        <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/roadmap"
            transitionTypes={NAV_FORWARD}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-action)] text-white hover:bg-[var(--color-action-hover)] transition-colors flex items-center gap-1.5"
          >
            <span>View Weekly Roadmap</span>
          </Link>
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

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseMinutes = (tStr: string) => {
    const parts = tStr.split(":").map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const startMins = items.length > 0 ? parseMinutes(items[0].time) : 0;
  const endMins = items.length > 1 ? parseMinutes(items[items.length - 1].time) : startMins + 60;

  let progressPercent = 0;
  if (endMins > startMins) {
    progressPercent = Math.min(100, Math.max(0, ((currentMinutes - startMins) / (endMins - startMins)) * 100));
  } else if (currentMinutes >= startMins) {
    progressPercent = 100;
  }

  return (
    <ol className="week-route">
      <div
        className="week-route__progress-line"
        style={{ height: `calc((100% - 3.6rem) * ${progressPercent / 100})` }}
      />
      {items.map((item) => {
        const itemMins = parseMinutes(item.time);
        const isPassedTime = itemMins <= currentMinutes;

        const effectiveStatus =
          item.status === "complete"
            ? "complete"
            : item.status === "next"
              ? "next"
              : isPassedTime
                ? "passed-time"
                : "planned";

        const content = (
          <>
            <span className="week-route__marker">
              <EventIcon category={item.category} isComplete={item.status === "complete"} />
            </span>
            <div className="week-route__date">
              <strong>{item.time}</strong>
            </div>
            <div className="week-route__session">
              <div className="flex flex-wrap items-center gap-2">
                <h3>{item.title}</h3>
                {item.status === "next" ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-[var(--color-action)] uppercase tracking-wider">
                    Next up
                  </span>
                ) : null}
              </div>
              <span>{item.subtitle}</span>
            </div>
            <ChevronRight aria-hidden="true" className="week-route__chevron" size={18} />
          </>
        );

        return (
          <li className={cn("week-route__item", `week-route__item--${effectiveStatus}`)} key={item.id}>
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
