import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getPublicProfile } from "@/features/social/server/get-public-profile";
import { PublicProfileView } from "@/features/social/ui/public-profile-view";
import { getAuthenticatedUserId } from "@/shared/auth/session";
import { BrandMark } from "@/shared/ui/brand-mark";
import { HeaderActions } from "@/shared/ui/header-actions";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Profile — FITAI" };

const NAV_BACK = ["nav-back"];

async function ProfileContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ userId: string }>;
}) {
  const { userId } = await paramsPromise;

  const [profile, currentUserId] = await Promise.all([
    getPublicProfile(userId).catch(() => null),
    getAuthenticatedUserId(),
  ]);

  if (!profile) {
    notFound();
  }

  return <PublicProfileView profile={profile} currentUserId={currentUserId} />;
}

function ProfileSkeletonFallback() {
  return (
    <div
      className="max-w-[640px] w-full mx-auto rounded-[24px] border border-neutral-300 bg-white overflow-hidden shadow-none divide-y divide-neutral-100"
      aria-busy="true"
      aria-label="Loading profile"
    >
      {/* 1. Header Skeleton */}
      <div className="px-5 sm:px-6 pt-6 pb-4 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-7 w-48 rounded-md bg-neutral-100 animate-pulse" />
            <div className="h-4 w-28 rounded-md bg-neutral-100 animate-pulse" />
            <div className="h-4 w-64 rounded-md bg-neutral-100 animate-pulse pt-2" />
          </div>
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-neutral-100 animate-pulse flex-shrink-0" />
        </div>

        {/* Stats & icons row */}
        <div className="mt-4 flex items-center justify-between">
          <div className="h-4 w-24 rounded-md bg-neutral-100 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-neutral-100 animate-pulse" />
            <div className="h-7 w-7 rounded-full bg-neutral-100 animate-pulse" />
            <div className="h-7 w-7 rounded-full bg-neutral-100 animate-pulse" />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex gap-3">
          <div className="h-9 flex-1 rounded-xl bg-neutral-100 animate-pulse" />
          <div className="h-9 flex-1 rounded-xl bg-neutral-100 animate-pulse" />
        </div>
      </div>

      {/* 2. Tabs Row */}
      <div className="flex border-b border-neutral-200 bg-white">
        {["Threads", "Replies", "Media", "Reposts"].map((t, idx) => (
          <div
            key={t}
            className={[
              "flex-1 py-3 text-center text-sm font-semibold",
              idx === 0 ? "text-neutral-900 border-b-2 border-neutral-900 -mb-[1px]" : "text-neutral-400",
            ].join(" ")}
          >
            {t}
          </div>
        ))}
      </div>

      {/* 3. Post Skeletons */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3.5 px-4 sm:px-6 py-4 bg-white">
          <div className="h-10 w-10 rounded-full bg-neutral-100 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-3 pt-0.5">
            <div className="h-3.5 w-32 rounded-full bg-neutral-100 animate-pulse" />
            <div className="h-3.5 w-full rounded-full bg-neutral-100 animate-pulse" />
            <div className="flex gap-4 pt-1">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="h-5 w-5 rounded-full bg-neutral-100 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const PROFILE_FALLBACK = <ProfileSkeletonFallback />;

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  return (
    <PageTransition className="min-h-screen bg-canvas">
      {/* Top Focused App Header */}
      <header className="focused-header">
        <Link
          aria-label="Back to community"
          className="focused-header__back"
          href="/community"
          transitionTypes={NAV_BACK}
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <BrandMark />
        <HeaderActions />
      </header>

      {/* Profile Content Container */}
      <div className="max-w-[640px] w-full mx-auto px-3 sm:px-4 pt-4 pb-28">
        <Suspense fallback={PROFILE_FALLBACK}>
          <ProfileContent paramsPromise={params} />
        </Suspense>
      </div>
    </PageTransition>
  );
}
