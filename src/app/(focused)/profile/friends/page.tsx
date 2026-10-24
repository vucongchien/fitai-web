import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getUserGamificationOverview } from "@/features/gamification/server/get-gamification";
import { ProfileFriendsView } from "@/features/gamification/ui/profile-friends-view";
import { getAuthenticatedUserId } from "@/shared/auth/session";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Friends | FITAI" };

async function FriendsContent() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }

  const gamification = await getUserGamificationOverview(userId, true);

  return (
    <ProfileFriendsView
      followers={gamification.followers}
      following={gamification.following}
      followerCount={gamification.followerCount}
      followingCount={gamification.followingCount}
    />
  );
}

function FriendsSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="focused-header">
        <div className="focused-header__back" />
        <div className="h-6 w-24 bg-neutral-200 animate-pulse rounded-md justify-self-center" />
        <div className="h-8 w-8 bg-neutral-200 animate-pulse rounded-full justify-self-end" />
      </header>
      <main className="max-w-[560px] mx-auto px-4 pt-4 space-y-4">
        <div className="h-11 rounded-xl bg-neutral-200 animate-pulse" />
        <div className="h-96 rounded-2xl bg-neutral-100 animate-pulse" />
      </main>
    </div>
  );
}

export default function ProfileFriendsPage() {
  return (
    <PageTransition>
      <Suspense fallback={<FriendsSkeleton />}>
        <FriendsContent />
      </Suspense>
    </PageTransition>
  );
}
