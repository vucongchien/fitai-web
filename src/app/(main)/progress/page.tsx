import { Suspense } from "react";

import { getProgressDashboardData } from "@/features/progress/server/get-progress-dashboard-data";
import { ProgressDashboardSkeleton } from "@/features/progress/ui/progress-dashboard-skeleton";
import { ProgressDashboardView } from "@/features/progress/ui/progress-dashboard-view";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Progress | FITAI" };

async function ProgressSection() {
  const data = await getProgressDashboardData();
  return <ProgressDashboardView data={data} />;
}

export default function ProgressPage() {
  return (
    <PageTransition className="w-full">
      <Suspense fallback={<ProgressDashboardSkeleton />}>
        <ProgressSection />
      </Suspense>
    </PageTransition>
  );
}
