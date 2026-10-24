import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getUserGamificationOverview } from "@/features/gamification/server/get-gamification";
import { ProfileFriendsView } from "@/features/gamification/ui/profile-friends-view";
import { getAuthenticatedUserId } from "@/shared/auth/session";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Bạn bè | FITAI" };

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
      <header className="h-14 border-b border-neutral-200/90 bg-white px-5 sm:px-6 flex items-center justify-between">
        <div className="w-16" />
        <div className="h-5 w-24 bg-neutral-200 animate-pulse rounded-md" />
        <div className="h-5 w-16 bg-neutral-200 animate-pulse rounded-md" />
      </header>
      <main className="max-w-[560px] mx-auto px-4 pt-5 space-y-4">
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
