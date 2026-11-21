import type { FeedItemVM } from "../model/social.types";

const MAX_CACHE_SIZE = 100;
const memoryCache = new Map<string, FeedItemVM>();

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
