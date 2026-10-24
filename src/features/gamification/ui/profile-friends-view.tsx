"use client";

import { ChevronRight, Search, UserPlus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PageHeader } from "@/shared/ui/page-header";
import { TabButton } from "@/shared/ui/tab-button";

import type { UserFriendVM } from "../model/gamification.types";

interface ProfileFriendsViewProps {
  followers: UserFriendVM[];
  following: UserFriendVM[];
  followerCount: number;
  followingCount: number;
}

export function ProfileFriendsView({
  followers,
  following,
}: ProfileFriendsViewProps) {
  const [activeTab, setActiveTab] = useState<"following" | "followers">("following");
  const [searchQuery, setSearchQuery] = useState("");

  const currentList = activeTab === "following" ? following : followers;

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentList;
    }
    const q = searchQuery.toLowerCase();
    return currentList.filter((u) => u.fullName.toLowerCase().includes(q));
  }, [currentList, searchQuery]);

  return (
    <div className="min-h-screen bg-white pb-20">
      <PageHeader
        title="Friends"
        fallbackHref="/profile"
        right={
          <Link
            href="/community"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all"
            aria-label="Add Friends"
            title="Add Friends"
          >
            <UserPlus size={19} />
          </Link>
        }
      />

      {/* Main Container */}
      <main className="max-w-[560px] mx-auto px-4 pt-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends by name..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-neutral-200 bg-white text-[14px] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
          />
        </div>

        {/* Tab Switcher & Friends Card */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-2xs overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-neutral-200" role="tablist">
            <TabButton
              active={activeTab === "following"}
              onClick={() => setActiveTab("following")}
              uppercase
            >
              FOLLOWING
            </TabButton>
            <TabButton
              active={activeTab === "followers"}
              onClick={() => setActiveTab("followers")}
              uppercase
            >
              FOLLOWERS
            </TabButton>
          </div>

          {/* List */}
          {filteredList.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-[15px] font-bold text-neutral-700">
                {searchQuery ? "No friends found" : "No one here yet"}
              </p>
              <p className="text-[13px] text-neutral-400 mt-1">
                Explore the FITAI community to connect with other athletes.
              </p>
              <Link
                href="/community"
                className="inline-flex mt-4 h-9 px-4 items-center justify-center rounded-xl bg-sky-500 text-white text-xs font-bold hover:bg-sky-600 transition-colors shadow-xs"
              >
                Explore Community
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filteredList.map((user) => {
                const avatarSrc =
                  user.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`;

                return (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <Link
                      href={`/community/users/${user.userId}`}
                      className="flex items-center gap-3.5 min-w-0 flex-1 group cursor-pointer"
                    >
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
                    </Link>

                    <Link
                      href={`/community/users/${user.userId}`}
                      className="shrink-0 pl-2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5 stroke-[2.5]" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
