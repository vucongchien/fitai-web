export function ThreadCommentsSkeleton() {
  return (
    <div className="space-y-4 px-4 sm:px-6 pt-3 pb-6" aria-busy="true" aria-label="Loading comments">
      {/* Skeleton reply capsule bar (Image 1) */}
      <div className="hidden sm:block h-11 w-full rounded-full bg-neutral-100 animate-pulse" />

      {/* 4 Skeleton comment items (Image 1) */}
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex gap-3 pt-3 border-t border-neutral-100">
          {/* Avatar circle */}
          <div className="h-9 w-9 rounded-full bg-neutral-100 animate-pulse flex-shrink-0" />

          {/* Comment content skeleton */}
          <div className="flex-1 min-w-0 space-y-2.5 pt-0.5">
            {/* Top row: Name & time */}
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-28 rounded-full bg-neutral-100 animate-pulse" />
              <div className="h-3.5 w-10 rounded-full bg-neutral-100 animate-pulse" />
              <div className="ml-auto h-3.5 w-3.5 rounded-full bg-neutral-100 animate-pulse" />
            </div>

            {/* Content lines */}
            <div className="h-3.5 w-full rounded-full bg-neutral-100 animate-pulse" />
            <div className="h-3.5 w-3/4 rounded-full bg-neutral-100 animate-pulse" />

            {/* 4 action circles */}
            <div className="flex items-center gap-4 pt-1">
              <div className="h-4 w-4 rounded-full bg-neutral-100 animate-pulse" />
              <div className="h-4 w-4 rounded-full bg-neutral-100 animate-pulse" />
              <div className="h-4 w-4 rounded-full bg-neutral-100 animate-pulse" />
              <div className="h-4 w-4 rounded-full bg-neutral-100 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ThreadPageSkeleton() {
  return (
    <div className="max-w-[620px] w-full mx-auto bg-white sm:rounded-[24px] sm:border sm:border-neutral-200/90 overflow-hidden">
      {/* Post Skeleton */}
      <div className="flex gap-3.5 px-4 sm:px-6 pt-5 pb-4">
        <div className="h-10 w-10 rounded-full bg-neutral-100 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-0.5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded-full bg-neutral-100 animate-pulse" />
            <div className="h-4 w-6 rounded-full bg-neutral-100 animate-pulse" />
          </div>
          <div className="h-4 w-full rounded-full bg-neutral-100 animate-pulse" />
          <div className="h-4 w-2/3 rounded-full bg-neutral-100 animate-pulse" />
          <div className="flex gap-6 pt-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-5 w-8 rounded-full bg-neutral-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Sort Row */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-neutral-100">
        <div className="h-4 w-16 rounded-full bg-neutral-100 animate-pulse" />
        <div className="h-4 w-24 rounded-full bg-neutral-100 animate-pulse" />
      </div>

      {/* Comments Skeleton */}
      <ThreadCommentsSkeleton />
    </div>
  );
}
