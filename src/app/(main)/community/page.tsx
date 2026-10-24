import { Suspense } from "react";

import { getActivityFeed } from "@/features/social/server/get-activity-feed";
import { CommunityView } from "@/features/social/ui/community-view";
import { FeedSkeleton } from "@/features/social/ui/feed-skeleton";
import { getAuthenticatedUserId } from "@/shared/auth/session";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Community — FITAI" };

async function CommunityContent() {
  const [data, currentUserId] = await Promise.all([getActivityFeed(), getAuthenticatedUserId()]);
  return <CommunityView data={data} currentUserId={currentUserId} />;
}

const FEED_FALLBACK = <FeedSkeleton />;

export default function CommunityPage() {
  return (
    <PageTransition className="min-h-screen bg-white sm:bg-canvas px-0 sm:px-4 pt-2 sm:pt-4 pb-6">
      <div className="max-w-[640px] w-full mx-auto mb-3 flex items-center justify-between px-4 sm:px-2">
        <h1 className="text-[17px] font-bold text-neutral-900 tracking-tight">For you</h1>
      </div>

      <Suspense fallback={FEED_FALLBACK}>
        <CommunityContent />
      </Suspense>
    </PageTransition>
  );
}
