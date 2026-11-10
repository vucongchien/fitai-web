export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)]" />
          <div className="h-4 w-72 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)]" />
        </div>
        <div className="h-9 w-32 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)]" />
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="h-14 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] p-3 flex items-center gap-3">
        <div className="h-8 flex-1 max-w-sm rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)]" />
        <div className="h-8 w-24 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)]" />
      </div>

      {/* Table / Content Skeleton */}
      <div className="rounded-[var(--radius-hero)] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-xs">
        <div className="h-11 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]" />
        <div className="divide-y divide-[var(--color-border)]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[var(--radius-card)] bg-[var(--color-surface-subtle)]" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)]" />
                  <div className="h-3 w-20 rounded-[var(--radius-input)] bg-[var(--color-surface-subtle)]" />
                </div>
              </div>
              <div className="h-6 w-16 rounded-full bg-[var(--color-surface-subtle)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
