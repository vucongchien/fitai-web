import { Suspense } from "react";

import { getSoloMatchSessionData } from "@/features/solo-match/server/get-challenge-page-data";
import { DuelArenaView } from "@/features/solo-match/ui/duel-arena-view";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "1v1 Live Arena — Solo Challenge | FITAI" };

async function DuelArenaContent({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const data = await getSoloMatchSessionData(matchId);

  return (
    <DuelArenaView
      currentUserId={data.currentUserId}
      match={data.match}
      onnxSkeletonUrl={data.onnxSkeletonUrl}
      planId={data.planId}
      recommendedCameraAngle={data.recommendedCameraAngle}
    />
  );
}

function DuelArenaSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading 1v1 Live Arena"
      className="min-h-screen bg-white px-4 pt-4 pb-12 sm:px-7"
    >
      <div className="mx-auto max-w-[960px] space-y-5">
        <div className="h-12 w-1/3 rounded-[12px] bg-neutral-50" />
        <div className="h-44 w-full rounded-[20px] border border-neutral-200 bg-neutral-50" />
        <div className="h-96 w-full rounded-[20px] border border-neutral-200 bg-neutral-50" />
      </div>
    </div>
  );
}

const ARENA_FALLBACK = <DuelArenaSkeleton />;

export default function DuelArenaPage({ params }: { params: Promise<{ matchId: string }> }) {
  return (
    <PageTransition className="w-full">
      <Suspense fallback={ARENA_FALLBACK}>
        <DuelArenaContent params={params} />
      </Suspense>
    </PageTransition>
  );
}
