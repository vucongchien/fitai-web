import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getUserGamificationOverview } from "@/features/gamification/server/get-gamification";
import { ProfileBadgesView } from "@/features/gamification/ui/profile-badges-view";
import { getAuthenticatedUserId } from "@/shared/auth/session";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Achievements | FITAI" };

async function BadgesContent() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }

  const gamification = await getUserGamificationOverview(userId, true);

  return (
    <ProfileBadgesView
      badges={gamification.badges}
      totalUnlocked={gamification.totalUnlockedBadges}
      totalAvailable={gamification.totalAvailableBadges}
    />
  );
}

function BadgesSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="focused-header">
        <div className="focused-header__back" />
        <div className="h-6 w-32 bg-neutral-200 animate-pulse rounded-md justify-self-center" />
        <span className="focused-header__spacer" />
      </header>
      <main className="max-w-[560px] mx-auto px-4 pt-4 space-y-4">
        <div className="h-7 w-40 bg-neutral-200 animate-pulse rounded-md px-1" />
        <div className="h-20 rounded-2xl bg-neutral-100 animate-pulse" />
        <div className="h-96 rounded-2xl bg-neutral-100 animate-pulse" />
      </main>
    </div>
  );
}

export default function ProfileBadgesPage() {
  return (
    <PageTransition>
      <Suspense fallback={<BadgesSkeleton />}>
        <BadgesContent />
      </Suspense>
    </PageTransition>
  );
}
