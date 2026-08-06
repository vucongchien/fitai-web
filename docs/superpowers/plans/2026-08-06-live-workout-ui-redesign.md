# Live Workout UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the live workout execution screens (Active Exercise + Rest/Next Exercise) as two fixed-height, mobile-first layouts that never scroll the page, replacing the accreted `ui/live/` component set.

**Architecture:** Only the presentation layer changes. The domain layer (`domain/session-flow.ts`, `domain/motion-engine.ts`), the state machine (`model/use-live-session.ts`), the side-effect orchestrator (`model/use-live-workout-effects.ts`) and the data boundary (`server/get-live-session-data.ts`) stay in place — the mock→gRPC swap point is already correct and must not move. Nine legacy UI files are deleted and replaced by seven focused components composed into two screen shells. Each screen is a `100dvh` CSS grid with explicit rows; the coaching-instructions block is the single scrollable region.

**Tech Stack:** Next.js 16 App Router (React 19), TypeScript, Tailwind v4 + `@theme inline` tokens in `src/shared/design-system/tokens.css`, hand-written CSS classes in `src/app/globals.css`, `lucide-react` icons, Vitest + `@testing-library/react` (jsdom), Playwright for e2e, `oxlint`/`oxfmt`.

## Global Constraints

- Package manager is **pnpm**. Commands: `pnpm run dev`, `pnpm run build`, `pnpm run lint` (oxlint), `pnpm run typecheck` (`tsc --noEmit`), `pnpm test` (`vitest run`), `pnpm test:e2e` (playwright).
- **Never run bare `pnpm format`.** It rewrites ~200 files repo-wide (the repo has no `.gitattributes`, so `core.autocrlf` then marks every one of them modified) and buries your real diff in noise. Format only what you touched: `pnpm exec oxfmt path/to/file.tsx`.
- **Stage only the files your task names.** The working tree carries unrelated in-flight work from another effort — `package.json`, `pnpm-lock.yaml` (a `@tanstack/charts` install), and `src/app/(main)/profile/page.tsx`. Never `git add -A`, never `git commit -a`. Leave those three alone.
- Always `await` `params` and `searchParams` in Next.js route files.
- Use `oxlint`/`oxfmt`, never ESLint/Prettier.
- Commit messages MUST start with `[AI]`. Never commit, push, merge, rebase, or reset on `main`, `master`, `staging`, `development`, or `dev` without explicit user approval. All work in this plan happens on a feature branch.
- All user-facing copy in these two screens is **English**, matching the sample content in the spec verbatim where given.
- No new runtime dependencies. Everything is built from what is already in `package.json`.
- Data shapes must stay mappable to the generated Connect contracts under `src/shared/api/gen/contracts/`. Any field the contract does not have must be marked with a `// NOT IN CONTRACT` comment so the gRPC adapter author sees it.
- Neither screen may scroll the document. `document.body` scroll is off inside the `(workout)` live route; only the coaching panel scrolls.
- Bottom of every screen reserves `env(safe-area-inset-bottom)`.
- Every interactive element has an accessible name (`aria-label` on icon-only buttons).

## Design Authority

`PRODUCT.md` and `DESIGN.md` ("Triple Lane") are binding. Every task below inherits these; a subagent that breaks one has failed the task even if its tests pass.

**Colour — the One Leader Rule.** A screen has exactly one dominant accent.

- **Active exercise screen → Sprint Coral** (`--color-effort`). Coral means active physical effort. It appears on the countdown ring arc and nowhere else on that screen.
- **Rest screen → Field Green** (`--color-recovery`). Green means recovery and readiness. It appears on the rest ring arc and nowhere else on that screen.
- Relay Blue stays reserved for navigation, focus rings, and planning. Neither screen uses it as an accent.
- Never use Sprint Coral for danger, errors, or destructive actions.
- Roughly 82% of each viewport stays neutral. The ring arc is the accent budget — spend it there, not on buttons.
- Colour is never the only signal: the ring always carries the numeric time inside it.

**Typography.**

- `--font-display` (Anybody) is for exercise and session **names** only: `.live-screen__title`, `.live-meta__name`, `.live-next__name`.
- `--font-body` (Atkinson) at `font-weight: 750; letter-spacing: 0.06em` is the **label** style. Every uppercase micro-label uses it — `.live-coach__label`, `.live-next__badge`, `.live-rest__label`. Display faces in labels, buttons, and data are a product-UI failure.
- `--font-data` (Atkinson Mono) with `font-variant-numeric: tabular-nums` for every value that changes in place: the countdown, rep counters, set counters.
- Sentence case for coaching prose. Uppercase only in the label style.
- Display sizes stay at or below `2.5rem` on these mobile screens, per DESIGN.md.

**Surface and depth.**

- Flat at rest. A static surface earns no shadow. The **only** `--shadow-float` on these screens is the camera button, which genuinely floats above the media.
- No gradients, no glow, no glassmorphism, no translucent scrims over media. Buttons and overlays use solid `--color-surface`.
- Radii come from tokens only: `--radius-input` (10px) controls, `--radius-surface` (14px) bounded surfaces, `--radius-hero` (20px) the media panel, `--radius-round` circles.
- Borders are `--color-border` (Steel) at 1px. No coloured left-borders.

**Layout.**

- Mobile side gutters are **20px** (`--space-5`), per DESIGN.md — not 16px.
- Touch targets are at least **48×48** CSS px (`PRODUCT.md`), not 44. `.workout-close` is already `3rem`; match it.
- Live Workout has no bottom navigation. The set is the only task.

**Motion.**

- 150–250 ms, state only. `--duration-state` (180ms) for state, `--duration-press` (90ms) for the 98.5% press scale that `.ui-button` already implements.
- No page-load choreography. The screen loads into a task.
- Everything animated must degrade under `prefers-reduced-motion: reduce`, including the ring arc and the media loop.

**Focus.** `globals.css:51` already sets a global `:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 3px }`. Do not re-declare it. Do verify it is not clipped: `.live-screen` sets `overflow: hidden`, so any control sitting flush against the screen edge needs enough inset for a 3px-offset ring to render.

## Known Gaps Called Out Up Front

1. **Breathing tip has no contract field.** `contracts.supporting.exercise.v1.ExerciseInfo` has `instructions`, `thumbnailUrl`, `mediaUrl`, `videoUrl`, `hasAiSupported` — but nothing for breathing, form cues, or common mistakes. `formCues` / `commonMistakes` already exist as mock-only fields on `ExerciseSummary`; `breathingCue` joins them. Task 1 marks all three `// NOT IN CONTRACT` so the backend owner can add them to the proto later.
2. **"Exercise 2 of 8" is session-wide**, not phase-wide. Today `SessionStep.exercisePosition` counts within the phase and `live-workout.tsx:80` divides by `exercisesOfPhase(...).length`. Task 1 adds a session-wide counter alongside the existing phase-wide one; the phase-wide field is left intact because `stepIndexAfterPhase` and the phase-intro logic still read it.
3. **Music is dropped from the UI** per the spec ("bỏ qua nghe nhạc"). The `useAudioCoach` hook stays because it also plays the coaching cues used by `playCueByCode`; only the music _UI_ (`music-sheet.tsx`, `music-mini-control.tsx`) is deleted and the playlist priming effect is removed.

## File Structure

### Created

| File                                                      | Responsibility                                                                                                                                                |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/workout/ui/live/session-header.tsx`         | Fixed-height top bar: back button, centered title, up to three right-side icon actions. Used by both screens.                                                 |
| `src/features/workout/ui/live/exercise-media.tsx`         | Preview panel (video when available, else thumbnail, else initial-letter fallback). Hosts the camera button and, in camera mode, the existing `CameraStage`.  |
| `src/features/workout/ui/live/exercise-meta-row.tsx`      | Two balanced columns: name + duration on the left, `1 / 3 Sets` on the right.                                                                                 |
| `src/features/workout/ui/live/coaching-panel.tsx`         | The one scrollable region. Four labelled blocks with a bottom fade mask that only appears while more content remains.                                         |
| `src/features/workout/ui/live/countdown-ring.tsx`         | The countdown instrument shared by both screens: depleting arc + tabular value. Carries each screen's single accent.                                          |
| `src/features/workout/ui/live/active-timer-bar.tsx`       | Bottom bar of the active screen: Done (left), countdown ring (center), +10s (right).                                                                          |
| `src/features/workout/ui/live/active-exercise-screen.tsx` | Grid shell composing header → media → meta → coaching → timer bar.                                                                                            |
| `src/features/workout/ui/live/rest-screen.tsx`            | Grid shell for the rest state: header → next-exercise media → centered next-exercise info → rest countdown with two symmetric buttons → auto-transition note. |
| `tests/component/live-countdown-ring.test.tsx`            | Ring geometry, tone, and the no-fake-progress rule.                                                                                                           |
| `tests/component/live-coaching-panel.test.tsx`            | Coaching panel content and scroll-affordance tests.                                                                                                           |
| `tests/component/live-active-screen.test.tsx`             | Active screen structure, timer, and camera-gating tests.                                                                                                      |
| `tests/component/live-rest-screen.test.tsx`               | Rest screen structure, countdown, and button tests.                                                                                                           |
| `tests/unit/session-position.test.ts`                     | Session-wide exercise counting.                                                                                                                               |

### Modified

| File                                                     | Change                                                                                    |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/features/workout/model/live-session.types.ts`       | Add `breathingCue?: string` to `LiveExercise`.                                            |
| `src/features/exercise/domain/exercise.ts`               | Add `breathingCue?: string` to `ExerciseSummary`.                                         |
| `src/shared/mock/exercises.ts`                           | Add `breathingCue` to every entry.                                                        |
| `src/features/workout/server/get-mock-live-session.ts`   | Pass `breathingCue` through `toLiveExercise`.                                             |
| `src/features/workout/domain/session-flow.ts`            | Add `sessionPosition` to `SessionStep`; export `totalExerciseCount`.                      |
| `src/features/workout/model/use-live-session.ts`         | Add the `add-set-time` action and keep `restTotalSec` so the rest ring has a denominator. |
| `src/app/(workout)/workouts/live/[sessionId]/page.tsx`   | Replace the raw Tailwind pulse fallback with `LaneSkeleton`.                              |
| `src/features/workout/ui/live/live-workout.tsx`          | Rewritten orchestrator: chooses active vs rest screen, owns sheet + fullscreen state.     |
| `src/features/workout/ui/live/instructions-sheet.tsx`    | Restyled to the new token set; opened by the header "guide" icon.                         |
| `src/features/workout/model/use-live-workout-effects.ts` | Remove the playlist-priming effect and the `audio.play()` call in `startSet`.             |
| `src/app/globals.css`                                    | Delete the orphaned live-workout rules; add the two new screen grids.                     |

### Deleted

`src/features/workout/ui/live/session-shell.tsx`, `exercise-stage.tsx`, `set-timer.tsx`, `rest-view.tsx`, `guide-toggles.tsx`, `music-mini-control.tsx`, `music-sheet.tsx`, `video-guide-overlay.tsx`, `phase-intro.tsx`.

`phase-intro.tsx` is already dead — nothing imports it (`live-workout.tsx` never renders it despite the `"phase-intro"` status existing in the reducer).

### Untouched (reused as-is)

`camera-stage.tsx`, `pose-overlay.tsx`, `calibration-view.tsx`, `end-session-dialog.tsx`, `workout-summary-view.tsx`, and everything under `domain/`, `model/` (except the one effects edit), and `server/`.

---

### Task 0: Feature branch

- [ ] **Step 1: Confirm the tree is clean and branch off main**

The repo currently has an unrelated deletion in the working tree (`tests/component/profile-setup.test.tsx`) and a missing `src/features/progress/` module that already breaks `pnpm typecheck`. Do not fix those here — they are out of scope. Just note the baseline.

```bash
cd /c/Users/chien/Desktop/persional/fitai-web
git status --short
git checkout -b feat/live-workout-ui
```

