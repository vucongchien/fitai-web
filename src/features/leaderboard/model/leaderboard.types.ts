export type LeaderboardFilterTab = "global" | "weekly";

export interface LeaderboardEntryVM {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string;
  xp: number;
  level: number;
  isCurrentUser: boolean;
}

export interface LeaderboardDataVM {
  topEntries: LeaderboardEntryVM[];
  podium: LeaderboardEntryVM[];
  rankedList: LeaderboardEntryVM[];
  myStanding: LeaderboardEntryVM | null;
  totalParticipants: number;
}
