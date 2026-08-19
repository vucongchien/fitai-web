"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { HomePageData } from "@/features/home/model/home-page.types";
import { CoachNote } from "@/features/home/ui/coach-note";
import { EvidenceSection } from "@/features/home/ui/evidence-section";
import { ExerciseShowcaseSection } from "@/features/home/ui/exercise-showcase-section";
import { MuscleGroupSelector } from "@/features/home/ui/muscle-group-selector";
import { ProfileCompletionBanner } from "@/features/home/ui/profile-completion-banner";
import { QuickActionsFab } from "@/features/home/ui/quick-actions-fab";
import { TodayTimeline } from "@/features/home/ui/today-timeline";
import { AIAdjustmentBanner } from "@/features/roadmap/ui/ai-adjustment-banner";
import { initiateRoadmapServerAction } from "@/features/roadmap/server/coaching-actions";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface HomeViewProps {
  data: HomePageData;
}

export function HomeView({ data }: HomeViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleGenerateRoadmap = () => {
    startTransition(async () => {
      const res = await initiateRoadmapServerAction();
      if (res.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="home-container space-y-6">
      {/* Realtime AI Plan Adjustment Banner (Real Data 100%) */}
      <AIAdjustmentBanner />

      {/* AI Coach Greeting & Note */}
      <CoachNote message={data.coachNote} />

      {/* Conditional Profile Completion Banner */}
      <ProfileCompletionBanner
        completionRate={data.profileCompletionRate}
        missingFields={data.missingFields}
      />

      {/* Today's Timeline & Evidence Sidebar (Moved to top as requested!) */}
      <div className="home-grid">
        <section className="content-section home-week">
          <div className="content-section__header">
            <h2>Today&rsquo;s Schedule</h2>
            <p>Meals and sessions in order</p>
          </div>

          <TodayTimeline
            isGeneratingRoadmap={isPending}
            items={data.todayTimeline}
            onGenerateRoadmap={handleGenerateRoadmap}
          />

          <Link className="text-action" href="/roadmap" transitionTypes={NAV_FORWARD}>
            <span>Open 4-week roadmap</span>
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </section>

        {data.evidenceItems && data.evidenceItems.length > 0 ? (
          <aside className="home-side">
            <EvidenceSection items={data.evidenceItems} />
          </aside>
        ) : null}
      </div>

      {/* Target Muscle Group Categories (Navigates to /search with body filter applied!) */}
      {data.muscleGroups && data.muscleGroups.length > 0 ? (
        <MuscleGroupSelector categories={data.muscleGroups} />
      ) : null}

      {/* Featured Exercises & Recommended Workouts Showcase */}
      {data.featuredExercises && data.featuredExercises.length > 0 ? (
        <ExerciseShowcaseSection exercises={data.featuredExercises} />
      ) : null}

      <QuickActionsFab actions={data.quickActions} />
    </div>
  );
}
