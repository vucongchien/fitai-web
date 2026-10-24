import { SocialContainer } from "./social-container";

export function ProfileTabbedSkeleton() {
  return (
    <SocialContainer aria-busy="true" aria-label="Loading profile">
      <div className="px-5 sm:px-6 pt-6 pb-4 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-7 w-48 rounded-md bg-neutral-100 animate-pulse" />
            <div className="h-4 w-28 rounded-md bg-neutral-100 animate-pulse" />
            <div className="h-4 w-64 rounded-md bg-neutral-100 animate-pulse pt-2" />
          </div>
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-neutral-100 animate-pulse shrink-0" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="h-4 w-24 rounded-md bg-neutral-100 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-neutral-100 animate-pulse" />
            <div className="h-7 w-7 rounded-full bg-neutral-100 animate-pulse" />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <div className="h-9 flex-1 rounded-xl bg-neutral-100 animate-pulse" />
          <div className="h-9 flex-1 rounded-xl bg-neutral-100 animate-pulse" />
        </div>
      </div>

      <div className="flex border-b border-neutral-200 bg-white">
        {["Overview", "Posts", "Replies", "Media"].map((t, idx) => (
          <div
            key={t}
            className={[
              "flex-1 py-3 text-center text-[14.5px] font-bold relative",
              idx === 0
                ? "text-sky-500"
                : "text-neutral-400",
            ].join(" ")}
          >
            {t}
            {idx === 0 && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-sky-500" />
            )}
          </div>
        ))}
      </div>

      <div className="p-5 sm:p-6 space-y-4 bg-white">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-neutral-100 animate-pulse mt-4" />
        <div className="h-36 rounded-2xl bg-neutral-100 animate-pulse mt-4" />
      </div>
    </SocialContainer>
  );
}