- [ ] **Step 2: Record the baseline typecheck failures**

Run: `pnpm typecheck`
Expected: FAIL with exactly **seven** errors. They are pre-existing; every later task must not add to this list:

```
.next/dev/types/validator.ts(107,39): TS2307  missing src/app/(main)/profile/progress/page.js
.next/types/validator.ts(107,39):     TS2307  same, other build dir
src/features/roadmap/ui/roadmap-view.tsx(1,38): TS2307  missing @/features/progress/model/progress-aggregator
src/features/roadmap/ui/roadmap-view.tsx(2,39): TS2307  missing @/features/progress/ui/roadmap-progress-banner
src/shared/ui/charts/__probe.tsx(9,3):  TS2769  chart spec overload
src/shared/ui/charts/__probe.tsx(12,3): TS2769  chart spec overload
tests/unit/progress-aggregator.test.ts(8,8): TS2307  missing @/features/progress/model/progress-aggregator
```

- [ ] **Step 3: Record the baseline test run**

Run: `pnpm test`
Expected: **20 test files passed, 1 test file failed to load** (`tests/unit/progress-aggregator.test.ts`, transform error from the same missing module), **109 tests passed, 0 test failures**.

Later tasks compare against exactly this. An eighth typecheck error or a second failing file is a regression this plan introduced; fixing the seven and the one is out of scope.

---

### Task 1: Session-wide exercise position

**Files:**

- Modify: `src/features/workout/domain/session-flow.ts:23-68`
- Test: `tests/unit/session-position.test.ts`

**Interfaces:**

- Consumes: `LiveSessionPlan`, `SessionPhase` from `@/features/workout/model/live-session.types`.
- Produces:
  - `SessionStep.sessionPosition: number` — 1-based position of this exercise across the whole session (warm-ups, then main, then cooldowns).
  - `totalExerciseCount(plan: LiveSessionPlan): number`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/session-position.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { buildTimeline, totalExerciseCount } from "@/features/workout/domain/session-flow";
import type { LiveExercise, LiveSessionPlan } from "@/features/workout/model/live-session.types";

function exercise(id: string, phase: LiveExercise["phase"], sets: number): LiveExercise {
  return {
    commonMistakes: [],
    durationSeconds: 0,
    equipmentId: "eq-bodyweight",
    exerciseId: id,
    formCues: [],
    hasAiSupported: false,
    isWeighted: false,
    name: id,
    notes: "",
    phase,
    restExerciseSec: 45,
    restSetSec: 30,
    targetReps: 10,
    targetRpe: 6,
    targetSets: sets,
    targetWeightKg: 0,
  };
}

const plan = {
  coolDowns: [exercise("c1", "cooldown", 1)],
  durationWarnMin: 90,
  estimatedDurationMin: 30,
  mainExercises: [exercise("m1", "main", 2), exercise("m2", "main", 1)],
  motionSpecs: {},
  personalRecords: {},
  playlists: [],
  recentAvgVolumeKg: 0,
  sessionId: "s1",
  sessionPlanId: "sp1",
  targetRpe: 6,
  title: "Test",
  warmUps: [exercise("w1", "warmup", 1)],
} satisfies LiveSessionPlan;

describe("totalExerciseCount", () => {
  it("counts every exercise across all three phases", () => {
    expect(totalExerciseCount(plan)).toBe(4);
  });
});

