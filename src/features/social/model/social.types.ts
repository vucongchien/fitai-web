// ViewModel types cho module Social
// UI chỉ dùng các types này, không đụng thẳng vào proto types.

export type ReactionType = "LIKE" | "FIRE" | "MUSCLE" | "CLAP" | "";

export interface WorkoutMetricsVM {
  sessionId: string;
  workoutTitle: string;
  durationSeconds: number;
  totalVolumeKg: number;
  exerciseCount: number;
  totalSets: number;
}

export interface FeedItemVM {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string;
  itemType: "POST" | "WORKOUT_ACTIVITY";
  caption: string;
  reactionCount: number;
  commentCount: number;
  /** Reaction của user đang xem. "" = chưa react. */
  userReaction: ReactionType;
  /** ISO string */
  createdAt: string;
  workoutData?: WorkoutMetricsVM;
}

export interface CommentVM {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string;
  feedItemId: string;
  parentId?: string;
  content: string;
  /** ISO string */
  createdAt: string;
}

export interface SocialSummaryVM {
  userId: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  /** Người dùng hiện tại có đang follow userId này không */
  isFollowing: boolean;
}

export interface ActivityFeedVM {
  items: FeedItemVM[];
  /** Cursor rỗng = hết trang */
  nextCursor: string;
}

export interface PublicProfileVM {
  userId: string;
  authorName: string;
  authorAvatarUrl: string;
  summary: SocialSummaryVM;
  feedItems: FeedItemVM[];
  feedNextCursor: string;
}
