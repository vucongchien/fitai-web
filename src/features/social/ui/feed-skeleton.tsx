export function FeedSkeleton() {
  return (
    <div
      className="max-w-[640px] w-full mx-auto rounded-[24px] border border-neutral-300 bg-white overflow-hidden divide-y divide-neutral-100 shadow-none"
      aria-busy="true"
      aria-label="Loading feed"
    >
      {/* 1. Top Composer Skeleton */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-neutral-100 animate-pulse" />
          <span className="text-sm font-normal text-neutral-300">What's new?</span>
        </div>
        <div className="h-[34px] px-4 rounded-xl !border !border-solid !border-neutral-300 bg-transparent flex items-center justify-center text-[13px] font-semibold text-neutral-400">
          Post
        </div>
      </div>

      {/* 2. Skeleton Items (Image 2) */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3.5 px-4 sm:px-6 py-4 bg-white">
          {/* Avatar Skeleton */}
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-neutral-100 animate-pulse" />
          </div>

          {/* Content Skeleton */}
          <div className="flex-1 min-w-0 pt-0.5 space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-24 rounded-full bg-neutral-100 animate-pulse" />
                <div className="h-3 w-8 rounded-full bg-neutral-100 animate-pulse" />
              </div>
              <div className="h-4 w-4 rounded-full bg-neutral-100 animate-pulse" />
            </div>

            {/* Caption lines */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-11/12 rounded-full bg-neutral-100 animate-pulse" />
              <div className="h-3.5 w-3/4 rounded-full bg-neutral-100 animate-pulse" />
            </div>

            {/* Reaction icons skeleton */}
            <div className="flex items-center gap-4 pt-1">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="h-5 w-5 rounded-full bg-neutral-100 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
