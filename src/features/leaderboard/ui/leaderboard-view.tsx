"use client";

import { Award, Globe, Trophy, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { cn } from "@/shared/lib/cn";

import type { LeaderboardDataVM, LeaderboardFilterTab } from "../model/leaderboard.types";
import { LeaderboardList } from "./leaderboard-list";
import { LeaderboardMyStanding } from "./leaderboard-my-standing";
import { LeaderboardPodium } from "./leaderboard-podium";

interface LeaderboardViewProps {
  initialData: LeaderboardDataVM;
}

export function LeaderboardView({ initialData }: LeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardFilterTab>("global");
  const [isCurrentUserVisible, setIsCurrentUserVisible] = useState(false);

  const hasAthletes = initialData.topEntries.length > 0;
  const isWeekly = activeTab === "weekly";

  // Ref callback to observe whether user's own ranking is in viewport without useEffect
  // RootMargin of -120px at bottom prevents boundary flicker against the floating bar
  const currentUserRef = useCallback((node: HTMLElement | null) => {
    if (!node || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsCurrentUserVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCurrentUserVisible(Boolean(entry?.isIntersecting));
      },
      {
        rootMargin: "0px 0px -120px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-canvas/40 sm:bg-white pb-16">
      {/* Header Bar */}
      <header className="px-5 sm:px-6 pt-5 pb-3 bg-white border-b border-neutral-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] sm:text-[20px] font-black text-neutral-900 tracking-tight font-display">
              LEADERBOARD
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
              <Trophy className="size-3 text-amber-500" />
              XP ARENA
            </span>
          </div>
          <p className="text-[12px] sm:text-[13px] text-neutral-500 mt-0.5">
            Top athletes ranked by total effort & discipline
          </p>
        </div>

        {hasAthletes && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100 text-neutral-600 text-[12px] font-semibold">
            <Users className="size-3.5 text-neutral-400" />
            <span className="font-data">
              {initialData.totalParticipants.toLocaleString()} Athletes
            </span>
          </div>
        )}
      </header>

      {/* Tab Controls (Triple Lane Pill Switcher) */}
      <div className="px-5 sm:px-6 pt-4 pb-2 bg-white">
        <div
          role="tablist"
          aria-label="Leaderboard scope tabs"
          className="inline-flex p-1 rounded-xl bg-neutral-100/90 border border-neutral-200/80 w-full max-w-[340px]"
        >
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === "global"}
            onClick={() => setActiveTab("global")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[13px] font-bold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-action",
              activeTab === "global"
                ? "bg-white text-action shadow-2xs font-black"
                : "text-neutral-500 hover:text-neutral-900",
            )}
          >
            <Globe className="size-3.5" />
            <span>All-time</span>
          </button>

          <button
            role="tab"
            type="button"
            aria-selected={activeTab === "weekly"}
            onClick={() => setActiveTab("weekly")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[13px] font-bold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-action",
              activeTab === "weekly"
                ? "bg-white text-action shadow-2xs font-black"
                : "text-neutral-500 hover:text-neutral-900",
            )}
          >
            <Zap className="size-3.5" />
            <span>Weekly League</span>
          </button>
        </div>

        {/* Stable Meta Banner (Zero Layout Shift on Tab Switch) */}
        <div
          className={cn(
            "mt-3 p-3 rounded-2xl border transition-colors min-h-[72px] flex flex-col justify-center",
            isWeekly
              ? "bg-amber-500/10 border-amber-500/20 text-neutral-800"
              : "bg-action-soft/40 border-action/20 text-neutral-800",
          )}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span
              className={cn(
                "flex items-center gap-1.5 font-display tracking-tight",
                isWeekly ? "text-amber-800" : "text-action",
              )}
            >
              {isWeekly ? (
                <>
                  <Trophy className="size-3.5 text-amber-600" />
                  GOLD LEAGUE • DIVISION 1
                </>
              ) : (
                <>
                  <Globe className="size-3.5 text-action" />
                  GLOBAL HALL OF FAME • ALL-TIME
                </>
              )}
            </span>
            <span className="text-[11px] font-medium text-neutral-500 font-data">
              {isWeekly ? "Resets Sun 23:59 UTC" : "Updated live"}
            </span>
          </div>
          <p className="text-[12px] text-neutral-600 leading-snug">
            {isWeekly
              ? "Top 10 athletes advance to Diamond League at the end of the weekly cycle."
              : "Lifetime XP accumulated across all workouts, challenges, and disciplines."}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {!hasAthletes ? (
        <div className="px-5 sm:px-6 py-12 flex flex-col items-center justify-center text-center">
          <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
            <Award className="size-8" />
          </div>
          <h2 className="text-[17px] font-bold text-neutral-900 font-display">
            Be the First on the Board!
          </h2>
          <p className="text-[13px] text-neutral-500 max-w-[300px] mt-1 mb-6">
            Complete workouts, maintain your daily streak, and log nutrition to earn XP.
          </p>
          <Link
            href="/roadmap"
            className="px-5 py-2.5 rounded-xl bg-action text-white font-bold text-[14px] shadow-sm hover:bg-action/90 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-action"
          >
            Start Workout
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 Podium */}
          {initialData.podium.length > 0 && (
            <div className="bg-white border-b border-neutral-100">
              <LeaderboardPodium podium={initialData.podium} currentUserRef={currentUserRef} />
            </div>
          )}

          {/* Ranks 4 to 50 List */}
          <div className="pt-2">
            <div className="px-5 sm:px-6 mb-2 flex items-center justify-between">
              <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">
                Rankings
              </span>
              <span className="text-[11px] font-semibold text-neutral-400 font-data">
                Top {initialData.topEntries.length}
              </span>
            </div>

            <LeaderboardList
              entries={initialData.rankedList}
              isWeekly={isWeekly}
              currentUserRef={currentUserRef}
            />
          </div>

          {/* Sticky Floating My Standing Card (Hidden when user entry is visible in viewport) */}
          <LeaderboardMyStanding
            standing={initialData.myStanding}
            hidden={isCurrentUserVisible}
            isWeekly={isWeekly}
          />
        </div>
      )}
    </div>
  );
}
