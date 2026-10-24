import { Suspense } from "react";

import { getProfileData } from "@/features/profile/server/get-profile-data";
import { getFeedItemById } from "@/features/social/server/get-feed-item";
import { listCommentsAction } from "@/features/social/server/social-actions";
import { ThreadDetailShell } from "@/features/social/ui/thread-detail-shell";
import { ThreadPageSkeleton } from "@/features/social/ui/thread-skeleton";
import { getAuthenticatedSession } from "@/shared/auth/session";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Thread — FITAI" };

interface PageProps {
  params: Promise<{ postId: string }>;
}

async function ThreadContent({ paramsPromise }: { paramsPromise: Promise<{ postId: string }> }) {
  const { postId } = await paramsPromise;
  const session = await getAuthenticatedSession();

  const [serverPost, profileData] = await Promise.all([
    getFeedItemById(postId).catch(() => null),
    session.accessToken ? getProfileData().catch(() => null) : Promise.resolve(null),
  ]);

  const commentsPromise = listCommentsAction(postId);

  return (
    <ThreadDetailShell
      postId={postId}
      serverPost={serverPost}
      commentsPromise={commentsPromise}
      currentUserId={session.userId}
      currentUserAvatar={profileData?.user?.avatarUrl}
      currentUserName={profileData?.user?.name || session.userName}
    />
  );
}

export default function ThreadPage({ params }: PageProps) {
  return (
    <PageTransition className="min-h-screen bg-white sm:bg-neutral-50/50 px-0 sm:px-4 pt-3 pb-24">
      <Suspense fallback={<ThreadPageSkeleton />}>
        <ThreadContent paramsPromise={params} />
      </Suspense>
    </PageTransition>
  );
}
