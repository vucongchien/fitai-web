"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import type { ActivityFeedVM } from "../model/social.types";
import { fetchMoreFeedAction } from "../server/social-actions";
import { FeedList } from "./feed-list";

interface Props {
  data: ActivityFeedVM;
  currentUserId?: string;
}

type FeedTab = "all" | "following";

export function CommunityView({ data, currentUserId }: Props) {
  const [activeTab, setActiveTab] = useState<FeedTab>("all");
  const [followingFeed, setFollowingFeed] = useState<ActivityFeedVM | null>(null);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  const handleTabChange = async (tab: FeedTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);

    if (tab === "following" && followingFeed === null) {
      setLoadingFollowing(true);
      try {
        const res = await fetchMoreFeedAction("", "following");
        setFollowingFeed(res);
      } finally {
        setLoadingFollowing(false);
      }
    }
  };

  const tabBar = (
    <div
      role="tablist"
      aria-label="Community feed filter"
      className="grid grid-cols-2 border-b border-neutral-100 bg-white"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "all"}
        onClick={() => handleTabChange("all")}
        className={[
          "relative py-3 text-sm font-semibold transition-colors cursor-pointer",
          activeTab === "all" ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-600",
        ].join(" ")}
      >
        For You
        {activeTab === "all" && (
          <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-neutral-900" />
        )}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "following"}
        onClick={() => handleTabChange("following")}
        className={[
          "relative py-3 text-sm font-semibold transition-colors cursor-pointer",
          activeTab === "following"
            ? "text-neutral-900"
            : "text-neutral-400 hover:text-neutral-600",
        ].join(" ")}
      >
        Following
        {activeTab === "following" && (
          <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-neutral-900" />
        )}
      </button>
    </div>
  );

  if (activeTab === "following") {
    if (loadingFollowing || followingFeed === null) {
      return (
        <div className="w-full bg-white">
          {tabBar}
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full bg-white">
        {tabBar}
        <FeedList
          key="following"
          initialItems={followingFeed.items}
          initialNextCursor={followingFeed.nextCursor}
          currentUserId={currentUserId}
          feedMode="following"
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      {tabBar}
      <FeedList
        key="all"
        initialItems={data.items}
        initialNextCursor={data.nextCursor}
        currentUserId={currentUserId}
        feedMode="all"
      />
    </div>
  );
}
