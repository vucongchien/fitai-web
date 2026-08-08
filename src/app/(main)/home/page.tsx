import { Suspense } from "react";

import { getHomePageData } from "@/features/home/server/get-home-page-data";
import { HomeView } from "@/features/home/ui/home-view";
import { TodayHeader, TodayStreakBadge } from "@/features/home/ui/today-header";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Home — Today" };

async function HomeContent() {
  const data = await getHomePageData();
  return (
    <>
      <TodayStreakBadge streakDays={data.streak.days} />
      <HomeView data={data} />
    </>
  );
}

function HomeSkeleton() {
  return (
    <div aria-label="Loading home content" className="home-skeleton">
      <div className="skeleton-box mb-4 h-12 w-1/2 rounded-[10px] bg-[var(--color-surface-hover,#eee)]" />
      <div className="skeleton-box h-60 w-full rounded-[14px] bg-[var(--color-surface-hover,#eee)]" />
    </div>
  );
}

const HOME_FALLBACK = <HomeSkeleton />;

export default function HomePage() {
  return (
    <PageTransition className="page home-page">
      {/* Static Shell: LCP Title 'Today' and chassis header paint immediately (0ms) */}
      <TodayHeader />

      <Suspense fallback={HOME_FALLBACK}>
        <HomeContent />
      </Suspense>
    </PageTransition>
  );
}
