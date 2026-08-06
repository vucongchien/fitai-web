# AI Fitness & Nutrition — Four Screens

**Date:** 2026-08-06
**Status:** Approved, ready for implementation

## Goal

Build four mobile-first screens — Home, Nutrition, Workout, Weekly Progress — that join
training and nutrition into one view. Every number shown must come from a real proto field
or the mock layer. Nothing is hard-coded in a component, and nothing is estimated by a
formula the backend does not provide.

## Data feasibility (audited against `gym-companion/proto`)

The full proto set was read field by field before design. Findings that shaped the scope:

### Available

| UI need | Source field |
| --- | --- |
| Calories consumed / target | `GetNutritionSummaryResponse.consumed_calories` / `.target_calories` |
| Protein / carbs / fat, consumed + target | `GetNutritionSummaryResponse.consumed_macros.*` / `.target_macros.*` (`protein_grams`, `carb_grams`, `fat_grams`) |
| Meal log rows | `GetNutritionHistoryResponse.meals[]` → `MealLogItem{meal_name, meal_type, calories, protein, carbs, fat, logged_at}` |
| Planned menu per slot | `GetTodayMenuResponse.meals.{breakfast,lunch,dinner,snack}[]` → `MealOption` |
| Roadmap tree + status | `GetActiveRoadmapResponse.roadmap` → `week_plans[] → day_plans[] → session_plans[]`, `SessionPlan.status`, `SessionPlan.scheduled_date`, `SessionPlan.slot_time` |
| Session history | `GetWorkoutHistoryResponse.sessions[]` → `WorkoutSessionSummary{session_id, date, total_sets, total_volume, average_form_score}` |
| Personal records | `GetPersonalRecordsResponse.records[]` → `PersonalRecord` |

### Absent — dropped from scope

- **Water intake.** No field, message, RPC, or event anywhere in the proto set.
- **Calories burned.** No energy-expenditure field. Deriving it needs a MET/BMR formula,
  which is business logic the BFF is not allowed to hold. DESIGN.md independently forbids
  showing generated calories as evidence.
- **Active minutes.** No field, and not derivable from history.
- **Actual workout duration.** `WorkoutSessionSummary` carries only `date` — no
  `started_at`/`completed_at`. Elapsed time is knowable only inside a live session.
- **Average RPE over time.** `average_rpe` exists on session completion but **not** on
  `WorkoutSessionSummary`, so no weekly RPE trend is possible.
- **Exercises-completed count.** No such field on any summary message.

Consequence: the six-card grid uses only backed metrics (see Screen 1).

### Two constraints the implementation must respect

1. **No join key.** `WorkoutSessionSummary` has no `plan_id` or `session_plan_id`; that key
   exists only on events, never on an RPC response. Roadmap and history are therefore two
   independent sources. No aggregator may imply a row-level link between them.
2. **Mismatched date types.** History uses `google.protobuf.Timestamp`; the roadmap uses
   `google.type.Date`. Both normalize to a `YYYY-MM-DD` day key before any comparison.

## Architecture

Follows the established `feature/{model,server,ui}` layout and the `getXPageData()` mock
gate already used by `features/home`.

```
proto RPC                    BFF aggregate (reshape only)        feature/server → ui
──────────────────────────────────────────────────────────────────────────────────────
GetNutritionSummary  ┐
GetNutritionHistory  ├──►  shared/api/bff/aggregate/             nutrition/server
GetActiveRoadmap     ├──►    nutrition-daily.ts                  workout/server
GetWorkoutHistory    ┘       workout-adherence.ts                progress/server
GetPersonalRecords           weekly-rollup.ts
```

### The BFF rule

The BFF shapes data for display. It holds no business logic.

**Allowed:** filter, group, sum, count, sort, min/max, format, date-key normalization.
**Forbidden:** MET/BMR/TDEE or any estimation formula, invented coefficients, inferred
targets, anything that produces a number the backend did not send or that plain counting
cannot yield.

Each aggregator is a pure function over proto response types, unit-tested in isolation.

### Mock gate

Every `getXPageData()` mirrors `getHomePageData()`:

