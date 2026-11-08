import { Suspense } from "react";

import { getSoloMatchSessionData } from "@/features/solo-match/server/get-challenge-page-data";
import { ChallengeResultView } from "@/features/solo-match/ui/challenge-result-view";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Match Result — Solo Challenge | FITAI" };

async function ChallengeResultContent({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const data = await getSoloMatchSessionData(matchId);
  return <ChallengeResultView currentUserId={data.currentUserId} match={data.match} />;
}

function ChallengeResultSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading match result"
      className="min-h-screen bg-white px-5 pt-6 pb-12 sm:px-7"
    >
      <div className="mx-auto max-w-[680px] space-y-6">
        <div className="h-12 w-1/3 rounded-[12px] bg-neutral-50" />
        <div className="h-80 w-full rounded-[20px] border border-neutral-200 bg-neutral-50" />
      </div>
    </div>
  );
}

const RESULT_FALLBACK = <ChallengeResultSkeleton />;

export default function ChallengeResultPage({ params }: { params: Promise<{ matchId: string }> }) {
  return (
    <PageTransition className="w-full">
      <Suspense fallback={RESULT_FALLBACK}>
        <ChallengeResultContent params={params} />
      </Suspense>
    </PageTransition>
  );
}
