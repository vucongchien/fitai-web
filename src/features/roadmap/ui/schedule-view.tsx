import type { SchedulePageData } from "@/features/roadmap/model/roadmap-page.types";
import { AIAdjustmentBanner } from "@/features/roadmap/ui/ai-adjustment-banner";
import { WeekRoute } from "@/features/roadmap/ui/week-route";

interface ScheduleViewProps {
  data: SchedulePageData;
}

const STATE_LABEL = {
  active: "In progress",
  complete: "Done",
  planned: "Upcoming",
} as const;

export function ScheduleView({ data }: ScheduleViewProps) {
  return (
    <div className="schedule-weeks">
      <AIAdjustmentBanner />
      {data.weeks.map((week) => (
        <section
          className="content-section schedule-week"
          data-state={week.state}
          key={week.number}
        >
          <div className="content-section__header">
            <h2>
              Week <span className="data-value">{week.number}</span> · {week.label}
            </h2>
            <p>
              <span className="schedule-week__state">{STATE_LABEL[week.state]}</span>
              {" · "}
              {week.dateRange}
            </p>
          </div>

          {week.sessions.length === 0 ? (
            <p className="schedule-week__empty">No sessions scheduled for this week yet.</p>
          ) : (
            // Morphing is reserved for the active week, so only one shared name is mounted.
            <WeekRoute morphNextSession={week.state === "active"} sessions={week.sessions} />
          )}
        </section>
      ))}
    </div>
  );
}
