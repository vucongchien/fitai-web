import type { Metadata } from "next";
import { Suspense } from "react";

import { getLeaderboardData } from "@/features/leaderboard/server/get-leaderboard";
import { LeaderboardSkeleton } from "@/features/leaderboard/ui/leaderboard-skeleton";
import { LeaderboardView } from "@/features/leaderboard/ui/leaderboard-view";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata: Metadata = {
  title: "Leaderboard — Global XP Ranking | FITAI",
  description: "View top global athletes and track your ranking across the FITAI community.",
};

async function LeaderboardContent() {
  const data = await getLeaderboardData(50);
  return <LeaderboardView initialData={data} />;
}

export default function LeaderboardPage() {
  return (
    <PageTransition className="w-full">
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardContent />
      </Suspense>
    </PageTransition>
  );
}
