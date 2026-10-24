"use client";

import { Bell, MoreHorizontal, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { ProfileGamificationOverviewVM } from "@/features/gamification/model/gamification.types";
import { ProfileAchievementsCard } from "@/features/gamification/ui/profile-achievements-card";
import { ProfileFriendsCard } from "@/features/gamification/ui/profile-friends-card";
import { ProfileStatsGrid } from "@/features/gamification/ui/profile-stats-grid";
import { TabButton } from "@/shared/ui/tab-button";

import type { PublicProfileVM } from "../model/social.types";
import { FeedList } from "./feed-list";
import { FollowButton } from "./follow-button";
import { SocialContainer } from "./social-container";

type Props = {
  profile: PublicProfileVM;
  currentUserId?: string;
  gamification?: ProfileGamificationOverviewVM;
};

function formatFollowers(count: number): string {
  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(1).replace(".", ",") + "M";
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1).replace(".", ",") + "K";
  }
  return count.toString();
}

function InstagramIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

type TabKey = "overview" | "threads" | "replies" | "media";

export function PublicProfileView({
  profile,
  currentUserId,
  gamification,
}: Props) {
  const { summary } = profile;
  const isOwnProfile = profile.userId === currentUserId;
  const [followerCount, setFollowerCount] = useState(summary.followerCount);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const avatarSrc =
    profile.authorAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.authorName)}&background=random`;

  const handle = profile.authorName.toLowerCase().replace(/[^a-z0-9]/g, "");

  const profileHeader = (
    <div className="bg-white">
      <div className="px-5 sm:px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-[28px] font-bold text-neutral-900 tracking-tight leading-tight">
              {profile.authorName}
            </h1>
            <p className="text-[14px] text-neutral-500 font-normal mt-0.5">@{handle}</p>
          </div>

          <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-200/90 bg-neutral-100">
            <Image
              src={avatarSrc}
              alt={profile.authorName}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized={avatarSrc.includes("ui-avatars.com")}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-neutral-500">
          <span className="text-[14px] text-neutral-400 font-normal">
            {formatFollowers(followerCount)} {followerCount === 1 ? "follower" : "followers"}
          </span>

          <div className="flex items-center gap-3">
            {isOwnProfile ? (
              <Link
                href="/profile/settings"
                aria-label="Account Settings"
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100 active:scale-90 transition-all cursor-pointer"
              >
                <Settings size={20} />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Instagram profile"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100 hover:text-neutral-700 active:scale-90 transition-all cursor-pointer"
                >
                  <InstagramIcon size={19} />
                </button>
                <button
                  type="button"
                  aria-label="Notifications"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100 hover:text-neutral-700 active:scale-90 transition-all cursor-pointer"
                >
                  <Bell size={19} />
                </button>
                <button
                  type="button"
                  aria-label="More options"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100 hover:text-neutral-700 active:scale-90 transition-all cursor-pointer"
                >
                  <MoreHorizontal size={19} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {!isOwnProfile ? (
            <>
              <FollowButton
                targetUserId={profile.userId}
                initialIsFollowing={summary.isFollowing}
                className="flex-1"
                onFollowChange={(next) =>
                  setFollowerCount((c) => (next ? c + 1 : Math.max(0, c - 1)))
                }
              />
              <button
                type="button"
                className="flex-1 h-9 rounded-xl !border !border-solid !border-neutral-300 bg-transparent text-sm font-semibold text-neutral-900 hover:bg-neutral-50 active:scale-98 transition-all shadow-none cursor-pointer flex items-center justify-center"
              >
                Message
              </button>
            </>
          ) : (
            <>
              <Link
                href="/profile/settings"
                className="flex-1 h-9 rounded-xl !border !border-solid !border-neutral-300 bg-transparent text-sm font-semibold text-neutral-900 hover:bg-neutral-50 active:scale-98 transition-all shadow-none cursor-pointer flex items-center justify-center"
              >
                Edit Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({
                      title: profile.authorName,
                      url: window.location.href,
                    }).catch(() => {});
                  }
                }}
                className="flex-1 h-9 rounded-xl !border !border-solid !border-neutral-300 bg-transparent text-sm font-semibold text-neutral-900 hover:bg-neutral-50 active:scale-98 transition-all shadow-none cursor-pointer flex items-center justify-center"
              >
                Share Profile
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile Tab Navigation Bar */}
      <div className="flex border-b border-neutral-200 bg-white" role="tablist">
        {(
          [
            { key: "overview", label: "Overview" },
            { key: "threads", label: "Posts" },
            { key: "replies", label: "Replies" },
            { key: "media", label: "Media" },
          ] as const
        ).map((tab) => (
          <TabButton
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {activeTab === "overview" ? (
        <SocialContainer hasDividers={false}>
          {profileHeader}
          <div className="space-y-5 pt-4 pb-6 px-5 sm:px-6 bg-white">
            {gamification && <ProfileStatsGrid stats={gamification.stats} />}
            {gamification && (
              <ProfileFriendsCard
                followers={gamification.followers}
                following={gamification.following}
                followerCount={gamification.followerCount}
                followingCount={gamification.followingCount}
              />
            )}
            {gamification && (
              <ProfileAchievementsCard
                badges={gamification.badges}
                totalUnlocked={gamification.totalUnlockedBadges}
                totalAvailable={gamification.totalAvailableBadges}
              />
            )}
          </div>
        </SocialContainer>
      ) : (
        <FeedList
          initialItems={activeTab === "threads" ? profile.feedItems : []}
          initialNextCursor={activeTab === "threads" ? profile.feedNextCursor : ""}
          currentUserId={currentUserId}
          profileUserId={profile.userId}
          header={profileHeader}
        />
      )}
    </div>
  );
}
