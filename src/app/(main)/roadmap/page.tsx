import { Suspense } from "react";

import { getRoadmapPageData } from "@/features/roadmap/server/get-roadmap-page-data";
import { RoadmapView } from "@/features/roadmap/ui/roadmap-view";
import { getWorkoutStatsData } from "@/features/workout-stats/server/get-workout-stats-data";
import { WorkoutStatsPanel } from "@/features/workout-stats/ui/workout-stats-panel";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Workout" };

async function WorkoutStatsContent({ children }: { children?: React.ReactNode }) {
  const data = await getWorkoutStatsData();
  return <WorkoutStatsPanel data={data}>{children}</WorkoutStatsPanel>;
}

async function RoadmapContent() {
  const data = await getRoadmapPageData();
  return <RoadmapView data={data} />;
}

function StatsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading workout statistics" className="nutrition-skeleton">
      <div className="nutrition-skeleton__dial" />
      <div className="nutrition-skeleton__line" />
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="roadmap-skeleton mt-4">
      <div className="skeleton-box h-12 w-full mb-4 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)]" />
      <div className="skeleton-box h-[300px] w-full rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)]" />
    </div>
  );
}

const STATS_FALLBACK = <StatsSkeleton />;
const ROADMAP_FALLBACK = <RoadmapSkeleton />;

export default function RoadmapPage() {
  return (
    <PageTransition className="w-full">
      <header className="page-heading px-5 sm:px-6 pt-6 pb-2">
        <div>
          <h1>Workout</h1>
          <p>What you have completed, and what the four-week route holds next.</p>
        </div>
      </header>

      <div className="px-5 sm:px-6 pb-8 bg-white">
        <Suspense fallback={STATS_FALLBACK}>
          <WorkoutStatsContent>
            <Suspense fallback={ROADMAP_FALLBACK}>
              <RoadmapContent />
            </Suspense>
          </WorkoutStatsContent>
        </Suspense>
      </div>
    </PageTransition>
  );
}
