export interface HomeGamificationVM {
  streakDays: number;
  isActiveToday: boolean;
  coins: number;
}

export interface ProfileStatsVM {
  streakDays: number;
  totalXp: number;
  completedWorkouts: number;
  leaderboardRank: number | null;
}

export interface BadgeItemVM {
  badgeCode: string;
  name: string;
  description: string;
  category: string;
  iconUrl: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progressCurrent: number;
  progressTarget: number;
}

export interface UserFriendVM {
  userId: string;
  fullName: string;
  avatarUrl: string;
  isFollowing: boolean;
  level: number;
  xp?: number;
}

export interface ProfileGamificationOverviewVM {
  stats: ProfileStatsVM;
  badges: BadgeItemVM[];
  totalUnlockedBadges: number;
  totalAvailableBadges: number;
  followers: UserFriendVM[];
  following: UserFriendVM[];
  followerCount: number;
  followingCount: number;
}
