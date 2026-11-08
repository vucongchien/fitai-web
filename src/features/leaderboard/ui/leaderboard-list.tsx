import { Award } from "lucide-react";

import type { LeaderboardEntryVM } from "../model/leaderboard.types";
import { LeaderboardRow } from "./leaderboard-row";

interface LeaderboardListProps {
  entries: LeaderboardEntryVM[];
  isWeekly?: boolean;
  currentUserRef?: (node: HTMLElement | null) => void;
}

export function LeaderboardList({
  entries,
  isWeekly = false,
  currentUserRef,
}: LeaderboardListProps) {
  if (!entries || entries.length === 0) {
    return (
      <div
        role="region"
        aria-label="No ranked athletes"
        className="flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-3">
          <Award className="size-7" />
        </div>
        <p className="text-[15px] font-bold text-neutral-800">No further rankings yet</p>
        <p className="text-[13px] text-neutral-500 max-w-[260px] mt-1">
          Complete workouts and earn XP to join the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Leaderboard rankings"
      className="space-y-2.5 px-4 sm:px-6 pb-36 pt-2"
    >
      {entries.map((entry) => (
        <LeaderboardRow
          key={`${entry.rank}-${entry.userId}`}
          entry={entry}
          isWeekly={isWeekly}
          currentUserRef={currentUserRef}
        />
      ))}
    </div>
  );
}
