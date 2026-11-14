const USER_GROUP_PLANS = [
  {
    id: "beginners",
    group: "Beginners",
    workout: "3x/wk · Guided form",
    nutrition: "2,000 kcal · Balanced",
  },
  {
    id: "fat-loss",
    group: "Fat Loss",
    workout: "4x/wk · Metabolic",
    nutrition: "1,850 kcal · 150g P",
  },
  {
    id: "muscle-gain",
    group: "Muscle & Strength",
    workout: "4–5x/wk · Hypertrophy",
    nutrition: "2,450 kcal · 175g P",
  },
  {
    id: "busy",
    group: "Busy Schedule",
    workout: "3x/wk · 30m express",
    nutrition: "Quick 3-meal plan",
  },
] as const;

export function AdaptiveRoadmapSection() {
  return (
    <section
      aria-labelledby="roadmap-heading"
      className="fl-section fl-section--surface"
      id="adaptive-roadmap"
    >
      <div className="fl-container fl-stack-lg">
        <div className="fl-section-head">
          <span className="fl-kicker">AI WORKOUT & NUTRITION</span>
          <h2 className="fl-h2" id="roadmap-heading">
            Built for your goal and lifestyle.
          </h2>
        </div>

        <div className="fl-week-grid">
          {USER_GROUP_PLANS.map((item) => (
            <article className="fl-feature-card" key={item.id}>
              <h3 className="fl-week-title">{item.group}</h3>
              <span className="fl-snapshot-label">{item.workout}</span>
              <span className="fl-mono text-xs font-bold text-[var(--color-action)]">
                {item.nutrition}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
