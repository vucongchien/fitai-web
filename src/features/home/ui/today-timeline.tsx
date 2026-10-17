"use client";

import { Apple, Check, ChevronRight, Dumbbell, Sparkles, Soup } from "lucide-react";
import Link from "next/link";

import type { TodayItemCategory, TodayTimelineItem } from "@/features/home/model/home-page.types";
import { cn } from "@/shared/lib/cn";
import { Button, buttonVariants } from "@/shared/ui/button";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface TodayTimelineProps {
  items: TodayTimelineItem[];
  hasActiveRoadmap?: boolean;
  onGenerateRoadmap?: () => void;
  isGeneratingRoadmap?: boolean;
}

function EventIcon({
  category,
  isComplete,
}: {
  category: TodayItemCategory;
  isComplete?: boolean;
}) {
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
  hasActiveRoadmap = false,
  onGenerateRoadmap,
  isGeneratingRoadmap = false,
}: TodayTimelineProps) {
  if (items.length === 0) {
    if (!hasActiveRoadmap) {
      return (
        <div className="timeline-empty-card">
          <div className="timeline-empty-card__icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h3>No active training plan yet</h3>
            <p>
              Build your personalized 4-week roadmap to schedule daily workouts and meals tailored to your body.
            </p>
          </div>
          <div className="timeline-empty-card__actions">
            {onGenerateRoadmap ? (
              <Button
                loading={isGeneratingRoadmap}
                onClick={onGenerateRoadmap}
                size="medium"
                variant="primary"
              >
                <Sparkles size={15} />
                <span>Build 4-Week Roadmap</span>
              </Button>
            ) : (
              <Link
                className={buttonVariants({ variant: "primary", size: "medium" })}
                href="/roadmap"
                transitionTypes={NAV_FORWARD}
              >
                <span className="ui-button__label">
                  <Sparkles size={15} />
                  Build 4-Week Roadmap
                </span>
              </Link>
            )}
            <Link
              className={buttonVariants({ variant: "secondary", size: "medium" })}
              href="/workouts/adhoc"
              transitionTypes={NAV_FORWARD}
            >
              <span className="ui-button__label">
                <Dumbbell size={15} />
                Start Extra Workout
              </span>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="timeline-empty-card">
        <div className="timeline-empty-card__icon">
          <Sparkles size={20} />
        </div>
        <div>
          <h3>Rest Day &amp; Active Recovery</h3>
          <p>
            No workouts or meals scheduled for today. Enjoy active recovery, or review your schedule in Roadmap.
          </p>
        </div>
        <div className="timeline-empty-card__actions">
          <Link
            className={buttonVariants({ variant: "primary", size: "medium" })}
            href="/roadmap"
            transitionTypes={NAV_FORWARD}
          >
            <span className="ui-button__label">View Weekly Roadmap</span>
          </Link>
          <Link
            className={buttonVariants({ variant: "secondary", size: "medium" })}
            href="/workouts/adhoc"
            transitionTypes={NAV_FORWARD}
          >
            <span className="ui-button__label">
              <Dumbbell size={15} />
              Start Extra Workout
            </span>
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
    progressPercent = Math.min(
      100,
      Math.max(0, ((currentMinutes - startMins) / (endMins - startMins)) * 100),
    );
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
                  <span className="timeline-next-badge">
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
          <li
            className={cn("week-route__item", `week-route__item--${effectiveStatus}`)}
            key={item.id}
          >
            {item.href ? (
              <Link
                aria-label={item.category === "workout" ? "Begin session" : `View ${item.title}`}
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
