# Exercise catalog taxonomy — test scenarios (Phase 6)

Frontend side of `gym-companion/docs/05_exercise_catalog_refactor_spec.md`. Exercises, profiles and injuries now use the proto enums in `taxonomy_pb.ts` instead of the old body part, equipment, muscle and tag lookup tables.

## Contents

1. [Label map](#1-label-map)
2. [Exercise search and display](#2-exercise-search-and-display)
3. [Admin catalog and the AI support rule](#3-admin-catalog-and-the-ai-support-rule)
4. [Onboarding and profile injuries](#4-onboarding-and-profile-injuries)
5. [Progress, roadmap and ad-hoc labels](#5-progress-roadmap-and-ad-hoc-labels)
6. [Pain report during a live set (§8.7)](#6-pain-report-during-a-live-set-87)

## 1. Label map

File: `unit/taxonomy-labels.test.ts`, covering `src/shared/lib/taxonomy.ts`.

| #   | Scenario                                                   | Expected                                                                                                     |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1.1 | Options are built from the generated enums                 | 17 muscles, 12 equipment, 7 categories, 3 levels, 10 regions, 3 severities, 3 sides; no `UNSPECIFIED` option |
| 1.2 | Labels are humanized, with overrides                       | `LOWER_BACK` → "Lower Back", `EZ_CURL_BAR` → "EZ Curl Bar", `WRIST_HAND` → "Wrist / Hand"                    |
| 1.3 | `UNSPECIFIED`                                              | Empty label; an `UNSPECIFIED` side shows as "Both"                                                           |
| 1.4 | Short codes round-trip                                     | `quadriceps` → `QUADRICEPS`; `ADVANCED` is not a level                                                       |
| 1.5 | Coaching muscle codes (`SessionPlan.target_muscle_groups`) | `CHEST` → "Chest"; unknown tokens pass through unchanged                                                     |

## 2. Exercise search and display

Files: `unit/exercise-grpc-repository.test.ts`, `component/side-inspector-panel.test.tsx`, `component/live-instructions-sheet.test.tsx`, `component/live-exercise-media.test.tsx`, `unit/get-live-session-data.test.ts`.

| #   | Scenario                                            | Expected                                                                                                                                                                   |
| --- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Search with muscle, equipment, level and AI filters | `SearchExercisesRequest` gets `primaryMuscles`, `equipment`, `levels` and `hasAiSupported=true`; `ExerciseInfo` is mapped to a plain `ExerciseSummary` with no `$typeName` |
| 2.2 | AI filter off                                       | `hasAiSupported` is left unset                                                                                                                                             |
| 2.3 | RPC fails                                           | Empty list; `getById` returns `null`                                                                                                                                       |
| 2.4 | Quick search pane                                   | Muscle chips come from the enum ("Abdominals"); the error state appears, then retry works                                                                                  |
| 2.5 | Instructions sheet                                  | Start and end frames are both shown; every `instructions[]` step is listed; a fallback icon appears when there are no images                                               |
| 2.6 | Live session data                                   | `instructions` and `images` arrays are passed through; a non-`BODY_ONLY` exercise counts as weighted                                                                       |

## 3. Admin catalog and the AI support rule

Files: `unit/admin-exercise-service.test.ts`, `unit/exercise-ai-support.test.ts`, `component/admin-exercise-form.test.tsx`.

| #   | Scenario                                        | Expected                                                                                                     |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 3.1 | Filters                                         | An enum filter becomes a one-item any-of list; `UNSPECIFIED` sends `[]`                                      |
| 3.2 | Create or update                                | Taxonomy enums, `instructions[]`, `images[]` and `motionSlug` are sent; the result is `{ ok, exercise }`     |
| 3.3 | Duplicate slug (`AlreadyExists`)                | `{ ok: false, message: "An exercise with this slug already exists…" }`                                       |
| 3.4 | AI without a motion slug (`FailedPrecondition`) | "AI form tracking requires a motion slug."                                                                   |
| 3.5 | No saved motion slug                            | "AI Rules & Voice" is disabled and the message asks the user to set a slug                                   |
| 3.6 | AI on and slug cleared                          | Client validation blocks the save: "Motion slug is required while AI form tracking is on."                   |
| 3.7 | "Add New Exercise"                              | Opens `/admin/exercises/new`; nothing is created on click                                                    |
| 3.8 | First save of a new exercise                    | `createExercise` with the typed name (the backend derives the slug); id-only actions stay hidden until saved |
| 3.9 | Saving an existing exercise                     | `updateExercise(id, …)`; the slug is shown read-only                                                         |

## 4. Onboarding and profile injuries

Files: `unit/onboarding-schema.test.ts`, `unit/onboarding-grpc-actions.test.ts`, `unit/injury-mapping.test.ts`, `unit/profile/profile-actions.test.ts`, `unit/profile-grpc-service.test.ts`, `component/onboarding-schedule-flow.test.tsx`.

| #   | Scenario                          | Expected                                                                                                         |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 4.1 | Equipment and muscle-focus values | Only enum values pass zod; free text and `UNSPECIFIED` are rejected                                              |
| 4.2 | Injury reported without a region  | Zod error on `injuryRegion`                                                                                      |
| 4.3 | Injury with a region, no muscle   | Valid; `InjuryInput{region, muscle: UNSPECIFIED, side, severity, notes}`                                         |
| 4.4 | No injury                         | `injuries: []`                                                                                                   |
| 4.5 | `ReportInjury` from profile       | The region, muscle, side and severity enums are sent; without a region the action returns early and makes no RPC |
| 4.6 | Wizard                            | Picking "Dumbbell" submits `equipment: [Equipment.DUMBBELL]`                                                     |

## 5. Progress, roadmap and ad-hoc labels

Files: `features/progress/*.test.ts(x)`, `unit/roadmap-page.mapper.test.ts`.

| #   | Scenario                    | Expected                                                                       |
| --- | --------------------------- | ------------------------------------------------------------------------------ |
| 5.1 | Active injuries on progress | Area = muscle label, otherwise the region label; recovered injuries are hidden |
| 5.2 | Preferred muscles           | Shown as enum labels                                                           |
| 5.3 | Roadmap session title       | `["CHEST", "MIDDLE_BACK"]` → "Chest, Middle Back"                              |

## 6. Pain report during a live set (§8.7)

Files: `component/live-pain-report.test.tsx`, `unit/pain-report.test.ts`.

| #   | Scenario                                | Expected                                                                                                      |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 6.1 | "Yes, stop now" with nothing picked     | One tap; `onStop({ note: "", region: UNSPECIFIED, side: BOTH })`; no injury is reported (current behaviour)   |
| 6.2 | Side picker                             | Hidden until a region is picked                                                                               |
| 6.3 | Region and side picked                  | `onStop` gets them; `ReportInjury` is sent with severity `MODERATE`                                           |
| 6.4 | Tapping the region again                | The region is cleared                                                                                         |
| 6.5 | Abort succeeds, injury saved            | `ReportInjury` fires only after the abort; the AI adjustment starts with the described region ("Knee · Left") |
| 6.6 | Injury save fails or rejects            | Global toast "Couldn't save the injury — add it in Profile."; no AI-adjusting state                           |
| 6.7 | Injury already active (`AlreadyExists`) | No toast, no AI-adjusting state                                                                               |
| 6.8 | Abort fails                             | No injury is reported, no adjustment, no navigation; "Could not end the session" toast                        |
| 6.9 | No region picked                        | Unchanged: the adjustment starts with the note label (or "Reported Area")                                     |

Files for 6.5–6.9: `unit/report-pain-injury.test.ts`, `unit/abort-session-pain.test.ts`.
