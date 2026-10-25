import { Suspense } from "react";

import { HeaderGamificationChips } from "@/features/gamification/ui/header-gamification-chips";
import { getHomePageData } from "@/features/home/server/get-home-page-data";
import { HomeView } from "@/features/home/ui/home-view";
import { TodayHeader } from "@/features/home/ui/today-header";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Home — Today" };

async function HomeContent() {
  const data = await getHomePageData();
  return (
    <>
      <HeaderGamificationChips
        streakDays={data.gamification?.streakDays ?? data.streak.days}
        isActiveToday={data.gamification?.isActiveToday ?? false}
        coins={data.gamification?.coins ?? 0}
      />
      <HomeView data={data} />
    </>
  );
}

function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading home content" className="home-skeleton">
      <div className="skeleton-box mb-4 h-12 w-1/2 rounded-[10px] bg-[var(--color-surface-subtle)]" />
      <div className="skeleton-box h-60 w-full rounded-[14px] bg-[var(--color-surface-subtle)]" />
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
