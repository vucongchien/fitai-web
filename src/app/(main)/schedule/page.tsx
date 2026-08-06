import { Suspense } from "react";

import { getSchedulePageData } from "@/features/roadmap/server/get-schedule-page-data";
import { ScheduleView } from "@/features/roadmap/ui/schedule-view";
import { LaneSkeleton } from "@/shared/ui/lane-skeleton";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Four-week schedule" };

async function ScheduleContent() {
  const data = await getSchedulePageData();
  return <ScheduleView data={data} />;
}

export default function SchedulePage() {
  return (
    <PageTransition className="page schedule-page">
      {/* Static shell: the heading paints before the schedule resolves. */}
      <header className="page-heading">
        <div>
          <h1>Four-week schedule</h1>
          <p>Every session on the route, from week one to week four.</p>
        </div>
      </header>

      <Suspense fallback={<LaneSkeleton />}>
        <ScheduleContent />
      </Suspense>
    </PageTransition>
  );
}
