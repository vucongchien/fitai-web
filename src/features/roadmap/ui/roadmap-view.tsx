"use client";

import { Activity, ArrowRight, CalendarRange, Gauge, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { RoadmapPageData } from "@/features/roadmap/model/roadmap-page.types";
import { WeekRoute } from "@/features/roadmap/ui/week-route";
import { NAV_FORWARD } from "@/shared/ui/transition-types";
import { FeedbackState } from "@/shared/ui/feedback-state";
import { initiateRoadmapServerAction } from "@/features/roadmap/server/coaching-actions";

import { AIAdjustmentBanner } from "@/features/roadmap/ui/ai-adjustment-banner";

interface RoadmapViewProps {
  data: RoadmapPageData;
}

function ContextIcon({ iconName }: { iconName: string }) {
  switch (iconName) {
    case "calendar-range": {
      return <CalendarRange aria-hidden="true" size={20} />;
    }
    case "gauge": {
      return <Gauge aria-hidden="true" size={20} />;
    }
    case "activity": {
      return <Activity aria-hidden="true" size={20} />;
    }
    default: {
      return <Sparkles aria-hidden="true" size={20} />;
    }
  }
}

export function RoadmapView({ data }: RoadmapViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCreateRoadmap = () => {
    startTransition(async () => {
      const res = await initiateRoadmapServerAction();
      if (res.success) {
        router.refresh();
      }
    });
  };

  const handleRetry = () => {
    router.refresh();
  };

  if (data.error) {
    const isNoRoadmap = data.error.type === "NO_ROADMAP";
    return (
      <div className="roadmap-layout mt-4">
        <section className="content-section">
          <FeedbackState
            title={isNoRoadmap ? "Workout roadmap not configured yet" : "Server connection error"}
            description={
              isNoRoadmap
                ? "Please update your Onboarding Profile so AI Coach can analyze your fitness level and automatically generate a personalized workout roadmap."
                : "A connection issue occurred while communicating with the server. Please check your network connection and try again."
            }
            tone={isNoRoadmap ? "empty" : "error"}
            actionLabel={
              isPending
                ? "Generating roadmap..."
                : (isNoRoadmap
                ? "Click to generate roadmap"
                : "Click to retry")
            }
            onActionClick={isNoRoadmap ? handleCreateRoadmap : handleRetry}
          />
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="roadmap-layout">
        <AIAdjustmentBanner />
        <section className="content-section">
          <div className="content-section__header">
            <h2>
              Week <span className="data-value">{data.activeWeek}</span>
            </h2>
            <p>{data.currentWeekDateRange}</p>
          </div>

          <WeekRoute sessions={data.currentWeekSessions} />

          <Link
            className="ui-button ui-button--secondary ui-button--medium roadmap-view__schedule"
            href="/schedule"
            transitionTypes={NAV_FORWARD}
          >
            <span className="ui-button__label">
              See all four weeks
              <ArrowRight aria-hidden="true" size={17} />
            </span>
          </Link>
        </section>

        <aside className="roadmap-context">
          {data.contextItems.map((item) => (
            <div className="roadmap-context__item" key={item.id}>
              <ContextIcon iconName={item.iconName} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
