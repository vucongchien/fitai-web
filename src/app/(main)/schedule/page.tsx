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

const SCHEDULE_FALLBACK = <LaneSkeleton />;

export default function SchedulePage() {
  return (
    <PageTransition className="w-full">
      {/* Static shell: the heading paints before the schedule resolves. */}
      <header className="page-heading px-5 sm:px-6 pt-6 pb-2">
        <div>
          <h1>Four-week schedule</h1>
          <p>Every session on the route, from week one to week four.</p>
        </div>
      </header>

      <div className="px-5 sm:px-6 pb-8 bg-white">
        <Suspense fallback={SCHEDULE_FALLBACK}>
          <ScheduleContent />
        </Suspense>
      </div>
    </PageTransition>
  );
}
