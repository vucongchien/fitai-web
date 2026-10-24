// ViewModel types cho module Social
// Tách biệt tầng hiển thị (UI) và tầng mạng (Protobuf do buf gen)

export type ReactionType = "LIKE" | "FIRE" | "MUSCLE" | "CLAP" | "";

export type WorkoutMetricsVM = {
  sessionId: string;
  workoutTitle: string;
  durationSeconds: number;
  totalVolumeKg: number;
  exerciseCount: number;
  totalSets: number;
};

export type FeedItemVM = {
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
};

export type CommentVM = {
  id: string;
  userId: string;
  authorName: string;
  authorAvatarUrl: string;
  feedItemId: string;
  parentId?: string;
  content: string;
  /** ISO string */
  createdAt: string;
};

export type SocialSummaryVM = {
  userId: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  /** Người dùng hiện tại có đang follow userId này không */
  isFollowing: boolean;
  fullName: string;
  avatarUrl: string;
  role: string;
};

export type ActivityFeedVM = {
  items: FeedItemVM[];
  /** Cursor rỗng = hết trang */
  nextCursor: string;
};

export type PublicProfileVM = {
  userId: string;
  authorName: string;
  authorAvatarUrl: string;
  summary: SocialSummaryVM;
  feedItems: FeedItemVM[];
  feedNextCursor: string;
};
