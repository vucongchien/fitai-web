"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

import { fetchMoreFeedAction, fetchMoreProfileFeedAction } from "../server/social-actions";
import type { FeedItemVM } from "../model/social.types";
import { FeedCard } from "./feed-card";

interface Props {
  initialItems: FeedItemVM[];
  initialNextCursor: string;
  currentUserId?: string;
  profileUserId?: string;
  header?: React.ReactNode;
}

export function FeedList({
  initialItems,
  initialNextCursor,
  currentUserId,
  profileUserId,
  header,
}: Props) {
  const [items, setItems] = useState<FeedItemVM[]>(initialItems);
  const [cursor, setCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = profileUserId
        ? await fetchMoreProfileFeedAction(profileUserId, cursor)
        : await fetchMoreFeedAction(cursor);
      setItems((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, profileUserId]);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadMore();
          }
        },
        { rootMargin: "250px" },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [loadMore],
  );

  return (
    <div className="max-w-[640px] w-full mx-auto rounded-[24px] border border-neutral-300 bg-white overflow-hidden divide-y divide-neutral-100 shadow-none">
      {/* Custom Header (e.g. Profile Header & Tabs) */}
      {header}

      {/* 1. Top Composer Row (What's new?) */}
      {!profileUserId && !header && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-neutral-200 bg-neutral-100 flex-shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                alt="Avatar"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <span className="text-[14px] text-neutral-400 font-normal truncate">
              What's new?
            </span>
          </div>
          <button
            type="button"
            className="flex-shrink-0 h-[34px] px-4 rounded-xl !border !border-solid !border-neutral-300 bg-transparent text-[13px] font-semibold text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all shadow-none cursor-pointer"
          >
            Post
          </button>
        </div>
      )}

      {/* 2. Empty State */}
      {items.length === 0 && !loading && (
        <div className="py-16 text-center px-4">
          <p className="text-sm font-medium text-neutral-600">No posts yet.</p>
          <p className="mt-1 text-xs text-neutral-400">
            Follow more people to see their latest updates here.
          </p>
        </div>
      )}

      {/* 3. Feed Items (divided by thin line) */}
      {items.map((item) => (
        <FeedCard key={item.id} item={item} currentUserId={currentUserId} />
      ))}

      {/* 4. Spinner in center during infinite load */}
      {cursor && (
        <div ref={sentinelRef} className="flex justify-center items-center py-6 bg-white">
          <Loader2 className="animate-spin text-neutral-400" size={22} />
        </div>
      )}

      {/* 5. End of feed indicator */}
      {!cursor && items.length > 0 && (
        <div className="py-5 text-center text-xs text-neutral-400 bg-white">
          You're all caught up
        </div>
      )}
    </div>
  );
}
