import { Suspense } from "react";

import { getRoadmapPageData } from "@/features/roadmap/server/get-roadmap-page-data";
import { RoadmapView } from "@/features/roadmap/ui/roadmap-view";
import { PageTransition } from "@/shared/ui/page-transition";
import { TripleLane } from "@/shared/ui/triple-lane";

export const metadata = { title: "Roadmap" };

async function RoadmapContent() {
  const data = await getRoadmapPageData();
  return <RoadmapView data={data} />;
}

function RoadmapSkeleton() {
  return (
    <div className="roadmap-skeleton mt-4">
      <div className="skeleton-box h-12 w-full mb-4 rounded-[10px] bg-[var(--color-surface-hover,#eee)]" />
      <div className="skeleton-box h-[300px] w-full rounded-[14px] bg-[var(--color-surface-hover,#eee)]" />
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <PageTransition className="page roadmap-page">
      <header className="page-heading">
        <div>
          <h1>Your four-week route</h1>
          <p>The plan builds gradually, then gives your body room to absorb the work.</p>
        </div>
      </header>

      <TripleLane active="plan" labelled morph />

      <Suspense fallback={<RoadmapSkeleton />}>
        <RoadmapContent />
      </Suspense>
    </PageTransition>
  );
}
