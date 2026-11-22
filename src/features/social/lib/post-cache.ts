import type { CommentVM, FeedItemVM } from "../model/social.types";

export interface CachedSocialUser {
  userId?: string;
  name?: string;
  avatarUrl?: string;
}

export interface CommentsPageData {
  comments: CommentVM[];
  nextCursor: string;
}

export const socialQueryKeys = {
  threadBootstrap: (postId: string) => ["social", "thread-bootstrap", postId] as const,
  comments: (postId: string) => ["social", "comments", postId] as const,
};

const MAX_CACHE_SIZE = 100;
const COMMENTS_TTL_MS = 30_000;
const memoryCache = new Map<string, FeedItemVM>();
const commentsCache = new Map<string, { data: CommentsPageData; fetchedAt: number }>();
const inFlightComments = new Map<string, Promise<CommentsPageData>>();
let cachedCurrentUser: CachedSocialUser | null = null;

export function getCachedComments(postId: string): CommentsPageData | null {
  const entry = commentsCache.get(postId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > COMMENTS_TTL_MS) {
    commentsCache.delete(postId);
    return null;
  }
  return entry.data;
}

export function setCachedComments(postId: string, data: CommentsPageData): void {
  if (!postId) return;
  if (commentsCache.size >= MAX_CACHE_SIZE && !commentsCache.has(postId)) {
    const oldestKey = commentsCache.keys().next().value;
    if (oldestKey) {
      commentsCache.delete(oldestKey);
    }
  }
  commentsCache.set(postId, { data, fetchedAt: Date.now() });
}

export function invalidateCachedThread(postId: string): void {
  if (!postId) return;
  commentsCache.delete(postId);
  memoryCache.delete(postId);
}

export function preloadThreadComments(
  postId: string,
  fetcher: () => Promise<CommentsPageData>,
): Promise<CommentsPageData> {
  const cached = getCachedComments(postId);
  if (cached) {
    return Promise.resolve(cached);
  }
  const existing = inFlightComments.get(postId);
  if (existing) {
    return existing;
  }
  const promise = fetcher()
    .then((data) => {
      setCachedComments(postId, data);
      return data;
    })
    .finally(() => {
      inFlightComments.delete(postId);
    });
  inFlightComments.set(postId, promise);
  return promise;
}

export function cacheCurrentSocialUser(user: CachedSocialUser): void {
  if (!user.userId && !user.name && !user.avatarUrl) return;
  cachedCurrentUser = {
    userId: user.userId ?? cachedCurrentUser?.userId,
    name: user.name ?? cachedCurrentUser?.name,
    avatarUrl: user.avatarUrl ?? cachedCurrentUser?.avatarUrl,
  };
}

export function getCachedCurrentSocialUser(): CachedSocialUser | null {
  return cachedCurrentUser;
}

export function cacheFeedItem(item: FeedItemVM): void {
  if (!item?.id) return;

  if (memoryCache.size >= MAX_CACHE_SIZE && !memoryCache.has(item.id)) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      memoryCache.delete(oldestKey);
      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.removeItem(`feed_post_${oldestKey}`);
        }
      } catch {
        // Ignore sessionStorage errors
      }
    }
  }

  memoryCache.set(item.id, item);
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(`feed_post_${item.id}`, JSON.stringify(item));
    }
  } catch {
    // Ignore storage quota or disabled errors
  }
}

// Sync memory-only read (safe for initial render without SSR hydration mismatch)
export function getMemoryCachedFeedItem(postId: string): FeedItemVM | null {
  return memoryCache.get(postId) ?? null;
}

export function getCachedFeedItem(postId: string): FeedItemVM | null {
  if (memoryCache.has(postId)) {
    return memoryCache.get(postId)!;
  }
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const stored = window.sessionStorage.getItem(`feed_post_${postId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as FeedItemVM;
        memoryCache.set(postId, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}
