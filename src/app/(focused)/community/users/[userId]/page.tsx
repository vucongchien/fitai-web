import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getUserGamificationOverview } from "@/features/gamification/server/get-gamification";
import { getPublicProfile } from "@/features/social/server/get-public-profile";
import { ProfileTabbedSkeleton } from "@/features/social/ui/profile-tabbed-skeleton";
import { PublicProfileView } from "@/features/social/ui/public-profile-view";
import { getAuthenticatedUserId } from "@/shared/auth/session";
import { BackButton } from "@/shared/ui/back-button";
import { BrandMark } from "@/shared/ui/brand-mark";
import { HeaderActions } from "@/shared/ui/header-actions";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Profile — FITAI" };

async function ProfileContent({ paramsPromise }: { paramsPromise: Promise<{ userId: string }> }) {
  const { userId } = await paramsPromise;

  const [profile, currentUserId] = await Promise.all([
    getPublicProfile(userId).catch(() => null),
    getAuthenticatedUserId(),
  ]);

  if (!profile) {
    notFound();
  }

  const isOwnProfile = Boolean(currentUserId) && currentUserId === userId;
  const gamification = await getUserGamificationOverview(userId, isOwnProfile);

  return (
    <PublicProfileView
      profile={profile}
      currentUserId={currentUserId}
      gamification={gamification}
    />
  );
}

const PROFILE_FALLBACK = <ProfileTabbedSkeleton />;

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  return (
    <PageTransition className="min-h-screen bg-white sm:bg-canvas">
      <header className="focused-header">
        <BackButton
          ariaLabel="Back to community"
          className="focused-header__back"
          fallbackHref="/community"
        />
        <BrandMark />
        <HeaderActions />
      </header>

      <div className="w-full mx-auto px-0 pt-0 pb-6 sm:px-4 sm:pt-4 sm:pb-12">
        <Suspense fallback={PROFILE_FALLBACK}>
          <ProfileContent paramsPromise={params} />
        </Suspense>
      </div>
    </PageTransition>
  );
}
