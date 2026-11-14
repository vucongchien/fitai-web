export function ProgressDashboardSkeleton() {
  return (
    <div className="space-y-5 px-4 sm:px-6 pt-5 pb-10 bg-white animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-lg bg-neutral-200" />
          <div className="h-4 w-64 rounded-lg bg-neutral-100" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-neutral-200" />
      </div>

      <div className="h-28 w-full rounded-2xl bg-neutral-100" />

      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-neutral-100" />
        <div className="h-24 rounded-2xl bg-neutral-100" />
        <div className="h-24 rounded-2xl bg-neutral-100" />
        <div className="h-24 rounded-2xl bg-neutral-100" />
      </div>

      <div className="h-64 w-full rounded-2xl bg-neutral-100" />
      <div className="h-64 w-full rounded-2xl bg-neutral-100" />
    </div>
  );
}