```ts
const hasBackend = Boolean(process.env.FITAI_RPC_URL);
if (!hasBackend) return getMockXData();
```

Mock builders live in `features/*/server/get-mock-*.ts` and return the same types the
adapters produce, so the UI cannot tell the two apart.

## Design direction

Governed by `DESIGN.md` (Triple Lane) and `PRODUCT.md`. Mode: **Operate** — the visitor
completes a task, so scanability and consistency outrank expression.

Reused vocabulary, not reinvented: `.page`, `.page-heading`, `.content-section`,
`.content-section__header`, `.utility-label`, `.data-value`, `.week-selector` (the tab
pattern), `.text-action`. New CSS follows the same BEM shape in `globals.css` and consumes
only `tokens.css` variables — no literal colors, no ad-hoc spacing.

Honored: the 82/18 neutral rule; one leading accent per screen (Blue for planning, Coral
for effort, Green for completion); semantic pairing, so color never carries state alone;
flat at rest, with the one float shadow reserved for fixed navigation; sentence case;
tabular numerals via `--font-data` for every value that changes in place; 48px minimum
targets; 20px gutters at the 390px baseline.

### Two documented deviations

Both were raised and the user chose the prompt's layout.

1. **Six-card metric grid.** DESIGN.md discourages decorative KPI rows. Accepted here
   because every card is backed by a real field and pairs actual with target — the
   "show target and actual together" rule. Cards stay flat and separated by Steel
   dividers rather than six competing shadows; icons are semantic, never ornament.
2. **Bottom navigation.** DESIGN.md names Home/Roadmap/Progress/Profile. Shipping code has
   Home/Nutrition/Roadmap/Profile. The count stays at four; only the Roadmap label becomes
   Workout. Weekly Progress lives in that screen's Week/Month tabs instead of taking a
   fifth slot.

## Charts

`@tanstack/charts` + `@tanstack/charts-scales` + `@tanstack/react-charts` @ 0.6.5,
installed and verified: production build compiles, and both chart types render server-side
with correct `role="img"` and `aria-label`.

The library is a cartesian grammar — its marks are `lineY`, `barX/barY`, `areaY`, `dot`,
`rect/cell`, `hexagon`, `link`, `arrow`, `frame`. **It has no arc, pie, radial, or gauge
mark**, so the circular progress hero cannot use it and is authored as inline SVG.

| Element | Implementation |
| --- | --- |
| 7-day nutrition trend (S1) | `lineY` + `scalePoint` / `scaleLinear` |
| Calories per meal (S2) | `barY` + `scaleBand` / `scaleLinear` |
| Sessions per weekday (S3) | `lineY` |
| Circular progress hero (S2/S3/S4) | inline SVG |
| Progress bars (S4) | CSS |

Wrappers live in `shared/ui/charts/` so the pre-1.0 API is isolated: a breaking upgrade
touches those files, not the screens. Because `Chart` is a hooks adapter it needs
`"use client"`, and its marks are laid out only after width is measured — so every chart
sits in a fixed-height, `aspectRatio` wrapper to prevent layout shift. Charts stay leaf
client components; pages remain server components.

Empty data is a designed state, not a zero: a day with no log renders a flat baseline and
a "No data logged" caption rather than a misleading drop to zero.

## Screens

### Screen 1 — Home (`/home`)

Extends the existing `HomeView`; `TodayHeader` and the static shell stay as the LCP.

1. Overview card: Workout Completion, Nutrition Goal, and a 7-day line chart.
2. Six-card metric grid (2 columns), each card carrying icon, title, current value, target:

   | Card | Source | BFF op |
   | --- | --- | --- |
   | Calories Consumed | `consumed_calories` / `target_calories` | pass-through |
   | Protein | `consumed_macros.protein_grams` / target | pass-through |
   | Meals Logged | today's `meals[]` | count |
   | Workout Completion | `SessionPlan.status` | count COMPLETED ÷ total |
   | Training Volume | `WorkoutSessionSummary.total_volume` | sum |
   | Total Sets | `WorkoutSessionSummary.total_sets` | sum |

   Training Volume and Total Sets have no proto target, so they show a trailing 7-day
   comparison instead of a fabricated goal.
