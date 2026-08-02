import { CalendarRange, Gauge, Sparkles } from "lucide-react";

import { WeekRoute } from "@/features/roadmap/ui/week-route";
import { activeRoadmap, sessions } from "@/shared/lib/demo-data";
import { PageTransition } from "@/shared/ui/page-transition";
import { TripleLane } from "@/shared/ui/triple-lane";

export const metadata = { title: "Roadmap" };

const weeks = [
  { label: "Foundation", number: 1, state: "complete" },
  { label: "Build capacity", number: 2, state: "active" },
  { label: "Add control", number: 3, state: "planned" },
  { label: "Consolidate", number: 4, state: "planned" },
] as const;

export default function RoadmapPage() {
  return (
    <PageTransition className="page roadmap-page">
      <header className="page-heading">
        <div>
          <h1>Your four-week route</h1>
          <p>The plan builds gradually, then gives your body room to absorb the work.</p>
        </div>
        <span className="roadmap-phase">Week {activeRoadmap.week} active</span>
      </header>

      <TripleLane active="plan" labelled morph />

      <nav aria-label="Roadmap weeks" className="week-selector">
        {weeks.map((week) => (
          <button
            aria-current={week.state === "active" ? "step" : undefined}
            className="week-selector__item"
            data-state={week.state}
            key={week.number}
            type="button"
          >
            <span className="data-value">W{week.number}</span>
            <strong>{week.label}</strong>
          </button>
        ))}
      </nav>

      <div className="roadmap-layout">
        <section className="content-section">
          <div className="content-section__header">
            <h2>Week 2 schedule</h2>
            <p>Aug 3–9</p>
          </div>
          <WeekRoute sessions={sessions} />
        </section>

        <aside className="roadmap-context">
          <div className="roadmap-context__item">
            <CalendarRange aria-hidden="true" size={20} />
            <div>
              <strong>3 strength sessions</strong>
              <span>Plus one guided recovery day</span>
            </div>
          </div>
          <div className="roadmap-context__item">
            <Gauge aria-hidden="true" size={20} />
            <div>
              <strong>Target effort 6–7</strong>
              <span>Enough challenge to progress with control</span>
            </div>
          </div>
          <div className="roadmap-context__item">
            <Sparkles aria-hidden="true" size={20} />
            <div>
              <strong>Why this changed</strong>
              <span>Wednesday moved later to match your updated availability.</span>
            </div>
          </div>
        </aside>
      </div>
    </PageTransition>
  );
}
