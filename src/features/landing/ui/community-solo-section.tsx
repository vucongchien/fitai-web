"use client";

import type { FeedItemVM } from "@/features/social/model/social.types";
import { FeedCard } from "@/features/social/ui/feed-card";
import { DuelVersusHud } from "@/features/solo-match/ui/duel-versus-hud";

const MOCK_FEED_ITEM: FeedItemVM = {
  id: "demo-post-1",
  userId: "demo-user-linh",
  authorName: "Linh T.",
  authorAvatarUrl: "",
  itemType: "WORKOUT_ACTIVITY",
  caption: "Hit all 4 slots this week with 96% form accuracy.",
  reactionCount: 24,
  commentCount: 6,
  userReaction: "",
  createdAt: "2026-11-14T13:00:00.000Z",
  workoutData: {
    sessionId: "demo-session-1",
    workoutTitle: "Lower & Squat Mechanics · Clean Form",
    durationSeconds: 2100,
    totalVolumeKg: 4250,
    exerciseCount: 4,
    totalSets: 12,
  },
};

export function CommunitySoloSection() {
  return (
    <section
      aria-labelledby="community-solo-heading"
      className="fl-section fl-section--surface"
      id="community-solo"
    >
      <div className="fl-container fl-stack-lg">
        <div className="fl-section-head">
          <span className="fl-kicker">COMMUNITY & SOLO</span>
          <h2 className="fl-h2" id="community-solo-heading">
            Train solo. Compete together.
          </h2>
        </div>

        <div className="fl-dual-grid">
          <div className="fl-feature-card">
            <span className="fl-kicker">SOLO MATCH · LIVE 1V1</span>
            <DuelVersusHud
              challengeType="REPS"
              connectionPhase="LIVE"
              myDisplayName="You"
              myStatus="ACTIVE"
              myValue={18}
              myXp={1280}
              opponentDisplayName="Minh K."
              opponentStatus="ACTIVE"
              opponentValue={15}
              opponentXp={1190}
            />
          </div>

          <div className="fl-feature-card">
            <span className="fl-kicker">COMMUNITY FEED</span>
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
              <FeedCard item={MOCK_FEED_ITEM} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
