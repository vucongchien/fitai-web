import { Suspense } from "react";

import { getChallengePageData } from "@/features/solo-match/server/get-challenge-page-data";
import { ChallengeLobbyView } from "@/features/solo-match/ui/challenge-lobby-view";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Solo Challenge — 1v1 Live Arena | FITAI" };

async function ChallengeLobbyContent() {
  const data = await getChallengePageData();
  return <ChallengeLobbyView data={data} />;
}

function ChallengeLobbySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading Solo Challenge" className="min-h-screen bg-white">
      <header className="page-heading px-5 sm:px-6 pt-6 pb-2">
        <div className="space-y-2 w-full">
          <div className="h-7 w-44 rounded-lg bg-neutral-100 animate-pulse" />
          <div className="h-4 w-72 rounded-md bg-neutral-100 animate-pulse" />
        </div>
      </header>
      <div className="px-5 sm:px-6 pt-4 pb-12 space-y-5">
        <div className="h-28 w-full rounded-2xl bg-neutral-50 animate-pulse" />
        <div className="h-14 w-full rounded-xl bg-neutral-100 animate-pulse" />
        <div className="h-36 w-full rounded-2xl bg-neutral-50 animate-pulse" />
      </div>
    </div>
  );
}

const CHALLENGE_FALLBACK = <ChallengeLobbySkeleton />;

export default function ChallengePage() {
  return (
    <PageTransition className="w-full">
      <Suspense fallback={CHALLENGE_FALLBACK}>
        <ChallengeLobbyContent />
      </Suspense>
    </PageTransition>
  );
}
