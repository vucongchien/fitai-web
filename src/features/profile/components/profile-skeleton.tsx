export function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading profile data">
      {/* Hero Card Skeleton */}
      <div className="rounded-[20px] bg-white p-6 shadow-sm border border-neutral-200 text-center">
        <div className="mx-auto mb-3 h-24 w-24 rounded-full bg-neutral-200" />
        <div className="mx-auto h-6 w-36 rounded-md bg-neutral-200" />
        <div className="mx-auto mt-2 h-4 w-48 rounded-md bg-neutral-100" />
        <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl bg-neutral-100 p-3">
          <div className="h-10 rounded bg-neutral-200" />
          <div className="h-10 rounded bg-neutral-200" />
          <div className="h-10 rounded bg-neutral-200" />
        </div>
      </div>

      {/* Highlights Skeleton */}
      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 rounded-[14px] bg-white border border-neutral-200" />
        <div className="h-20 rounded-[14px] bg-white border border-neutral-200" />
        <div className="h-20 rounded-[14px] bg-white border border-neutral-200" />
      </div>

      {/* Menu List Skeleton */}
      <div className="space-y-2 rounded-[14px] bg-white p-4 border border-neutral-200">
        <div className="h-12 rounded-xl bg-neutral-100" />
        <div className="h-12 rounded-xl bg-neutral-100" />
        <div className="h-12 rounded-xl bg-neutral-100" />
        <div className="h-12 rounded-xl bg-neutral-100" />
      </div>
    </div>
  );
}
