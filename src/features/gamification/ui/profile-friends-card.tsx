"use client";

import { ChevronRight, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { TabButton } from "@/shared/ui/tab-button";

import type { UserFriendVM } from "../model/gamification.types";

interface ProfileFriendsCardProps {
  followers: UserFriendVM[];
  following: UserFriendVM[];
  followerCount: number;
  followingCount: number;
}

export function ProfileFriendsCard({
  followers,
  following,
  followerCount,
  followingCount,
}: ProfileFriendsCardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"following" | "followers">("following");

  const currentList = activeSubTab === "following" ? following : followers;
  const totalCount = activeSubTab === "following" ? followingCount : followerCount;
  const remainingCount = Math.max(0, totalCount - 3);

  return (
    <div className="w-full">
      {/* Title outside the card */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[20px] font-extrabold text-neutral-800">Friends</h2>
        <Link
          href="/community"
          className="text-[13px] font-bold text-sky-500 hover:text-sky-600 uppercase tracking-wide cursor-pointer transition-colors"
        >
          ADD FRIENDS
        </Link>
      </div>

      {/* Card container */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs overflow-hidden">
        {/* Two flat tabs with blue indicator */}
        <div className="flex border-b border-neutral-200" role="tablist">
          <TabButton
            active={activeSubTab === "following"}
            onClick={() => setActiveSubTab("following")}
            uppercase
          >
            FOLLOWING
          </TabButton>
          <TabButton
            active={activeSubTab === "followers"}
            onClick={() => setActiveSubTab("followers")}
            uppercase
          >
            FOLLOWERS
          </TabButton>
        </div>

        {/* Friend Items */}
        {currentList.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <Users className="mx-auto h-9 w-9 text-neutral-300 mb-2" />
            <p className="text-[14px] font-semibold text-neutral-600">
              {activeSubTab === "following" ? "Not following anyone yet" : "No followers yet"}
            </p>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              Connect and share your workout progress with the FITAI community.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {currentList.slice(0, 3).map((user) => {
              const avatarSrc =
                user.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`;

              return (
                <Link
                  key={user.userId}
                  href={`/community/users/${user.userId}`}
                  className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative h-12 w-12 min-w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-200/80 bg-neutral-100">
                      <Image
                        src={avatarSrc}
                        alt={user.fullName}
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized={avatarSrc.includes("ui-avatars.com")}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[15px] font-bold text-neutral-800 group-hover:text-neutral-900 truncate">
                        {user.fullName}
                      </div>
                      <div className="text-[13px] font-medium text-neutral-400 mt-0.5">
                        {user.xp ? `${user.xp.toLocaleString()} XP` : `Level ${user.level || 1}`}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 stroke-[2.5]" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Dedicated Page Link - Only show when there are remaining people to view */}
        {currentList.length > 0 && remainingCount > 0 && (
          <Link
            href="/profile/friends"
            className="flex items-center justify-between px-5 py-4 text-left font-bold text-neutral-800 hover:bg-neutral-50 transition-colors group cursor-pointer border-t border-neutral-100"
          >
            <span className="text-[15px] group-hover:text-neutral-900">
              View {remainingCount} more
            </span>
            <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 stroke-[2.5]" />
          </Link>
        )}
      </div>
    </div>
  );
}
