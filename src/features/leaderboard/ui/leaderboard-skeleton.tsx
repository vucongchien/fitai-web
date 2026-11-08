export function LeaderboardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading leaderboard"
      className="w-full min-h-screen bg-white pb-24"
    >
      {/* Header Skeleton */}
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-neutral-100">
        <div className="h-6 w-36 bg-neutral-200/70 rounded-md animate-pulse mb-2" />
        <div className="h-4 w-56 bg-neutral-100 rounded-md animate-pulse" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="px-5 sm:px-6 py-4">
        <div className="h-10 w-full max-w-[280px] bg-neutral-100 rounded-xl p-1 flex gap-1 animate-pulse">
          <div className="h-full flex-1 bg-white rounded-lg shadow-2xs" />
          <div className="h-full flex-1 rounded-lg" />
        </div>
      </div>

      {/* Podium Skeleton */}
      <div className="px-5 sm:px-6 pt-2 pb-6">
        <div className="flex items-end justify-center gap-3 sm:gap-4 max-w-[380px] mx-auto h-[220px]">
          {/* Rank 2 (Silver) */}
          <div className="flex-1 flex flex-col items-center">
            <div className="size-14 rounded-full bg-neutral-200/80 animate-pulse mb-2" />
            <div className="h-3 w-16 bg-neutral-200/60 rounded animate-pulse mb-1" />
            <div className="h-3 w-12 bg-neutral-200/40 rounded animate-pulse mb-2" />
            <div className="w-full h-24 bg-neutral-100 rounded-t-2xl animate-pulse" />
          </div>

          {/* Rank 1 (Gold) */}
          <div className="flex-1 flex flex-col items-center">
            <div className="size-16 rounded-full bg-amber-100 animate-pulse mb-2" />
            <div className="h-4 w-20 bg-neutral-200/80 rounded animate-pulse mb-1" />
            <div className="h-3 w-14 bg-neutral-200/40 rounded animate-pulse mb-2" />
            <div className="w-full h-32 bg-amber-50 rounded-t-2xl animate-pulse" />
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="flex-1 flex flex-col items-center">
            <div className="size-12 rounded-full bg-neutral-200/80 animate-pulse mb-2" />
            <div className="h-3 w-14 bg-neutral-200/60 rounded animate-pulse mb-1" />
            <div className="h-3 w-10 bg-neutral-200/40 rounded animate-pulse mb-2" />
            <div className="w-full h-20 bg-neutral-100 rounded-t-2xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Ranked List Skeleton */}
      <div className="px-5 sm:px-6 space-y-2.5">
        {[4, 5, 6, 7, 8].map((index) => (
          <div
            key={index}
            className="flex items-center gap-3.5 p-3 rounded-2xl border border-neutral-100 bg-neutral-50/50"
          >
            <div className="w-6 h-4 bg-neutral-200/60 rounded animate-pulse shrink-0" />
            <div className="size-10 rounded-full bg-neutral-200/80 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-3.5 w-28 bg-neutral-200/80 rounded animate-pulse" />
              <div className="h-3 w-16 bg-neutral-200/50 rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-neutral-200/70 rounded animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