describe("SessionStep.sessionPosition", () => {
  it("numbers exercises continuously across phases, not per phase", () => {
    const timeline = buildTimeline(plan);
    const positions = timeline.map((step) => `${step.exercise.exerciseId}:${step.sessionPosition}`);

    expect(positions).toEqual(["w1:1", "m1:2", "m1:2", "m2:3", "c1:4"]);
  });

  it("keeps the existing phase-relative exercisePosition intact", () => {
    const timeline = buildTimeline(plan);
    const m2 = timeline.find((step) => step.exercise.exerciseId === "m2");

    expect(m2?.exercisePosition).toBe(2);
    expect(m2?.sessionPosition).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/session-position.test.ts`
Expected: FAIL — `totalExerciseCount is not a function` and `sessionPosition` is `undefined`.

- [ ] **Step 3: Implement**

In `src/features/workout/domain/session-flow.ts`, add to the `SessionStep` type (after the `exercisePosition` field at line 29):

```ts
/** 1-based position of this exercise across the whole session, all phases combined. */
sessionPosition: number;
```

Replace the body of `buildTimeline` (lines 47-68) with:

```ts
export function buildTimeline(plan: LiveSessionPlan): SessionStep[] {
  const steps: SessionStep[] = [];
  let sessionPosition = 0;

  for (const phase of PHASE_ORDER) {
    const exercises = exercisesOfPhase(plan, phase);
    exercises.forEach((exercise, exerciseIndex) => {
      sessionPosition += 1;
      const sets = Math.max(1, exercise.targetSets);
      for (let setNumber = 1; setNumber <= sets; setNumber += 1) {
        steps.push({
          index: steps.length,
          phase,
          exercise,
          exercisePosition: exerciseIndex + 1,
          sessionPosition,
          setNumber,
          isLastSetOfExercise: setNumber === sets,
        });
      }
    });
  }

  return steps;
}
```

Add after `flattenPlan` (line 38):

```ts
/** How many exercises the session contains in total — the "of 8" in "Exercise 2 of 8". */
export function totalExerciseCount(plan: LiveSessionPlan): number {
  return flattenPlan(plan).length;
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/unit/session-position.test.ts tests/unit/session-flow.test.ts`
Expected: PASS, both files.

- [ ] **Step 5: Commit**

```bash
git add src/features/workout/domain/session-flow.ts tests/unit/session-position.test.ts
git commit -m "[AI] feat(workout): add session-wide exercise position to the timeline"
```

---

### Task 2: Breathing cue data field

**Files:**

- Modify: `src/features/exercise/domain/exercise.ts:27-43`
- Modify: `src/features/workout/model/live-session.types.ts:13-43`
- Modify: `src/shared/mock/exercises.ts` (every entry)
- Modify: `src/features/workout/server/get-mock-live-session.ts:52-72`
- Test: `tests/unit/breathing-cue.test.ts`

**Interfaces:**

- Produces: `LiveExercise.breathingCue?: string` and `ExerciseSummary.breathingCue?: string`. Consumed by the coaching panel in Task 6.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/breathing-cue.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { MOCK_EXERCISES } from "@/shared/mock/exercises";

describe("mock exercise catalogue", () => {
  it("gives every exercise a breathing cue so the coaching panel is never half-empty", () => {
    const missing = MOCK_EXERCISES.filter((exercise) => !exercise.breathingCue?.trim());

    expect(missing.map((exercise) => exercise.id)).toEqual([]);
  });

  it("keeps breathing cues to a single short sentence for mobile readability", () => {
    for (const exercise of MOCK_EXERCISES) {
      expect(exercise.breathingCue!.length).toBeLessThanOrEqual(90);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/breathing-cue.test.ts`
Expected: FAIL — `breathingCue` does not exist on `ExerciseSummary` (type error) and every entry is missing.

- [ ] **Step 3: Add the field to both types**

In `src/features/exercise/domain/exercise.ts`, inside `ExerciseSummary`, after `commonMistakes?: string[];`:

```ts
  // NOT IN CONTRACT: supporting.exercise.v1.ExerciseInfo has no breathing field yet.
  // Mock-only, same status as formCues / commonMistakes. Add to the proto before wiring gRPC.
  breathingCue?: string;
```

In `src/features/workout/model/live-session.types.ts`, inside `LiveExercise`, after `commonMistakes: string[];` (line 37):

```ts
  // NOT IN CONTRACT: see ExerciseSummary.breathingCue.
  breathingCue?: string;
```

- [ ] **Step 4: Fill in the mock data**

In `src/shared/mock/exercises.ts`, add a `breathingCue` to every entry. Use the exercise's own mechanics — do not paste one string everywhere. Examples for the first three entries:

```ts
  // ex-incline-push-up
  breathingCue: "Inhale as you lower, exhale as you press away.",
  // ex-goblet-squat
  breathingCue: "Breathe in at the top, brace, then exhale on the way up.",
  // ex-supported-row
  breathingCue: "Exhale as you pull the elbow back, inhale on the return.",
```

For any hold or stretch (anything with a `seconds`-based prescription, e.g. `ex-worlds-greatest-stretch`, plank-style entries), use:

```ts
  breathingCue: "Breathe slowly and consistently throughout the exercise.",
```

- [ ] **Step 5: Pass it through the live-session mapper**

In `src/features/workout/server/get-mock-live-session.ts`, inside the object returned by `toLiveExercise` (after `commonMistakes: source.commonMistakes ?? [],` on line 68):

```ts
    breathingCue: source.breathingCue,
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run tests/unit/breathing-cue.test.ts`
Expected: PASS, 2 tests.

Run: `pnpm typecheck`
Expected: the same five pre-existing errors from Task 0, no new ones.

- [ ] **Step 7: Commit**

```bash
git add src/features/exercise/domain/exercise.ts src/features/workout/model/live-session.types.ts src/shared/mock/exercises.ts src/features/workout/server/get-mock-live-session.ts tests/unit/breathing-cue.test.ts
git commit -m "[AI] feat(workout): add breathing cue to the exercise data model"
```

---

### Task 3: Screen shell CSS

**Files:**

- Modify: `src/app/globals.css`

**Interfaces:**

- Produces the class contract every later task styles against:
  - `.live-screen` — `100dvh` grid, no page scroll, bottom safe area
  - `.live-screen__header`, `.live-screen__media`, `.live-screen__meta`, `.live-screen__coach`, `.live-screen__footer` — the five grid rows
  - `.live-screen--rest` — rest variant with a centered `1fr` info row

This task has no unit test; it is verified visually in Task 10 and by the e2e check in Task 11. Keep it a separate commit so the diff is reviewable on its own.

- [ ] **Step 1: Delete the orphaned rules**

Remove these blocks from `src/app/globals.css`. They style components deleted in Task 10 and are duplicated across two regions of the file (roughly lines 1898-1970 and 4346-4600 — search by selector, not by line number, because earlier edits shift them):

`.live-workout`, `.live-workout__header`, `.live-workout__main`, `.live-workout__phase`, `.live-workout__crumbs`, `.live-workout__empty`, `.exercise-stage`, `.exercise-stage__tools`, `.exercise-stage__heading`, `.guide-toggles`, `.guide-toggle`, `.music-mini`, `.music-mini__label`, `.music-mini__buttons`, `.set-stage`, `.set-stage__header`, `.set-stage__goal`, `.set-stage__thumbnail`, `.set-stage__circle`, `.set-stage__label`, `.set-stage__timer`, `.set-stage__actions`, `.set-stage__skip`, `.rest-view`, `.rest-view__card`, `.rest-view__label`, `.rest-view__actions`, `.rest-view__add`.

Keep `.workout-close`, `.workout-progress`, `.workout-progress__fill`, `.cue-caption`, `.cue-list*`, `.camera-stage*`, and every `.workout-prep-*` rule — those are still in use.

- [ ] **Step 2: Add the new shell**

Append to `src/app/globals.css`:

```css
/* ---------------------------------------------------------------------------
   Live workout screens — fixed-height, mobile-first.
   The document never scrolls; only .live-screen__coach does.

   Height budget at 390x844 with a 156px ring and a 34px home indicator:
     header 48 + media 200 + meta 44 + footer 156 + note 0
     + 4 gaps (48) + padding (12) + safe area (34) = 542
     leaving ~300px for the coaching panel. At 375x667 it still clears ~180px.
   Media is the shock absorber — shrink it before anything else.
   --------------------------------------------------------------------------- */

.live-screen {
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  background: var(--color-canvas);
  /* DESIGN.md: 20px mobile gutters. */
  padding-inline: var(--space-5);
  padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  gap: var(--space-3);
}

.live-screen__header {
  display: grid;
  /* 48px matches .workout-close (3rem) — PRODUCT.md's mobile touch floor. */
  grid-template-columns: 3rem 1fr auto;
  align-items: center;
  gap: var(--space-2);
  min-height: 3rem;
}

.live-screen__title {
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  text-align: center;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.live-screen__actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.live-screen__media {
  position: relative;
  height: clamp(140px, 24dvh, 220px);
  border-radius: var(--radius-hero);
  overflow: hidden;
  background: var(--color-surface-subtle);
}

.live-screen__coach {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  /* Room for the 3px-offset global focus ring, which .live-screen clips. */
  padding-inline: 3px;
  margin-inline: -3px;
}

.live-screen__footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-2);
}

/* Rest variant: header, media, centered info, ring block, auto-transition note. */
.live-screen--rest {
  grid-template-rows: auto auto minmax(0, 1fr) auto auto;
}
```

- [ ] **Step 3: Stop the document scrolling on the live route**

Also append:

```css
body:has(.live-screen) {
  overflow: hidden;
  overscroll-behavior: none;
}
```

- [ ] **Step 4: Verify formatting and lint**

Run: `pnpm exec oxfmt <the files you touched>` — never bare `pnpm format`
Run: `pnpm lint`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "[AI] refactor(workout): replace live-workout css with fixed-height screen shell"
```

---

### Task 4: SessionHeader

**Files:**

- Create: `src/features/workout/ui/live/session-header.tsx`
- Test: `tests/component/live-session-header.test.tsx`

**Interfaces:**

- Produces:
  ```ts
  export type HeaderAction = {
    key: string;
    label: string; // accessible name
    icon: ReactNode;
    active?: boolean; // renders the pressed/on state
    onClick: () => void;
  };

  export function SessionHeader(props: {
    title: string;
    onBack: () => void;
    actions: HeaderAction[]; // max 3, rendered right-to-left in array order
  }): JSX.Element;
  ```
- Consumed by Task 8 (active screen) and Task 9 (rest screen).

- [ ] **Step 1: Write the failing test**

Create `tests/component/live-session-header.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionHeader } from "@/features/workout/ui/live/session-header";

afterEach(cleanup);

describe("SessionHeader", () => {
  it("shows the title in the centre and a back button on the left", () => {
    render(<SessionHeader actions={[]} onBack={vi.fn()} title="Plank Hold" />);

    expect(screen.getByText("Plank Hold")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("calls onBack when the back button is pressed", () => {
    const onBack = vi.fn();
    render(<SessionHeader actions={[]} onBack={onBack} title="Plank Hold" />);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("renders each action with its accessible name and wires its handler", () => {
    const onGuide = vi.fn();
    render(
      <SessionHeader
        actions={[
          { icon: <span />, key: "guide", label: "Exercise guide", onClick: onGuide },
          { icon: <span />, key: "voice", label: "Voice guide", onClick: vi.fn() },
          { icon: <span />, key: "full", label: "Fullscreen", onClick: vi.fn() },
        ]}
        onBack={vi.fn()}
        title="Plank Hold"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Exercise guide" }));

    expect(onGuide).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Voice guide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
  });

  it("marks an active action with aria-pressed so the on-state is announced", () => {
    render(
      <SessionHeader
        actions={[
          { active: true, icon: <span />, key: "voice", label: "Voice guide", onClick: vi.fn() },
        ]}
        onBack={vi.fn()}
        title="Plank Hold"
      />,
    );

    expect(screen.getByRole("button", { name: "Voice guide" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/component/live-session-header.test.tsx`
Expected: FAIL — cannot resolve `@/features/workout/ui/live/session-header`.

- [ ] **Step 3: Implement**

Create `src/features/workout/ui/live/session-header.tsx`:

```tsx
"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export type HeaderAction = {
  key: string;
  /** Accessible name — icon-only buttons have no visible text. */
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
};

export function SessionHeader({
  actions,
  onBack,
  title,
}: {
  title: string;
  onBack: () => void;
  actions: HeaderAction[];
}) {
  return (
    <header className="live-screen__header">
      <button aria-label="Back" className="workout-close" onClick={onBack} type="button">
        <ArrowLeft aria-hidden="true" size={20} />
      </button>

      <h1 className="live-screen__title">{title}</h1>

      <div className="live-screen__actions">
        {actions.slice(0, 3).map((action) => (
          <button
            aria-label={action.label}
            aria-pressed={action.active === undefined ? undefined : action.active}
            className="workout-close"
            key={action.key}
            onClick={action.onClick}
            type="button"
          >
            {action.icon}
          </button>
        ))}
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/component/live-session-header.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/workout/ui/live/session-header.tsx tests/component/live-session-header.test.tsx
git commit -m "[AI] feat(workout): add live session header component"
```

---

### Task 5: ExerciseMedia

**Files:**

- Create: `src/features/workout/ui/live/exercise-media.tsx`
- Test: `tests/component/live-exercise-media.test.tsx`

**Interfaces:**

- Consumes: `LiveExercise` (Task 2), `CameraStage` from `@/features/workout/ui/live/camera-stage`.
- Produces:
  ```ts
  export function ExerciseMedia(props: {
    exercise: LiveExercise;
    /** Renders inside the media frame instead of the video/poster — the live camera. */
    children?: ReactNode;
    /** Omit to hide the camera button entirely. */
    onOpenCamera?: () => void;
    cameraActive?: boolean;
  }): JSX.Element;
  ```
- Consumed by Tasks 8 and 9.

The camera button appears **only** when `exercise.hasAiSupported` is true _and_ `onOpenCamera` is supplied — that is the spec's "bài nào có AI supported mới có".

- [ ] **Step 1: Write the failing test**

Create `tests/component/live-exercise-media.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { ExerciseMedia } from "@/features/workout/ui/live/exercise-media";

afterEach(cleanup);

function makeExercise(overrides: Partial<LiveExercise> = {}): LiveExercise {
  return {
    commonMistakes: [],
    durationSeconds: 30,
    equipmentId: "eq-bodyweight",
    exerciseId: "ex-plank",
    formCues: [],
    hasAiSupported: true,
    isWeighted: false,
    name: "Plank Hold",
    notes: "",
    phase: "main",
    restExerciseSec: 45,
    restSetSec: 30,
    targetReps: 0,
    targetRpe: 6,
    targetSets: 3,
    targetWeightKg: 0,
    ...overrides,
  };
}

describe("ExerciseMedia", () => {
  it("plays the demo video when the exercise has one", () => {
    const { container } = render(
      <ExerciseMedia exercise={makeExercise({ videoUrl: "/demo/plank.mp4" })} />,
    );

    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", "/demo/plank.mp4");
  });

  it("falls back to the thumbnail when there is no video", () => {
    render(
      <ExerciseMedia
        exercise={makeExercise({ thumbnailUrl: "/demo/plank.jpg", videoUrl: undefined })}
      />,
    );

    expect(screen.getByRole("img", { name: "Plank Hold" })).toHaveAttribute(
      "src",
      "/demo/plank.jpg",
    );
  });

  it("falls back to the exercise initial when there is neither video nor thumbnail", () => {
    render(<ExerciseMedia exercise={makeExercise()} />);

    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("shows the camera button for AI-supported exercises", () => {
    render(<ExerciseMedia exercise={makeExercise()} onOpenCamera={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Open AI camera" })).toBeInTheDocument();
  });

  it("hides the camera button when the exercise has no AI support", () => {
    render(
      <ExerciseMedia exercise={makeExercise({ hasAiSupported: false })} onOpenCamera={vi.fn()} />,
    );

    expect(screen.queryByRole("button", { name: "Open AI camera" })).not.toBeInTheDocument();
  });

  it("hides the camera button when no handler is supplied", () => {
    render(<ExerciseMedia exercise={makeExercise()} />);

    expect(screen.queryByRole("button", { name: "Open AI camera" })).not.toBeInTheDocument();
  });

  it("renders children instead of the poster when the camera is live", () => {
    render(
      <ExerciseMedia cameraActive exercise={makeExercise({ videoUrl: "/demo/plank.mp4" })}>
        <div data-testid="camera" />
      </ExerciseMedia>,
    );

    expect(screen.getByTestId("camera")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/component/live-exercise-media.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/features/workout/ui/live/exercise-media.tsx`:

```tsx
"use client";

import { Camera } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";

/** True when the OS asks for reduced motion. Read after mount so SSR stays stable. */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // jsdom does not implement matchMedia, and neither do very old browsers.
    // Absent the query we assume motion is fine — the loop is the guidance.
    if (typeof window.matchMedia !== "function") return;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function ExerciseMedia({
  cameraActive = false,
  children,
  exercise,
  onOpenCamera,
}: {
  exercise: LiveExercise;
  children?: ReactNode;
  onOpenCamera?: () => void;
  cameraActive?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const showCameraButton = Boolean(onOpenCamera) && exercise.hasAiSupported;

  return (
    <div className="live-screen__media">
      {cameraActive && children ? (
        children
      ) : exercise.videoUrl ? (
        <video
          // The demo loop is the guidance itself, so it plays on sight — but a
          // user who asked the OS for less motion gets the poster frame instead.
          autoPlay={!reducedMotion}
          className="live-media__video"
          loop
          muted
          playsInline
          poster={exercise.thumbnailUrl}
          src={exercise.videoUrl}
        />
      ) : exercise.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- demo assets are remote/unsized
        <img alt={exercise.name} className="live-media__poster" src={exercise.thumbnailUrl} />
      ) : (
        <div className="live-media__fallback" aria-hidden="true">
          <span>{exercise.name.charAt(0)}</span>
        </div>
      )}

      {showCameraButton ? (
        <button
          aria-label="Open AI camera"
          aria-pressed={cameraActive}
          className="live-media__camera"
          onClick={onOpenCamera}
          type="button"
        >
          <Camera aria-hidden="true" size={18} />
        </button>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Add the media styles**

Append to `src/app/globals.css`:

```css
.live-media__video,
.live-media__poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.live-media__fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

/* The one floating element on these screens: it genuinely sits above the media.
   Solid surface, never a translucent scrim — DESIGN.md rules out glassmorphism. */
.live-media__camera {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border: none;
  border-radius: var(--radius-round);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-float);
  cursor: pointer;
  transition:
    background-color var(--duration-state) var(--ease-standard),
    color var(--duration-state) var(--ease-standard),
    transform var(--duration-press) var(--ease-standard);
}

.live-media__camera:active {
  transform: scale(0.985);
}

/* Blue, not Coral: this is an interaction affordance, not effort state. */
.live-media__camera[aria-pressed="true"] {
  background: var(--color-action);
  color: var(--ref-clear-white);
}

@media (prefers-reduced-motion: reduce) {
  .live-media__camera {
    transition: none;
  }

  .live-media__camera:active {
    transform: none;
  }
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/component/live-exercise-media.test.tsx`
Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
git add src/features/workout/ui/live/exercise-media.tsx tests/component/live-exercise-media.test.tsx src/app/globals.css
git commit -m "[AI] feat(workout): add exercise media preview with AI camera gate"
```

---

### Task 6: ExerciseMetaRow

**Files:**

- Create: `src/features/workout/ui/live/exercise-meta-row.tsx`
- Test: `tests/component/live-exercise-meta-row.test.tsx`

**Interfaces:**

- Produces:

  ```ts
  export function ExerciseMetaRow(props: {
    name: string;
    /** "30 sec" for a hold, "10 reps" for a rep-based set. */
    target: string;
    currentSet: number;
    totalSets: number;
  }): JSX.Element;
  ```

- [ ] **Step 1: Write the failing test**

Create `tests/component/live-exercise-meta-row.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ExerciseMetaRow } from "@/features/workout/ui/live/exercise-meta-row";

afterEach(cleanup);

describe("ExerciseMetaRow", () => {
  it("shows the exercise name and its target on the left", () => {
    render(<ExerciseMetaRow currentSet={1} name="Plank Hold" target="30 sec" totalSets={3} />);

    expect(screen.getByText("Plank Hold")).toBeInTheDocument();
    expect(screen.getByText("30 sec")).toBeInTheDocument();
  });

  it("shows the set counter on the right in 'n / total Sets' form", () => {
    render(<ExerciseMetaRow currentSet={1} name="Plank Hold" target="30 sec" totalSets={3} />);

    expect(screen.getByText("1 / 3 Sets")).toBeInTheDocument();
  });

  it("uses the singular label for a one-set prescription", () => {
    render(<ExerciseMetaRow currentSet={1} name="Plank Hold" target="30 sec" totalSets={1} />);

    expect(screen.getByText("1 / 1 Set")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/component/live-exercise-meta-row.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/features/workout/ui/live/exercise-meta-row.tsx`:

```tsx
export function ExerciseMetaRow({
  currentSet,
  name,
  target,
  totalSets,
}: {
  name: string;
  target: string;
  currentSet: number;
  totalSets: number;
}) {
  return (
    <div className="live-meta">
      <div className="live-meta__col">
        <p className="live-meta__name">{name}</p>
        <p className="live-meta__target">{target}</p>
      </div>

      <div className="live-meta__col live-meta__col--end">
        <p className="live-meta__sets">
          {currentSet} / {totalSets} {totalSets === 1 ? "Set" : "Sets"}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add the styles**

Append to `src/app/globals.css`:

```css
.live-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: var(--space-3);
}

.live-meta__col--end {
  justify-self: end;
  text-align: right;
}

/* An exercise name — display face is correct here. */
.live-meta__name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 680;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: var(--color-text);
}

/* Values that change in place: data face, tabular. */
.live-meta__target,
.live-meta__sets {
  font-family: var(--font-data);
  font-variant-numeric: tabular-nums;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-text-muted);
}

.live-meta__sets {
  font-size: 1rem;
  color: var(--color-text);
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/component/live-exercise-meta-row.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add src/features/workout/ui/live/exercise-meta-row.tsx tests/component/live-exercise-meta-row.test.tsx src/app/globals.css
git commit -m "[AI] feat(workout): add exercise meta row"
```

---

### Task 7: CoachingPanel

**Files:**

- Create: `src/features/workout/ui/live/coaching-panel.tsx`
- Test: `tests/component/live-coaching-panel.test.tsx`

**Interfaces:**

- Consumes: `LiveExercise` (Task 2).
- Produces:
  ```ts
  export function CoachingPanel(props: { exercise: LiveExercise }): JSX.Element;
  ```

Behaviour: renders up to four labelled blocks — Description, Form Tip, Breathing, Common Mistake — skipping any the exercise lacks. Sets `data-scrollable="true"` on the container when content overflows, which is what the CSS fade mask keys off. jsdom reports zero layout, so the test drives the flag by stubbing `scrollHeight`/`clientHeight`.

- [ ] **Step 1: Write the failing test**

Create `tests/component/live-coaching-panel.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { CoachingPanel } from "@/features/workout/ui/live/coaching-panel";

afterEach(cleanup);

function makeExercise(overrides: Partial<LiveExercise> = {}): LiveExercise {
  return {
    breathingCue: "Breathe slowly and consistently throughout the exercise.",
    commonMistakes: ["Avoid letting your hips drop or rise too high."],
    durationSeconds: 30,
    equipmentId: "eq-bodyweight",
    exerciseId: "ex-plank",
    formCues: ["Keep your elbows directly under your shoulders."],
    hasAiSupported: true,
    instructions: "Maintain a straight body line while keeping your core engaged.",
    isWeighted: false,
    name: "Plank Hold",
    notes: "",
    phase: "main",
    restExerciseSec: 45,
    restSetSec: 30,
    targetReps: 0,
    targetRpe: 6,
    targetSets: 3,
    targetWeightKg: 0,
    ...overrides,
  };
}

describe("CoachingPanel", () => {
  it("renders all four coaching blocks with their labels", () => {
    render(<CoachingPanel exercise={makeExercise()} />);

    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Form Tip")).toBeInTheDocument();
    expect(screen.getByText("Breathing")).toBeInTheDocument();
    expect(screen.getByText("Common Mistake")).toBeInTheDocument();
  });

  it("renders the coaching copy itself", () => {
    render(<CoachingPanel exercise={makeExercise()} />);

    expect(
      screen.getByText("Maintain a straight body line while keeping your core engaged."),
    ).toBeInTheDocument();
    expect(screen.getByText("Keep your elbows directly under your shoulders.")).toBeInTheDocument();
    expect(
      screen.getByText("Breathe slowly and consistently throughout the exercise."),
    ).toBeInTheDocument();
    expect(screen.getByText("Avoid letting your hips drop or rise too high.")).toBeInTheDocument();
  });

  it("omits a block the exercise has no data for", () => {
    render(<CoachingPanel exercise={makeExercise({ breathingCue: undefined })} />);

    expect(screen.queryByText("Breathing")).not.toBeInTheDocument();
  });

  it("shows only the first form cue and first mistake to keep each block to 1-2 lines", () => {
    render(
      <CoachingPanel
        exercise={makeExercise({
          commonMistakes: ["Hips drop", "Neck cranes forward"],
          formCues: ["Elbows under shoulders", "Squeeze the glutes"],
        })}
      />,
    );

    expect(screen.getByText("Elbows under shoulders")).toBeInTheDocument();
    expect(screen.queryByText("Squeeze the glutes")).not.toBeInTheDocument();
    expect(screen.getByText("Hips drop")).toBeInTheDocument();
    expect(screen.queryByText("Neck cranes forward")).not.toBeInTheDocument();
  });

  it("is reachable by keyboard so its content can be scrolled without a pointer", () => {
    render(<CoachingPanel exercise={makeExercise()} />);

    expect(screen.getByRole("region", { name: "Coaching instructions" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("marks itself scrollable when the content overflows the panel", () => {
    const { container } = render(<CoachingPanel exercise={makeExercise()} />);
    const panel = container.querySelector(".live-screen__coach") as HTMLElement;

    Object.defineProperty(panel, "scrollHeight", { configurable: true, value: 400 });
    Object.defineProperty(panel, "clientHeight", { configurable: true, value: 200 });
    panel.dispatchEvent(new Event("scroll"));

    expect(panel).toHaveAttribute("data-scrollable", "true");
  });

  it("drops the scroll affordance once the panel is scrolled to the bottom", () => {
    const { container } = render(<CoachingPanel exercise={makeExercise()} />);
    const panel = container.querySelector(".live-screen__coach") as HTMLElement;

    Object.defineProperty(panel, "scrollHeight", { configurable: true, value: 400 });
    Object.defineProperty(panel, "clientHeight", { configurable: true, value: 200 });
    Object.defineProperty(panel, "scrollTop", { configurable: true, value: 200 });
    panel.dispatchEvent(new Event("scroll"));

    expect(panel).toHaveAttribute("data-scrollable", "false");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/component/live-coaching-panel.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/features/workout/ui/live/coaching-panel.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";

/** How close to the bottom counts as "there is nothing more to see". */
const BOTTOM_SLACK_PX = 8;

type Block = { label: string; text: string };

function blocksFor(exercise: LiveExercise): Block[] {
  const blocks: Block[] = [];

  if (exercise.instructions?.trim()) {
    blocks.push({ label: "Description", text: exercise.instructions });
  }
  if (exercise.formCues[0]?.trim()) {
    blocks.push({ label: "Form Tip", text: exercise.formCues[0] });
  }
  if (exercise.breathingCue?.trim()) {
    blocks.push({ label: "Breathing", text: exercise.breathingCue });
  }
  if (exercise.commonMistakes[0]?.trim()) {
    blocks.push({ label: "Common Mistake", text: exercise.commonMistakes[0] });
  }

  return blocks;
}

export function CoachingPanel({ exercise }: { exercise: LiveExercise }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);

  const measure = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const remaining = panel.scrollHeight - panel.clientHeight - panel.scrollTop;
    setScrollable(remaining > BOTTOM_SLACK_PX);
  }, []);

  // Re-measure whenever the exercise changes — a shorter description can
  // remove the affordance entirely.
  useEffect(() => {
    measure();
  }, [exercise.exerciseId, measure]);

  return (
    <div
      // A scroll container must be reachable by keyboard, or its content is
      // unreachable for anyone not using a pointer.
      aria-label="Coaching instructions"
      className="live-screen__coach"
      data-scrollable={scrollable}
      onScroll={measure}
      ref={panelRef}
      role="region"
      tabIndex={0}
    >
      <dl className="live-coach">
        {blocksFor(exercise).map((block) => (
          <div className="live-coach__block" key={block.label}>
            <dt className="live-coach__label">{block.label}</dt>
            <dd className="live-coach__text">{block.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

- [ ] **Step 4: Add the fade-mask styles**

Append to `src/app/globals.css`:

```css
.live-coach {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Label style per DESIGN.md: body face at 750, not the display face. */
.live-coach__label {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 750;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.live-coach__text {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  line-height: 1.45;
  color: var(--color-text);
  margin-top: var(--space-1);
}

/* The fade tells the user there is more below without stealing vertical space. */
.live-screen__coach[data-scrollable="true"] {
  mask-image: linear-gradient(
    to bottom,
    #000 0,
    #000 calc(100% - 32px),
    color-mix(in srgb, #000 12%, transparent) 100%
  );
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/component/live-coaching-panel.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/features/workout/ui/live/coaching-panel.tsx tests/component/live-coaching-panel.test.tsx src/app/globals.css
git commit -m "[AI] feat(workout): add scrollable coaching panel with fade affordance"
```

---

### Task 8: CountdownRing

**Files:**

- Create: `src/features/workout/ui/live/countdown-ring.tsx`
- Test: `tests/component/live-countdown-ring.test.tsx`

**Interfaces:**

- Produces:
  ```ts
  export function CountdownRing(props: {
    /** The value shown inside the ring, already formatted ("00:24", "4 / 10"). */
    display: string;
    /**
     * Fraction of the arc still filled, 0–1. Pass null when there is nothing
     * honest to show progress against — the track renders bare, no arc.
     */
    progress: number | null;
    /** Which lane owns this screen. Drives the arc colour. */
    tone: "effort" | "recovery";
    /** Announced to assistive tech in place of the ticking number. */
    label: string;
  }): JSX.Element;
  ```
- Consumed by Tasks 9 (active screen, `tone="effort"`) and 11 (rest screen, `tone="recovery"`).

Design notes that are requirements, not suggestions:

- The arc is the **only** accent on its screen. Coral for `effort`, Green for `recovery`, both from tokens.
- The track is `--color-surface-subtle` (Mist) — DESIGN.md names Mist the inactive progress track.
- Flat: no gradient, no glow, no drop shadow on the ring.
- `progress: null` renders the bare track. A rep-based set with no camera count has no honest denominator, and inventing one would violate PRODUCT.md's ban on unsupported evidence.
- **The number must not be an `aria-live` region.** A polite region on a value that changes every second announces thirty times per set, which makes the screen unusable with a screen reader. The ring exposes a static accessible name via `role="timer"` + `aria-label`; Task 9 handles milestone announcements separately.

- [ ] **Step 1: Write the failing test**

Create `tests/component/live-countdown-ring.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CountdownRing } from "@/features/workout/ui/live/countdown-ring";

afterEach(cleanup);

describe("CountdownRing", () => {
  it("shows the formatted value inside the ring", () => {
    render(<CountdownRing display="00:24" label="Time remaining" progress={0.8} tone="effort" />);

    expect(screen.getByText("00:24")).toBeInTheDocument();
  });

  it("exposes a stable accessible name instead of announcing every tick", () => {
    render(<CountdownRing display="00:24" label="Time remaining" progress={0.8} tone="effort" />);

    const timer = screen.getByRole("timer");
    expect(timer).toHaveAttribute("aria-label", "Time remaining");
    expect(timer).not.toHaveAttribute("aria-live", "polite");
  });

  it("draws the arc proportionally to the progress it is given", () => {
    const { container } = render(
      <CountdownRing display="00:15" label="Time remaining" progress={0.5} tone="effort" />,
    );

    const arc = container.querySelector(".countdown-ring__arc") as SVGCircleElement;
    const circumference = Number(arc.getAttribute("stroke-dasharray"));
    const offset = Number(arc.getAttribute("stroke-dashoffset"));

    expect(offset).toBeCloseTo(circumference * 0.5, 1);
  });

  it("renders a bare track with no arc when progress is unknowable", () => {
    const { container } = render(
      <CountdownRing display="0 / —" label="Reps completed" progress={null} tone="effort" />,
    );

    expect(container.querySelector(".countdown-ring__arc")).toBeNull();
    expect(container.querySelector(".countdown-ring__track")).not.toBeNull();
  });

  it("carries the lane tone as a data attribute so the arc colour is one rule", () => {
    const { container } = render(
      <CountdownRing display="00:20" label="Rest remaining" progress={0.4} tone="recovery" />,
    );

    expect(container.querySelector(".countdown-ring")).toHaveAttribute("data-tone", "recovery");
  });

  it("clamps out-of-range progress rather than drawing a broken arc", () => {
    const { container } = render(
      <CountdownRing display="00:30" label="Time remaining" progress={1.7} tone="effort" />,
    );

    const arc = container.querySelector(".countdown-ring__arc") as SVGCircleElement;
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/component/live-countdown-ring.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/features/workout/ui/live/countdown-ring.tsx`:

```tsx
"use client";

/**
 * The countdown instrument for both live screens.
 *
 * The arc is the single accent its screen is allowed (DESIGN.md, One Leader
 * Rule): Sprint Coral while working, Field Green while recovering. Everything
 * else on the screen stays neutral.
 */

/** Geometry in SVG user units; the element scales via CSS. */
const SIZE = 100;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownRing({
  display,
  label,
  progress,
  tone,
}: {
  display: string;
  progress: number | null;
  tone: "effort" | "recovery";
  label: string;
}) {
  const filled = progress === null ? null : Math.min(1, Math.max(0, progress));

  return (
    <div aria-label={label} className="countdown-ring" data-tone={tone} role="timer">
      <svg aria-hidden="true" className="countdown-ring__svg" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          className="countdown-ring__track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          fill="none"
          r={RADIUS}
          strokeWidth={STROKE}
        />
        {filled === null ? null : (
          <circle
            className="countdown-ring__arc"
            cx={SIZE / 2}
            cy={SIZE / 2}
            fill="none"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
            strokeLinecap="round"
            strokeWidth={STROKE}
          />
        )}
      </svg>

      <span className="countdown-ring__value">{display}</span>
    </div>
  );
}
```

- [ ] **Step 4: Add the styles**

Append to `src/app/globals.css`:

```css
.countdown-ring {
  position: relative;
  display: grid;
  place-items: center;
  width: clamp(7rem, 32vw, 9.75rem);
  aspect-ratio: 1;
}

.countdown-ring__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* Start the arc at twelve o'clock and deplete clockwise. */
  transform: rotate(-90deg);
}

.countdown-ring__track {
  stroke: var(--color-surface-subtle);
}

.countdown-ring__arc {
  transition: stroke-dashoffset var(--duration-state) linear;
}

.countdown-ring[data-tone="effort"] .countdown-ring__arc {
  stroke: var(--color-effort);
}

.countdown-ring[data-tone="recovery"] .countdown-ring__arc {
  stroke: var(--color-recovery);
}

.countdown-ring__value {
  position: relative;
  font-family: var(--font-data);
  font-variant-numeric: tabular-nums;
  font-size: clamp(1.75rem, 8vw, 2.25rem);
  font-weight: 700;
  line-height: 1;
  color: var(--color-text);
}

@media (prefers-reduced-motion: reduce) {
  .countdown-ring__arc {
    transition: none;
  }
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/component/live-countdown-ring.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/features/workout/ui/live/countdown-ring.tsx tests/component/live-countdown-ring.test.tsx src/app/globals.css
git commit -m "[AI] feat(workout): add countdown ring instrument"
```

---

### Task 8b: ActiveTimerBar

**Files:**

- Create: `src/features/workout/ui/live/active-timer-bar.tsx`
- Test: `tests/component/live-active-timer-bar.test.tsx`

**Interfaces:**

- Consumes: `CountdownRing` (Task 8).
- Produces:
  ```ts
  export function ActiveTimerBar(props: {
    /** Already formatted, e.g. "00:30" for a hold or "4 / 10" for tracked reps. */
    display: string;
    /** 0–1 of the set still to go, or null when there is no honest denominator. */
    progress: number | null;
    onDone: () => void;
    onAddTime: () => void;
    /** Seconds the + button adds. Label reads "+{n}s". */
    addSeconds?: number; // default 10
  }): JSX.Element;
  ```

There is **no skip button** on this bar — the spec is explicit. Both flanking buttons are neutral: the Coral arc is the screen's whole accent budget.

- [ ] **Step 1: Write the failing test**

Create `tests/component/live-active-timer-bar.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActiveTimerBar } from "@/features/workout/ui/live/active-timer-bar";

afterEach(cleanup);

describe("ActiveTimerBar", () => {
  it("shows the timer as the dominant element", () => {
    render(<ActiveTimerBar display="00:30" onAddTime={vi.fn()} onDone={vi.fn()} progress={1} />);

    expect(screen.getByText("00:30")).toBeInTheDocument();
  });

  it("offers Done on the left and +10s on the right", () => {
    render(<ActiveTimerBar display="00:30" onAddTime={vi.fn()} onDone={vi.fn()} progress={1} />);

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 10 seconds" })).toBeInTheDocument();
  });

  it("never offers a skip control", () => {
    render(<ActiveTimerBar display="00:30" onAddTime={vi.fn()} onDone={vi.fn()} progress={1} />);

    expect(screen.queryByRole("button", { name: /skip/i })).not.toBeInTheDocument();
  });

  it("wires both handlers", () => {
    const onDone = vi.fn();
    const onAddTime = vi.fn();
    render(<ActiveTimerBar display="00:30" onAddTime={onAddTime} onDone={onDone} progress={1} />);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByRole("button", { name: "Add 10 seconds" }));

    expect(onDone).toHaveBeenCalledOnce();
    expect(onAddTime).toHaveBeenCalledOnce();
  });

  it("names the timer for assistive tech without announcing every tick", () => {
    render(<ActiveTimerBar display="00:30" onAddTime={vi.fn()} onDone={vi.fn()} progress={1} />);

    const timer = screen.getByRole("timer", { name: "Time remaining in this set" });
    expect(timer).toBeInTheDocument();
    expect(timer).not.toHaveAttribute("aria-live", "polite");
  });

  it("passes the set progress straight through to the ring", () => {
    const { container } = render(
      <ActiveTimerBar display="00:15" onAddTime={vi.fn()} onDone={vi.fn()} progress={0.5} />,
    );

    expect(container.querySelector(".countdown-ring__arc")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/component/live-active-timer-bar.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/features/workout/ui/live/active-timer-bar.tsx`:

```tsx
"use client";

import { Check, Plus } from "lucide-react";

import { CountdownRing } from "@/features/workout/ui/live/countdown-ring";

export function ActiveTimerBar({
  addSeconds = 10,
  display,
  onAddTime,
  onDone,
  progress,
}: {
  display: string;
  progress: number | null;
  onDone: () => void;
  onAddTime: () => void;
  addSeconds?: number;
}) {
  return (
    <div className="live-screen__footer">
      <button aria-label="Done" className="live-timerbar__side" onClick={onDone} type="button">
        <Check aria-hidden="true" size={20} />
        <span>Done</span>
      </button>

      <CountdownRing
        display={display}
        label="Time remaining in this set"
        progress={progress}
        tone="effort"
      />

      <button
        aria-label={`Add ${addSeconds} seconds`}
        className="live-timerbar__side"
        onClick={onAddTime}
        type="button"
      >
        <Plus aria-hidden="true" size={20} />
        <span>{addSeconds}s</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Add the styles**

Append to `src/app/globals.css`:

```css
/* Both flanking controls are neutral. The ring arc is the screen's one accent,
   so tinting these would break the One Leader Rule. */
.live-timerbar__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-width: 4rem;
  min-height: 3.5rem;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  background: var(--color-surface);
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.02em;
  color: var(--color-text);
  cursor: pointer;
  transition:
    border-color var(--duration-state) var(--ease-standard),
    background-color var(--duration-state) var(--ease-standard),
    transform var(--duration-press) var(--ease-standard);
}

.live-timerbar__side:hover {
  border-color: var(--color-border-strong);
}

.live-timerbar__side:active {
  transform: scale(0.985);
}

.live-screen__footer > .live-timerbar__side:first-child {
  justify-self: start;
}

.live-screen__footer > .live-timerbar__side:last-child {
  justify-self: end;
}

@media (prefers-reduced-motion: reduce) {
  .live-timerbar__side {
    transition: none;
  }

  .live-timerbar__side:active {
    transform: none;
  }
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/component/live-active-timer-bar.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add src/features/workout/ui/live/active-timer-bar.tsx tests/component/live-active-timer-bar.test.tsx src/app/globals.css
git commit -m "[AI] feat(workout): add active set timer bar"
```

---

### Task 9: ActiveExerciseScreen

**Files:**

- Create: `src/features/workout/ui/live/active-exercise-screen.tsx`
- Test: `tests/component/live-active-screen.test.tsx`

**Interfaces:**

- Consumes: `SessionHeader` + `HeaderAction` (Task 4), `ExerciseMedia` (Task 5), `ExerciseMetaRow` (Task 6), `CoachingPanel` (Task 7), `ActiveTimerBar` (Task 8), `formatClock` from `@/features/workout/model/use-session-timer`.
- Produces:

  ```ts
  export function ActiveExerciseScreen(props: {
    exercise: LiveExercise;
    currentSet: number;
    totalSets: number;
    /** Seconds left on a timed hold. Ignored when the exercise is rep-based. */
    secondsLeft: number;
    /** Live rep count from the motion engine; undefined when tracking is off. */
    repCount?: number;
    cameraActive: boolean;
    /** Undefined hides the camera button (non-AI exercise). */
    onToggleCamera?: () => void;
    onBack: () => void;
    onOpenGuide: () => void;
    onToggleVoice: () => void;
    voiceOn: boolean;
    onToggleFullscreen: () => void;
    onDone: () => void;
    onAddTime: () => void;
    /** The live camera stage, rendered inside the media frame. */
    cameraSlot?: ReactNode;
  }): JSX.Element;
  ```

- [ ] **Step 1: Write the failing test**

Create `tests/component/live-active-screen.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { ActiveExerciseScreen } from "@/features/workout/ui/live/active-exercise-screen";

afterEach(cleanup);

function makeExercise(overrides: Partial<LiveExercise> = {}): LiveExercise {
  return {
    breathingCue: "Breathe slowly and consistently throughout the exercise.",
    commonMistakes: ["Avoid letting your hips drop or rise too high."],
    durationSeconds: 30,
    equipmentId: "eq-bodyweight",
    exerciseId: "ex-plank",
    formCues: ["Keep your elbows directly under your shoulders."],
    hasAiSupported: true,
    instructions: "Maintain a straight body line while keeping your core engaged.",
    isWeighted: false,
    name: "Plank Hold",
    notes: "",
    phase: "main",
    restExerciseSec: 45,
    restSetSec: 30,
    targetReps: 0,
    targetRpe: 6,
    targetSets: 3,
    targetWeightKg: 0,
    ...overrides,
  };
}

const baseProps = {
  cameraActive: false,
  currentSet: 1,
  exercise: makeExercise(),
  onAddTime: vi.fn(),
  onBack: vi.fn(),
  onDone: vi.fn(),
  onOpenGuide: vi.fn(),
  onToggleCamera: vi.fn(),
  onToggleFullscreen: vi.fn(),
  onToggleVoice: vi.fn(),
  secondsLeft: 30,
  totalSets: 3,
  voiceOn: false,
};

describe("ActiveExerciseScreen", () => {
  it("puts the exercise name in the header", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByRole("heading", { name: "Plank Hold" })).toBeInTheDocument();
  });

  it("offers exactly the three header actions from the spec", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByRole("button", { name: "Exercise guide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voice guide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
  });

  it("shows the target and the set counter in the meta row", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByText("30 sec")).toBeInTheDocument();
    expect(screen.getByText("1 / 3 Sets")).toBeInTheDocument();
  });

  it("formats a rep-based prescription as reps, not seconds", () => {
    render(
      <ActiveExerciseScreen
        {...baseProps}
        exercise={makeExercise({ durationSeconds: 0, targetReps: 10 })}
      />,
    );

    expect(screen.getByText("10 reps")).toBeInTheDocument();
  });

  it("counts down the hold in the timer bar", () => {
    render(<ActiveExerciseScreen {...baseProps} secondsLeft={30} />);

    expect(screen.getByText("00:30")).toBeInTheDocument();
  });

  it("shows tracked reps instead of a clock when the motion engine is counting", () => {
    render(
      <ActiveExerciseScreen
        {...baseProps}
        exercise={makeExercise({ durationSeconds: 0, targetReps: 10 })}
        repCount={4}
      />,
    );

    expect(screen.getByText("4 / 10")).toBeInTheDocument();
  });

  it("shows the rep target and no arc when nothing is counting reps", () => {
    const { container } = render(
      <ActiveExerciseScreen
        {...baseProps}
        exercise={makeExercise({ durationSeconds: 0, targetReps: 10 })}
        secondsLeft={0}
      />,
    );

    // Never a frozen 00:00, and never a fabricated progress arc.
    expect(screen.getByText("10 reps")).toBeInTheDocument();
    expect(screen.queryByText("00:00")).not.toBeInTheDocument();
    expect(container.querySelector(".countdown-ring__arc")).toBeNull();
  });

  it("depletes the arc as a timed hold runs down", () => {
    const { container } = render(<ActiveExerciseScreen {...baseProps} secondsLeft={15} />);

    const arc = container.querySelector(".countdown-ring__arc") as SVGCircleElement;
    const circumference = Number(arc.getAttribute("stroke-dasharray"));

    // 15 of 30 seconds left — half the arc is gone.
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBeCloseTo(circumference * 0.5, 1);
  });

  it("renders the coaching blocks", () => {
    render(<ActiveExerciseScreen {...baseProps} />);

    expect(screen.getByText("Form Tip")).toBeInTheDocument();
    expect(screen.getByText("Breathing")).toBeInTheDocument();
  });

  it("reflects the voice toggle state", () => {
    render(<ActiveExerciseScreen {...baseProps} voiceOn />);

    expect(screen.getByRole("button", { name: "Voice guide" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("wires the Done button", () => {
    const onDone = vi.fn();
    render(<ActiveExerciseScreen {...baseProps} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(onDone).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/component/live-active-screen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/features/workout/ui/live/active-exercise-screen.tsx`:

```tsx
"use client";

import { BookOpen, Maximize2, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { formatClock } from "@/features/workout/model/use-session-timer";
import { ActiveTimerBar } from "@/features/workout/ui/live/active-timer-bar";
import { CoachingPanel } from "@/features/workout/ui/live/coaching-panel";
import { ExerciseMedia } from "@/features/workout/ui/live/exercise-media";
import { ExerciseMetaRow } from "@/features/workout/ui/live/exercise-meta-row";
import type { HeaderAction } from "@/features/workout/ui/live/session-header";
import { SessionHeader } from "@/features/workout/ui/live/session-header";

/** "30 sec" for a hold, "10 reps" (plus load when weighted) for a rep-based set. */
function targetLabel(exercise: LiveExercise): string {
  if (exercise.durationSeconds > 0) return `${exercise.durationSeconds} sec`;
  const reps = `${exercise.targetReps} reps`;
  return exercise.isWeighted ? `${reps} · ${exercise.targetWeightKg} kg` : reps;
}

export function ActiveExerciseScreen({
  cameraActive,
  cameraSlot,
  currentSet,
  exercise,
  onAddTime,
  onBack,
  onDone,
  onOpenGuide,
  onToggleCamera,
  onToggleFullscreen,
  onToggleVoice,
  repCount,
  secondsLeft,
  totalSets,
  voiceOn,
}: {
  exercise: LiveExercise;
  currentSet: number;
  totalSets: number;
  secondsLeft: number;
  repCount?: number;
  cameraActive: boolean;
  onToggleCamera?: () => void;
  onBack: () => void;
  onOpenGuide: () => void;
  onToggleVoice: () => void;
  voiceOn: boolean;
  onToggleFullscreen: () => void;
  onDone: () => void;
  onAddTime: () => void;
  cameraSlot?: ReactNode;
}) {
  const actions: HeaderAction[] = [
    {
      icon: <BookOpen aria-hidden="true" size={18} />,
      key: "guide",
      label: "Exercise guide",
      onClick: onOpenGuide,
    },
    {
      active: voiceOn,
      icon: voiceOn ? (
        <Volume2 aria-hidden="true" size={18} />
      ) : (
        <VolumeX aria-hidden="true" size={18} />
      ),
      key: "voice",
      label: "Voice guide",
      onClick: onToggleVoice,
    },
    {
      icon: <Maximize2 aria-hidden="true" size={18} />,
      key: "fullscreen",
      label: "Fullscreen",
      onClick: onToggleFullscreen,
    },
  ];

  // Three honest cases, and no fourth:
  //   timed hold          → clock counting down, arc depletes with it
  //   reps + camera count → "4 / 10", arc tracks the count
  //   reps, no camera     → the target itself, bare track. There is no
  //                         denominator to animate against and PRODUCT.md
  //                         forbids inventing evidence, so nothing is faked.
  const timed = exercise.durationSeconds > 0;
  const tracking = !timed && repCount !== undefined && exercise.targetReps > 0;

  const display = timed
    ? formatClock(Math.max(0, secondsLeft))
    : tracking
      ? `${repCount} / ${exercise.targetReps}`
      : `${exercise.targetReps} reps`;

  const progress = timed
    ? exercise.durationSeconds > 0
      ? Math.max(0, secondsLeft) / exercise.durationSeconds
      : null
    : tracking
      ? repCount! / exercise.targetReps
      : null;

  return (
    <div className="live-screen">
      <SessionHeader actions={actions} onBack={onBack} title={exercise.name} />

      <ExerciseMedia cameraActive={cameraActive} exercise={exercise} onOpenCamera={onToggleCamera}>
        {cameraSlot}
      </ExerciseMedia>

      <ExerciseMetaRow
        currentSet={currentSet}
        name={exercise.name}
        target={targetLabel(exercise)}
        totalSets={totalSets}
      />

      <CoachingPanel exercise={exercise} />

      <ActiveTimerBar display={display} onAddTime={onAddTime} onDone={onDone} progress={progress} />
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/component/live-active-screen.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/workout/ui/live/active-exercise-screen.tsx tests/component/live-active-screen.test.tsx
git commit -m "[AI] feat(workout): add active exercise screen"
```

---

### Task 10: RestScreen

**Files:**

- Create: `src/features/workout/ui/live/rest-screen.tsx`
- Test: `tests/component/live-rest-screen.test.tsx`

**Interfaces:**

- Consumes: `SessionHeader`/`HeaderAction` (Task 4), `ExerciseMedia` (Task 5), `formatClock`.
- Produces:
  ```ts
  export function RestScreen(props: {
    /** Workout session title — the header title on this screen, not the exercise name. */
    workoutTitle: string;
    nextExercise: LiveExercise;
    /** 1-based, session-wide. */
    exerciseNumber: number;
    totalExercises: number;
    secondsLeft: number;
    /** Full length of this rest, so the ring has a denominator. */
    totalSeconds: number;
    onBack: () => void;
    onToggleVoice: () => void;
    voiceOn: boolean;
    onToggleFullscreen: () => void;
    onAddTime: () => void;
    onSkipRest: () => void;
    /** Undefined hides the camera button (next exercise has no AI support). */
    onToggleCamera?: () => void;
    cameraActive?: boolean;
    /** Live camera preview, rendered inside the media frame during rest. */
    cameraSlot?: ReactNode;
  }): JSX.Element;
  ```

Note the header here has **two** actions (Audio Guide, Fullscreen) — no guide icon, per the spec.

- [ ] **Step 1: Write the failing test**

Create `tests/component/live-rest-screen.test.tsx`:

```tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { RestScreen } from "@/features/workout/ui/live/rest-screen";

afterEach(cleanup);

function makeExercise(overrides: Partial<LiveExercise> = {}): LiveExercise {
  return {
    commonMistakes: [],
    durationSeconds: 0,
    equipmentId: "eq-bodyweight",
    exerciseId: "ex-russian-twist",
    formCues: [],
    hasAiSupported: true,
    isWeighted: false,
    name: "Russian Twist",
    notes: "",
    phase: "main",
    restExerciseSec: 45,
    restSetSec: 20,
    targetReps: 10,
    targetRpe: 6,
    targetSets: 3,
    targetWeightKg: 0,
    ...overrides,
  };
}

const baseProps = {
  exerciseNumber: 2,
  nextExercise: makeExercise(),
  onAddTime: vi.fn(),
  onBack: vi.fn(),
  onSkipRest: vi.fn(),
  onToggleFullscreen: vi.fn(),
  onToggleVoice: vi.fn(),
  secondsLeft: 20,
  totalExercises: 8,
  totalSeconds: 45,
  voiceOn: false,
  workoutTitle: "Full Body Beginner",
};

describe("RestScreen", () => {
  it("shows the workout name in the header, not the exercise name", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByRole("heading", { name: "Full Body Beginner" })).toBeInTheDocument();
  });

  it("offers only the audio and fullscreen header actions", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByRole("button", { name: "Voice guide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fullscreen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exercise guide" })).not.toBeInTheDocument();
  });

  it("badges the upcoming exercise and names it", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByText("Next Exercise")).toBeInTheDocument();
    expect(screen.getByText("Russian Twist")).toBeInTheDocument();
  });

  it("states the rep prescription", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByText("10 Reps")).toBeInTheDocument();
  });

  it("states a time prescription in seconds when the next exercise is a hold", () => {
    render(
      <RestScreen
        {...baseProps}
        nextExercise={makeExercise({ durationSeconds: 30, targetReps: 0 })}
      />,
    );

    expect(screen.getByText("30 Seconds")).toBeInTheDocument();
  });

  it("shows the session-wide progress line", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByText("Exercise 2 of 8")).toBeInTheDocument();
  });

  it("labels and shows the rest countdown", () => {
    render(<RestScreen {...baseProps} />);

    expect(screen.getByText("Rest Time Remaining")).toBeInTheDocument();
    expect(screen.getByText("00:20")).toBeInTheDocument();
  });

  it("offers +10 Seconds and Skip Rest as two equal buttons", () => {
    const onAddTime = vi.fn();
    const onSkipRest = vi.fn();
    render(<RestScreen {...baseProps} onAddTime={onAddTime} onSkipRest={onSkipRest} />);

    fireEvent.click(screen.getByRole("button", { name: "+10 Seconds" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip Rest" }));

    expect(onAddTime).toHaveBeenCalledOnce();
    expect(onSkipRest).toHaveBeenCalledOnce();
  });

  it("explains the automatic transition", () => {
    render(<RestScreen {...baseProps} />);

    expect(
      screen.getByText("The next exercise will start automatically when the timer reaches zero."),
    ).toBeInTheDocument();
  });

  it("offers a live-preview camera button when the next exercise is AI-supported", () => {
    render(<RestScreen {...baseProps} onToggleCamera={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Open AI camera" })).toBeInTheDocument();
  });

  it("hides the camera button when the next exercise has no AI support", () => {
    render(
      <RestScreen
        {...baseProps}
        nextExercise={makeExercise({ hasAiSupported: false })}
        onToggleCamera={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Open AI camera" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/component/live-rest-screen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/features/workout/ui/live/rest-screen.tsx`:

```tsx
"use client";

import { Maximize2, Plus, SkipForward, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { formatClock } from "@/features/workout/model/use-session-timer";
import { CountdownRing } from "@/features/workout/ui/live/countdown-ring";
import { ExerciseMedia } from "@/features/workout/ui/live/exercise-media";
import type { HeaderAction } from "@/features/workout/ui/live/session-header";
import { SessionHeader } from "@/features/workout/ui/live/session-header";

/** "10 Reps" or "30 Seconds" — title-cased, matching the rest-screen copy. */
function prescriptionLabel(exercise: LiveExercise): string {
  if (exercise.durationSeconds > 0) return `${exercise.durationSeconds} Seconds`;
  return `${exercise.targetReps} Reps`;
}

export function RestScreen({
  cameraActive = false,
  cameraSlot,
  exerciseNumber,
  nextExercise,
  onAddTime,
  onBack,
  onSkipRest,
  onToggleCamera,
  onToggleFullscreen,
  onToggleVoice,
  secondsLeft,
  totalExercises,
  totalSeconds,
  voiceOn,
  workoutTitle,
}: {
  workoutTitle: string;
  nextExercise: LiveExercise;
  exerciseNumber: number;
  totalExercises: number;
  secondsLeft: number;
  /** Full length of this rest, so the ring has a denominator. 0 hides the arc. */
  totalSeconds: number;
  onBack: () => void;
  onToggleVoice: () => void;
  voiceOn: boolean;
  onToggleFullscreen: () => void;
  onAddTime: () => void;
  onSkipRest: () => void;
  onToggleCamera?: () => void;
  cameraActive?: boolean;
  cameraSlot?: ReactNode;
}) {
  const actions: HeaderAction[] = [
    {
      active: voiceOn,
      icon: voiceOn ? (
        <Volume2 aria-hidden="true" size={18} />
      ) : (
        <VolumeX aria-hidden="true" size={18} />
      ),
      key: "voice",
      label: "Voice guide",
      onClick: onToggleVoice,
    },
    {
      icon: <Maximize2 aria-hidden="true" size={18} />,
      key: "fullscreen",
      label: "Fullscreen",
      onClick: onToggleFullscreen,
    },
  ];

  return (
    <div className="live-screen live-screen--rest">
      <SessionHeader actions={actions} onBack={onBack} title={workoutTitle} />

      <ExerciseMedia
        cameraActive={cameraActive}
        exercise={nextExercise}
        onOpenCamera={onToggleCamera}
      >
        {cameraSlot}
      </ExerciseMedia>

      <div className="live-next">
        <span className="live-next__badge">Next Exercise</span>
        <p className="live-next__name">{nextExercise.name}</p>
        <p className="live-next__prescription">{prescriptionLabel(nextExercise)}</p>
        <p className="live-next__progress">
          Exercise {exerciseNumber} of {totalExercises}
        </p>
      </div>

      <div className="live-rest">
        <button
          aria-label="+10 Seconds"
          className="live-timerbar__side"
          onClick={onAddTime}
          type="button"
        >
          <Plus aria-hidden="true" size={20} />
          <span>10s</span>
        </button>

        <div className="live-rest__center">
          <span className="live-rest__label">Rest Time Remaining</span>
          <CountdownRing
            display={formatClock(Math.max(0, secondsLeft))}
            label="Rest time remaining"
            progress={totalSeconds > 0 ? Math.max(0, secondsLeft) / totalSeconds : null}
            tone="recovery"
          />
        </div>

        <button
          aria-label="Skip Rest"
          className="live-timerbar__side"
          onClick={onSkipRest}
          type="button"
        >
          <SkipForward aria-hidden="true" size={20} />
          <span>Skip</span>
        </button>
      </div>

      <p className="live-rest__note">
        The next exercise will start automatically when the timer reaches zero.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Add the styles**

Append to `src/app/globals.css`:

```css
.live-next {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 0;
  text-align: center;
}

/* Neutral, not tinted: Field Green is this screen's one accent and it belongs
   to the ring. A blue pill here would put two leaders on one screen. */
.live-next__badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-round);
  background: var(--color-surface-subtle);
  color: var(--color-text-muted);
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 750;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* The hero of this screen. Display face, capped at DESIGN.md's 2.5rem mobile
   ceiling, tracking at the -0.035em the display style specifies. */
.live-next__name {
  font-family: var(--font-display);
  font-size: clamp(1.625rem, 7.5vw, 2.25rem);
  font-weight: 680;
  line-height: 1.02;
  letter-spacing: -0.035em;
  text-wrap: balance;
  color: var(--color-text);
}

.live-next__prescription {
  font-family: var(--font-data);
  font-variant-numeric: tabular-nums;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.live-next__progress {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.live-rest {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-2);
}

/* Both action buttons are the same size — the spec asks for symmetry. */
.live-rest > .live-timerbar__side:first-child {
  justify-self: start;
}

.live-rest > .live-timerbar__side:last-child {
  justify-self: end;
}

.live-rest__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  justify-self: center;
}

.live-rest__label {
  font-family: var(--font-body);
  font-size: 0.6875rem;
  font-weight: 750;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.live-rest__note {
  font-family: var(--font-body);
  font-size: 0.75rem;
  text-align: center;
  color: var(--color-text-muted);
  padding-top: var(--space-2);
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run tests/component/live-rest-screen.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 6: Commit**

```bash
git add src/features/workout/ui/live/rest-screen.tsx tests/component/live-rest-screen.test.tsx src/app/globals.css
git commit -m "[AI] feat(workout): add rest and next-exercise screen"
```

---

### Task 11: Wire the orchestrator and delete the legacy components

**Files:**

- Modify: `src/features/workout/ui/live/live-workout.tsx` (full rewrite)
- Modify: `src/features/workout/model/use-live-workout-effects.ts:73-79, 134-146`
- Modify: `src/features/workout/ui/live/instructions-sheet.tsx`
- Delete: `session-shell.tsx`, `exercise-stage.tsx`, `set-timer.tsx`, `rest-view.tsx`, `guide-toggles.tsx`, `music-mini-control.tsx`, `music-sheet.tsx`, `video-guide-overlay.tsx`, `phase-intro.tsx`

**Interfaces:**

- Consumes everything produced in Tasks 1, 2, 9, 10, plus the untouched `useLiveSession`, `useLiveWorkoutEffects`, `useAudioCoach`, `useCameraStream`, `useMotionEngine`, `CameraStage`, `InstructionsSheet`.
- Produces: `LiveWorkout({ plan }: { plan: LiveSessionPlan })` — unchanged public signature, so `src/app/(workout)/workouts/live/[sessionId]/page.tsx` needs no edit.

- [ ] **Step 1: Remove the music side-effects**

In `src/features/workout/model/use-live-workout-effects.ts`, delete the playlist-priming block (lines 73-79):

```ts
// --- Audio playlist priming ---
const playlistPrimed = useRef(false);
useEffect(() => {
  if (playlistPrimed.current || audio.playlistId || plan.playlists.length === 0) return;
  playlistPrimed.current = true;
  audio.selectPlaylist(plan.playlists[0]!.id, { autoplay: false });
}, [audio, plan.playlists]);
```

In `startSet` (line 138), delete the line `if (!audio.isPlaying) audio.play();`. The `audio` dependency stays in the array — `playCueByCode` still needs the coach.

- [ ] **Step 2: Rewrite the orchestrator**

Replace the whole of `src/features/workout/ui/live/live-workout.tsx` with:

```tsx
"use client";

import { useCallback, useState } from "react";

import { totalExerciseCount } from "@/features/workout/domain/session-flow";
import type { LiveSessionPlan } from "@/features/workout/model/live-session.types";
import { useAudioCoach } from "@/features/workout/model/use-audio-coach";
import { useCameraStream } from "@/features/workout/model/use-camera-stream";
import { useLiveSession } from "@/features/workout/model/use-live-session";
import { useLiveWorkoutEffects } from "@/features/workout/model/use-live-workout-effects";
import { useMotionEngine } from "@/features/workout/model/use-motion-engine";
import { ActiveExerciseScreen } from "@/features/workout/ui/live/active-exercise-screen";
import { CameraStage } from "@/features/workout/ui/live/camera-stage";
import { InstructionsSheet } from "@/features/workout/ui/live/instructions-sheet";
import { RestScreen } from "@/features/workout/ui/live/rest-screen";
import { toast } from "@/shared/ui/toast";

/** Seconds the "+" button adds — same amount on both screens. */
const ADD_SECONDS = 10;

function toggleFullscreen() {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  void document.documentElement.requestFullscreen?.().catch(() => {
    // iOS Safari has no Fullscreen API on the document element. The screen is
    // already chrome-free, so failing quietly is the right outcome.
  });
}

export function LiveWorkout({ plan }: { plan: LiveSessionPlan }) {
  const session = useLiveSession(plan);
  const audio = useAudioCoach(plan.playlists);
  const camera = useCameraStream();

  const [listening, setListening] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  const motion = useMotionEngine({
    onFallback: (reason) => {
      workoutEffects.setManualForSet(true);
      toast.info(
        reason === "low-light"
          ? "Not enough light to track — switching to manual logging."
          : "Camera tracking stopped — switching to manual logging.",
      );
    },
    onFormError: (error) => workoutEffects.playCueByCode(error.code, listening),
  });

  const workoutEffects = useLiveWorkoutEffects({ audio, camera, motion, plan, session });
  const { cameraBranch, exercise, finishSet, finishSession, step } = workoutEffects;

  const onBack = useCallback(() => void finishSession(true), [finishSession]);
  const onToggleVoice = useCallback(() => setListening((value) => !value), []);

  if (!step || !exercise) {
    return (
      <main className="live-screen live-screen--empty">
        <h1>Wrapping up…</h1>
      </main>
    );
  }

  // `session.step` already points at the *next* step while resting, so
  // `cameraBranch` and `exercise` describe the upcoming exercise on both screens.
  const cameraActive = cameraBranch && cameraOn;
  const cameraStage = cameraActive ? (
    <CameraStage
      alert={Boolean(motion.lastError)}
      onFlip={camera.flip}
      pose={motion.pose}
      state={camera.state}
      videoRef={camera.videoRef}
    />
  ) : null;
  const onToggleCamera = cameraBranch ? () => setCameraOn((value) => !value) : undefined;

  if (session.status === "resting") {
    const next = session.step;
    if (!next) return null;

    return (
      <RestScreen
        cameraActive={cameraActive}
        cameraSlot={cameraStage}
        exerciseNumber={next.sessionPosition}
        nextExercise={next.exercise}
        onAddTime={() => session.actions.addRest(ADD_SECONDS)}
        onBack={onBack}
        onSkipRest={session.actions.endRest}
        onToggleCamera={onToggleCamera}
        onToggleFullscreen={toggleFullscreen}
        onToggleVoice={onToggleVoice}
        secondsLeft={session.restLeft}
        totalExercises={totalExerciseCount(plan)}
        totalSeconds={session.restTotal}
        voiceOn={listening}
        workoutTitle={plan.title}
      />
    );
  }

  return (
    <>
      <ActiveExerciseScreen
        cameraActive={cameraActive}
        cameraSlot={cameraStage}
        currentSet={step.setNumber}
        exercise={exercise}
        onAddTime={() => session.actions.addSetTime(ADD_SECONDS)}
        onBack={onBack}
        onDone={() => finishSet(listening)}
        onOpenGuide={() => setGuideOpen(true)}
        onToggleCamera={onToggleCamera}
        onToggleFullscreen={toggleFullscreen}
        onToggleVoice={onToggleVoice}
        repCount={cameraActive ? motion.repCount : undefined}
        secondsLeft={session.setLeft}
        totalSets={Math.max(1, exercise.targetSets)}
        voiceOn={listening}
      />

      {guideOpen ? (
        <InstructionsSheet exercise={exercise} onClose={() => setGuideOpen(false)} />
      ) : null}
    </>
  );
}
```

- [ ] **Step 3: Handle the `addRest` on the active screen**

`session.actions.addRest` extends the _rest_ clock, not the set clock — on the active screen the `+10s` button must extend the running set instead. Add a `add-set-time` action to the reducer.

In `src/features/workout/model/use-live-session.ts`, add to the `Action` union (after `{ type: "start-set"; durationSeconds: number }`):

```ts
  | { type: "add-set-time"; seconds: number }
```

Add a case to `reducer` (next to `"add-rest"`):

```ts
    case "add-set-time":
      // Only meaningful for a timed hold; a rep-based set has no clock to extend.
      if (state.setEndsAt === null) return state;
      return {
        ...state,
        setEndsAt: Math.max(state.setEndsAt, Date.now()) + action.seconds * 1000,
      };
```

Add the callback next to `addRest` (around line 350):

```ts
const addSetTime = useCallback(
  (seconds: number) => dispatch({ type: "add-set-time", seconds }),
  [],
);
```

Add `addSetTime,` to the returned `actions` object.

The rest ring also needs a denominator, which the state machine currently throws away — `restSecondsAfter(...)` is computed inside `saveSet` and never stored. Keep it:

Add to the `State` type, next to `restEndsAt`:

```ts
/** Full length of the rest currently running, so the ring has a denominator. */
restTotalSec: number;
```

Initialise it to `0` in the `useReducer` initialiser alongside `restEndsAt: null`.

In the `"save-set"` case, set it when the rest starts — inside the branch that returns `status: "resting"`:

```ts
          restTotalSec: action.restSeconds,
```

In the `"add-rest"` case, grow the total as well, or the arc would overflow past a full circle:

```ts
    case "add-rest":
      return {
        ...state,
        restEndsAt: Math.max(state.restEndsAt ?? Date.now(), Date.now()) + action.seconds * 1000,
        restTotalSec: state.restTotalSec + action.seconds,
      };
```

Finally expose it from the hook's return object, next to `restLeft`:

```ts
    restTotal: state.restTotalSec,
```

The `ActiveExerciseScreen` in Step 2 already calls `addSetTime`; this step is what makes that call exist.

- [ ] **Step 4: Add the breathing cue to the instructions sheet**

The header's guide icon opens `InstructionsSheet`, and it must not be missing content the smaller coaching panel shows. In `src/features/workout/ui/live/instructions-sheet.tsx`, insert this section between the "Coach note for today" block and the "Form cues" block (i.e. after line 39, before line 41):

```tsx
{
  exercise.breathingCue ? (
    <section className="detail-section">
      <h3>Breathing</h3>
      <p className="detail-body">{exercise.breathingCue}</p>
    </section>
  ) : null;
}
```

No other change to that file — it already compiles against `LiveExercise` and its `.live-sheet*` / `.detail-*` / `.cue-list*` styles are all in the keep-list from Task 3.

- [ ] **Step 5: Delete the legacy components**

```bash
git rm src/features/workout/ui/live/session-shell.tsx \
       src/features/workout/ui/live/exercise-stage.tsx \
       src/features/workout/ui/live/set-timer.tsx \
       src/features/workout/ui/live/rest-view.tsx \
       src/features/workout/ui/live/guide-toggles.tsx \
       src/features/workout/ui/live/music-mini-control.tsx \
       src/features/workout/ui/live/music-sheet.tsx \
       src/features/workout/ui/live/video-guide-overlay.tsx \
       src/features/workout/ui/live/phase-intro.tsx
```

- [ ] **Step 6: Add the empty-state style**

Append to `src/app/globals.css`:

```css
.live-screen--empty {
  display: grid;
  place-items: center;
  grid-template-rows: none;
}
```

- [ ] **Step 7: Verify nothing still imports the deleted files**

Run: `grep -rn "session-shell\|exercise-stage\|set-timer\|rest-view\|guide-toggles\|music-mini-control\|music-sheet\|video-guide-overlay\|phase-intro" src tests`
Expected: no matches.

- [ ] **Step 8: Typecheck and full test run**

Run: `pnpm typecheck`
Expected: only the five pre-existing errors from Task 0.

Run: `pnpm test`
Expected: all previously passing tests still pass, plus the new ones. If `tests/e2e/core-flow.spec.ts` or any component test asserted on deleted markup, update those assertions to the new structure — do not delete the test.

- [ ] **Step 9: Lint and format**

Run: `pnpm exec oxfmt <the files you touched>` — never bare `pnpm format`
Run: `pnpm lint`
Expected: clean.

- [ ] **Step 10: Commit**

```bash
git add -A src/features/workout src/app/globals.css tests
git commit -m "[AI] refactor(workout): rebuild live session UI on the new screen components"
```

---

### Task 12: Verify the no-scroll requirement end to end

**Files:**

- Create: `tests/e2e/live-workout-layout.spec.ts`

**Interfaces:**

- Consumes the running dev server and the mock session (`getLiveSessionData` returns `getMockLiveSession` whenever `FITAI_RPC_URL` is unset — which is the default).

This is the task that actually proves "user không cần scroll để xem content". The component tests cannot: jsdom has no layout.

- [ ] **Step 1: Find the session id the mock uses**

Run: `grep -n "sessionId" src/features/workout/server/get-mock-live-session.ts`

Use whatever id the mock accepts — `getMockLiveSession(sessionId)` takes the route param, so any id works. Use `demo-session` in the test.

- [ ] **Step 2: Write the failing test**

Create `tests/e2e/live-workout-layout.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

// iPhone 14-ish viewport — the smallest target the spec cares about.
test.use({ viewport: { height: 844, width: 390 } });

test.describe("live workout layout", () => {
  test("the active screen fits the viewport without page scroll", async ({ page }) => {
    await page.goto("/workouts/live/demo-session");
    await page.waitForSelector(".live-screen");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );

    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("only the coaching panel scrolls", async ({ page }) => {
    await page.goto("/workouts/live/demo-session");
    const panel = page.locator(".live-screen__coach");
    await panel.waitFor();

    const canScroll = await panel.evaluate((el) => el.scrollHeight > el.clientHeight);
    const bodyCanScroll = await page.evaluate(
      () => document.body.scrollHeight > document.body.clientHeight,
    );

    expect(bodyCanScroll).toBe(false);
    // The panel may or may not overflow depending on copy length; if it does,
    // the fade affordance must be on.
    if (canScroll) {
      await expect(panel).toHaveAttribute("data-scrollable", "true");
    }
  });

  test("the countdown ring clears the home indicator", async ({ page }) => {
    await page.goto("/workouts/live/demo-session");
    const ring = page.locator(".countdown-ring");
    await ring.waitFor();

    const box = await ring.boundingBox();
    const viewportHeight = page.viewportSize()!.height;

    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThan(viewportHeight);
  });

  test("the ring is the screen's only accent", async ({ page }) => {
    await page.goto("/workouts/live/demo-session");
    await page.waitForSelector(".countdown-ring");

    // Sprint Coral leads the active screen and belongs to the arc alone.
    const coralElements = await page.evaluate(() => {
      const coral = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-effort")
        .trim();
      const toRgb = (value: string) => {
        const probe = document.createElement("span");
        probe.style.color = value;
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };
      const target = toRgb(coral);

      return [...document.querySelectorAll<HTMLElement>(".live-screen *")].filter((el) => {
        const style = getComputedStyle(el);
        return (
          style.backgroundColor === target ||
          style.color === target ||
          style.stroke === target ||
          style.borderTopColor === target
        );
      }).length;
    });

    expect(coralElements).toBe(1);
  });
});
```

- [ ] **Step 3: Run it**

Run: `pnpm test:e2e tests/e2e/live-workout-layout.spec.ts`
Expected: PASS, 3 tests. If the first test fails, the grid rows are over-budget — shrink `.live-screen__media` (`clamp(150px, 26dvh, 260px)`) and re-run. Do not fix it by letting the page scroll.

- [ ] **Step 4: Look at it**

Run: `pnpm run dev`, open `http://localhost:3000/workouts/live/demo-session` in a 390×844 device-emulation viewport, and check by eye:

- the header, media, meta row, coaching block and timer bar are all visible at once;
- the coaching block fades at the bottom edge when it has more content;
- the rest screen appears after tapping Done and shows the next exercise centred;
- the camera button is present on an AI-supported exercise and absent otherwise (`ex-supported-row` has `hasAiSupported: false`).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/live-workout-layout.spec.ts
git commit -m "[AI] test(workout): assert the live screens never scroll the page"
```

---

### Task 13: Replace the loading skeleton

**Files:**

- Modify: `src/app/(workout)/workouts/live/[sessionId]/page.tsx:15-24`

The route's current fallback is three `bg-gray-300 animate-pulse` blocks on a `h-screen` flex centre. That breaks DESIGN.md three ways: it shimmers across the whole screen, it uses raw Tailwind greys instead of tokens, and it has no `aria-busy` boundary. The project already ships the correct primitive.

- [ ] **Step 1: Confirm the primitive**

Read `src/shared/ui/lane-skeleton.tsx`. It renders `<div aria-busy="true" role="status">` with a track and a single travelling marker, plus an `.sr-only` label — exactly what DESIGN.md's "Lane Skeleton" section describes.

- [ ] **Step 2: Swap the fallback**

In `src/app/(workout)/workouts/live/[sessionId]/page.tsx`, delete the whole `LiveWorkoutSkeleton` function and import the shared one:

```tsx
import { LaneSkeleton } from "@/shared/ui/lane-skeleton";
```

Then replace the Suspense fallback:

```tsx
      <Suspense fallback={<LaneSkeleton label="Loading your session" />}>
```

- [ ] **Step 3: Verify**

Run: `pnpm typecheck`
Expected: only the five pre-existing errors.

Run: `grep -n "bg-gray-300\|animate-pulse" src/app/\(workout\)/workouts/live/\[sessionId\]/page.tsx`
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(workout)/workouts/live/[sessionId]/page.tsx"
git commit -m "[AI] fix(workout): use the lane skeleton for the live session fallback"
```

---

### Task 14: Final gate

- [ ] **Step 1: Full verification sweep**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm run build
```

Expected: `typecheck` shows only the five pre-existing errors. `lint` clean. `test` all green. `build` succeeds — note that the pre-existing missing `@/features/progress/*` module will fail the build; if it does, that is the pre-existing breakage from Task 0, not this work. Report it rather than fixing it here.

- [ ] **Step 2: Show the diff and ask for approval before pushing**

```bash
git diff main...HEAD --stat
```

Per the project git rules: show the diff, request approval, and only then push — to the feature branch, never to `main`.

---

## Deferred / Out of Scope

These came up while reading the code and are deliberately **not** in this plan:

- The missing `src/features/progress/` module and the deleted `tests/component/profile-setup.test.tsx` (pre-existing, breaks typecheck and build).
- Adding `breathing_cue`, `form_cues`, and `common_mistakes` to `contracts.supporting.exercise.v1.ExerciseInfo` in the `gym-companion` proto repo.
- The `"phase-intro"` status in the `useLiveSession` reducer, now that `phase-intro.tsx` is gone. The status is unreachable in practice (nothing dispatches `begin-phase`), but ripping it out of the state machine is a separate refactor with its own test surface.
- The `Playlist` / `MusicTrack` types and `useAudioCoach`'s playlist half, now unused by any UI.
- Adding a `.gitattributes` with `*.ts text eol=lf` to stop codegen churn.
