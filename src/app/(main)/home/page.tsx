import { Suspense } from "react";

import { getHomeOverview } from "@/features/home/server/get-home-overview";
import { getHomePageData } from "@/features/home/server/get-home-page-data";
import { HomeView } from "@/features/home/ui/home-view";
import { TodayHeader } from "@/features/home/ui/today-header";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Home — Today" };

async function HomeContent() {
  const [data, overview] = await Promise.all([getHomePageData(), getHomeOverview()]);
  return <HomeView data={data} overview={overview} />;
}

function HomeSkeleton() {
  return (
    <div aria-label="Loading home content" className="home-skeleton">
      <div className="skeleton-box h-12 w-1/2 mb-4 rounded-[10px] bg-[var(--color-surface-hover,#eee)]" />
      <div className="skeleton-box h-60 w-full rounded-[14px] bg-[var(--color-surface-hover,#eee)]" />
    </div>
  );
}

export default function HomePage() {
  return (
    <PageTransition className="page home-page">
      {/* Static Shell: LCP Title 'Today' and chassis header paint immediately (0ms) */}
      <TodayHeader />

      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </PageTransition>
  );
}
