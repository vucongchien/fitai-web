// ViewModel classes cho module Social
// UI chỉ dùng các classes này, không đụng thẳng vào proto types.

export type ReactionType = "LIKE" | "FIRE" | "MUSCLE" | "CLAP" | "";

export class WorkoutMetricsVM {
  sessionId: string = "";
  workoutTitle: string = "";
  durationSeconds: number = 0;
  totalVolumeKg: number = 0;
  exerciseCount: number = 0;
  totalSets: number = 0;

  constructor(init?: Partial<WorkoutMetricsVM>) {
    Object.assign(this, init);
  }
}

export class FeedItemVM {
  id: string = "";
  userId: string = "";
  authorName: string = "";
  authorAvatarUrl: string = "";
  itemType: "POST" | "WORKOUT_ACTIVITY" = "POST";
  caption: string = "";
  reactionCount: number = 0;
  commentCount: number = 0;
  /** Reaction của user đang xem. "" = chưa react. */
  userReaction: ReactionType = "";
  /** ISO string */
  createdAt: string = "";
  workoutData?: WorkoutMetricsVM;

  constructor(init?: Partial<FeedItemVM>) {
    Object.assign(this, init);
  }
}

export class CommentVM {
  id: string = "";
  userId: string = "";
  authorName: string = "";
  authorAvatarUrl: string = "";
  feedItemId: string = "";
  parentId?: string;
  content: string = "";
  /** ISO string */
  createdAt: string = "";

  constructor(init?: Partial<CommentVM>) {
    Object.assign(this, init);
  }
}

export class SocialSummaryVM {
  userId: string = "";
  followerCount: number = 0;
  followingCount: number = 0;
  postCount: number = 0;
  /** Người dùng hiện tại có đang follow userId này không */
  isFollowing: boolean = false;
  fullName: string = "";
  avatarUrl: string = "";
  role: string = "user";

  constructor(init?: Partial<SocialSummaryVM>) {
    Object.assign(this, init);
  }
}

export class ActivityFeedVM {
  items: FeedItemVM[] = [];
  /** Cursor rỗng = hết trang */
  nextCursor: string = "";

  constructor(init?: Partial<ActivityFeedVM>) {
    Object.assign(this, init);
  }
}

export class PublicProfileVM {
  userId: string = "";
  authorName: string = "";
  authorAvatarUrl: string = "";
  bio?: string = "";
  summary: SocialSummaryVM = new SocialSummaryVM();
  feedItems: FeedItemVM[] = [];
  feedNextCursor: string = "";

  constructor(init?: Partial<PublicProfileVM>) {
    Object.assign(this, init);
  }
}
