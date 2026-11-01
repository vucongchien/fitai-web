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
    <PageTransition className="w-full">
      <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-neutral-100 flex items-center justify-between bg-white">
        <h1 className="text-[17px] font-bold text-neutral-900 tracking-tight">For you</h1>
      </div>

      <Suspense fallback={FEED_FALLBACK}>
        <CommunityContent />
      </Suspense>
    </PageTransition>
  );
}
