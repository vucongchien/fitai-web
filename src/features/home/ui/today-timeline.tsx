import { Apple, ChevronRight, Dumbbell, Soup } from "lucide-react";
import Link from "next/link";

import type { TodayItemCategory, TodayTimelineItem } from "@/features/home/model/home-page.types";
import { cn } from "@/shared/lib/cn";
import { NAV_FORWARD } from "@/shared/ui/transition-types";

interface TodayTimelineProps {
  items: TodayTimelineItem[];
}

function EventIcon({ category }: { category: TodayItemCategory }) {
  if (category === "workout") {
    return <Dumbbell aria-hidden="true" size={15} />;
  }
  if (category === "snack") {
    return <Apple aria-hidden="true" size={15} />;
  }
  return <Soup aria-hidden="true" size={15} />;
}

export function TodayTimeline({ items }: TodayTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center rounded-2xl border border-dashed border-neutral-200 bg-white space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#4B57F2]">
          <Dumbbell size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#101214]">No scheduled activities for today</h3>
          <p className="text-xs text-[#50565C] mt-1">
            Start an ad-hoc session or view your 4-week training roadmap.
          </p>
        </div>
        <div className="pt-1 flex items-center justify-center gap-2">
          <Link
            href="/workouts/adhoc"
            transitionTypes={NAV_FORWARD}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#4B57F2] text-white hover:bg-[#3945DC] transition-colors"
          >
            Start Workout
          </Link>
          <Link
            href="/schedule"
            transitionTypes={NAV_FORWARD}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 text-[#50565C] hover:bg-neutral-200 transition-colors"
          >
            View Roadmap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ol className="week-route">
      {items.map((item) => {
        const content = (
          <>
            <span className="week-route__marker">
              <EventIcon category={item.category} />
            </span>
            <div className="week-route__date">
              <strong>{item.time}</strong>
            </div>
            <div className="week-route__session">
              <h3>{item.title}</h3>
              <span>{item.subtitle}</span>
            </div>
            <ChevronRight aria-hidden="true" className="week-route__chevron" size={18} />
          </>
        );

        return (
          <li className={cn("week-route__item", `week-route__item--${item.status}`)} key={item.id}>
            {item.href ? (
              <Link
                aria-label={
                  item.category === "workout" ? "Begin session" : `Chi tiết ${item.title}`
                }
                className="week-route__row"
                href={item.href}
                transitionTypes={NAV_FORWARD}
              >
                {content}
              </Link>
            ) : (
              <div className="week-route__row">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
