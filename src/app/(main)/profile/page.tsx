import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getUserGamificationOverview } from "@/features/gamification/server/get-gamification";
import { getProfileData } from "@/features/profile/server/get-profile-data";
import type { PublicProfileVM } from "@/features/social/model/social.types";
import { getPublicProfile } from "@/features/social/server/get-public-profile";
import { ProfileTabbedSkeleton } from "@/features/social/ui/profile-tabbed-skeleton";
import { PublicProfileView } from "@/features/social/ui/public-profile-view";
import { getAuthenticatedUserId } from "@/shared/auth/session";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Profile | FITAI" };

async function ProfileSection() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }

  const [profileData, publicProfileRes, gamification] = await Promise.all([
    getProfileData(),
    getPublicProfile(userId).catch(() => null),
    getUserGamificationOverview(userId, true),
  ]);

  const profile: PublicProfileVM = publicProfileRes || {
    userId,
    authorName: profileData.user.name,
    authorAvatarUrl: profileData.user.avatarUrl,
    summary: {
      userId,
      followerCount: gamification.followerCount,
      followingCount: gamification.followingCount,
      postCount: 0,
      isFollowing: false,
      fullName: profileData.user.name,
      avatarUrl: profileData.user.avatarUrl,
      role: "ATHLETE",
    },
    feedItems: [],
    feedNextCursor: "",
  };

  return (
    <PublicProfileView
      profile={profile}
      currentUserId={userId}
      gamification={gamification}
    />
  );
}

export default function ProfilePage() {
  return (
    <PageTransition className="min-h-screen bg-white sm:bg-canvas px-0 sm:px-4 pt-0 sm:pt-4 pb-6">
      <div className="w-full mx-auto">
        <Suspense fallback={<ProfileTabbedSkeleton />}>
          <ProfileSection />
        </Suspense>
      </div>
    </PageTransition>
  );
}
