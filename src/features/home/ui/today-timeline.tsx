import { Apple, ChevronRight, Dumbbell, Soup } from "lucide-react";
import Link from "next/link";

import { cn } from "@/shared/lib/cn";
import type { TodayItemCategory, TodayTimelineItem } from "@/shared/api/bff/home/types";

type TodayTimelineProps = {
  items: TodayTimelineItem[];
};

function EventIcon({ category }: { category: TodayItemCategory }) {
  if (category === "workout") return <Dumbbell aria-hidden="true" size={15} />;
  if (category === "snack") return <Apple aria-hidden="true" size={15} />;
  return <Soup aria-hidden="true" size={15} />;
}

export function TodayTimeline({ items }: TodayTimelineProps) {
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
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </div>
            <ChevronRight aria-hidden="true" className="week-route__chevron" size={18} />
          </>
        );

        return (
          <li
            className={cn("week-route__item", `week-route__item--${item.status}`)}
            key={item.id}
          >
            {item.href ? (
              <Link
                aria-label={`Chi tiết ${item.title}`}
                className="week-route__row"
                href={item.href}
                transitionTypes={["nav-forward"]}
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
