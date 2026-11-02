import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getUserGamificationOverview } from "@/features/gamification/server/get-gamification";
import { getPublicProfile } from "@/features/social/server/get-public-profile";
import { ProfileTabbedSkeleton } from "@/features/social/ui/profile-tabbed-skeleton";
import { PublicProfileView } from "@/features/social/ui/public-profile-view";
import { getAuthenticatedUserId } from "@/shared/auth/session";
import { BackButton } from "@/shared/ui/back-button";
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
    <PageTransition className="min-h-screen bg-white sm:bg-canvas px-0 sm:px-4 pt-0 sm:pt-4 pb-8">
      <div className="w-full max-w-[640px] mx-auto bg-white overflow-hidden shadow-none rounded-none border-0 sm:rounded-[24px] sm:border sm:border-neutral-300">
        <header className="focused-header border-b border-neutral-200/80">
          <BackButton
            ariaLabel="Back to community"
            className="focused-header__back"
            fallbackHref="/community"
          />
          <span className="font-bold text-sm text-neutral-800">Athlete Profile</span>
          <span className="focused-header__spacer" />
          <div className="md:hidden">
            <HeaderActions />
          </div>
        </header>

        <Suspense fallback={PROFILE_FALLBACK}>
          <ProfileContent paramsPromise={params} />
        </Suspense>
      </div>
    </PageTransition>
  );
}