3. "View Today's Plan" CTA that scrolls to the existing `TodayTimeline`.

The CTA is a small client component using `scrollIntoView`, honoring
`prefers-reduced-motion` by jumping instead of smooth-scrolling. The rest stays server.

### Screen 2 — Nutrition (`/nutrition`)

Replaces the current placeholder.

1. Circular progress hero: calories today, goal completion, date.
2. One-line progress sentence.
3. Protein / Carbohydrates / Fat row, each actual against target.
4. Bar chart of calories per meal.
5. Timeline: Breakfast, Lunch, Dinner, Snacks — grouped by `meal_type`, ordered by
   `logged_at`, with an empty state per unlogged slot.

### Screen 3 — Workout (`/roadmap`)

Route unchanged, so `(workout)/roadmap/[sessionPlanId]` and existing links keep working.
The bottom-nav label and page heading become "Workout".

1. Daily / Week / Month tabs.
2. Circular progress hero: workout completion for today.
3. Three stats: Sessions Completed, Training Volume, Total Sets — replacing the
   unavailable Active Minutes / Calories Burned / Exercises Completed.
4. Line chart of sessions per weekday, Mon–Sun.
5. The existing `WeekRoute` list below.

### Screen 4 — Weekly Progress (Week / Month tabs of `/roadmap`)

Rebuilds `features/progress`.

1. Large overview card: weekly goal, progress ring, overall completion.
2. Two side-by-side statistics: Nutrition Score, Workout Score — each a plain
   completed ÷ target count, never a weighted index.
3. "Weekly Progress" heading.
4. Progress bars: Nutrition Goal, Workout Goal.
5. Weekly achievements: Workouts Completed, Meals Logged, Average Protein Intake,
   Active Days (distinct dates with a completed session).

All three tabs are fed by one server fetch, so switching tabs costs no round trip. Tab
state is client-side.

## Repairing a pre-existing break

`pnpm typecheck` is red on `main` before this work starts. Commit `969bf17` deleted
`features/progress` but left three referencing files: `roadmap-view.tsx` (two imports),
`tests/unit/progress-aggregator.test.ts`, and a stale `.next` route type for
`profile/progress`.

Screen 4 *is* the progress feature, so the rebuild resolves this rather than deleting
evidence. `features/progress/model/progress-aggregator.ts` is written to the contract the
orphan test already specifies:

- `calculateAdherencePercentage(done, total)` — integer percent, `0` when `total === 0`,
  clamped to `100`.
- `formatVolumeKg(kg)` — `"850 kg"` below 1000, `"1t"` / `"3.5t"` at or above.
- `getTopPersonalRecords(records, n)` — sorted by date descending, backed by
  `PersonalRecord`.
- `getMockProgressStats()` — mock stats including `adherence` and `personalRecords`.

Plus `features/progress/ui/roadmap-progress-banner.tsx`, restoring the second import.

Turning that existing test green is part of the deliverable.

## Testing

**Unit (vitest).** Each aggregator: meal grouping by type, day bucketing from `logged_at`,
adherence counting, `Timestamp`/`Date` normalization, and empty-input cases. Plus the
revived `progress-aggregator` test.

**Component (RTL).** `CircularProgress` exposes real values in its `aria-label`; zero and
empty data render the empty state, not a fake zero; the metric grid renders target
alongside actual.

**Gate.** `pnpm typecheck && pnpm lint && pnpm test` all green — typecheck moving from red
to green is part of the definition of done. Verification at 390 / 768 / 1280 px, including
keyboard focus and reduced motion.

## Out of scope

- Water intake, calories burned, active minutes, exercises-completed, actual session
  duration, weekly RPE trend — no data source (see above).
- Meal logging, editing, or any mutation. These screens read.
- Real gRPC adapters. Mapper functions are written against proto types with the mock gate
  in place, matching how `features/home` and `features/roadmap` already ship.
- Renaming the `/roadmap` route or touching `(workout)/roadmap/[sessionPlanId]`.
