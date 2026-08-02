import { ArrowUpRight, CheckCircle2, Dumbbell, Gauge, Trophy } from "lucide-react";

import { bodyTrend, progressMetrics } from "@/shared/lib/demo-data";
import { MetricTrace } from "@/shared/ui/metric-trace";
import { PageTransition } from "@/shared/ui/page-transition";

export const metadata = { title: "Progress" };

const volumeTrend = [5100, 5600, 5900, 6480, 7200, 7830, 8460];
const effortTrend = [7.4, 7.1, 6.9, 6.8, 6.5, 6.5, 6.4];

export default function ProgressPage() {
  return (
    <PageTransition className="page progress-page">
      <header className="page-heading">
        <div>
          <h1>Evidence, not pressure.</h1>
          <p>These records show what your body has completed. They do not grade missed days.</p>
        </div>
      </header>

      <section className="progress-overview" aria-label="Current progress">
        {progressMetrics.map((metric) => (
          <div className="progress-overview__item" data-tone={metric.tone} key={metric.label}>
            <span>{metric.label}</span>
            <strong className="data-value">{metric.value}</strong>
            <small>
              <ArrowUpRight aria-hidden="true" size={14} /> {metric.change}
            </small>
          </div>
        ))}
      </section>

      <div className="progress-grid">
        <section className="content-section progress-charts">
          <div className="content-section__header">
            <h2>Training trend</h2>
            <p>Last 7 records</p>
          </div>
          <MetricTrace label="Training volume" points={volumeTrend} value="8,460 kg" />
          <MetricTrace label="Average effort" points={effortTrend} tone="coral" value="6.4 RPE" />
          <MetricTrace label="Body weight" points={bodyTrend} tone="green" value="71.4 kg" />
        </section>

        <aside className="progress-history">
          <section className="content-section">
            <div className="content-section__header">
              <h2>Recent sessions</h2>
            </div>
            <ol className="history-list">
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                <div>
                  <strong>Lower-body foundation</strong>
                  <span>12 sets · 2,380 kg · Aug 3</span>
                </div>
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                <div>
                  <strong>Full-body reset</strong>
                  <span>10 sets · 1,940 kg · Jul 31</span>
                </div>
              </li>
              <li>
                <CheckCircle2 aria-hidden="true" size={19} />
                <div>
                  <strong>Upper-body control</strong>
                  <span>11 sets · 2,140 kg · Jul 29</span>
                </div>
              </li>
            </ol>
          </section>

          <section className="personal-record">
            <Trophy aria-hidden="true" size={23} />
            <div>
              <span>Personal record</span>
              <strong className="data-value">22 kg × 8</strong>
              <p>Supported dumbbell row</p>
            </div>
          </section>

          <section className="progress-key">
            <p>
              <Dumbbell aria-hidden="true" size={17} /> Volume shows completed load.
            </p>
            <p>
              <Gauge aria-hidden="true" size={17} /> RPE shows perceived effort.
            </p>
          </section>
        </aside>
      </div>
    </PageTransition>
  );
}
