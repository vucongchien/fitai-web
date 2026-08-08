# FITAI frontend test index

## Contents

- [Unit coverage](#unit-coverage)
- [Component coverage](#component-coverage)
- [End-to-end coverage](#end-to-end-coverage)
- [Required UI states](#required-ui-states)
- [Commands](#commands)

## Unit coverage

| File                               | Scenarios                                                                                                                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unit/onboarding-schema.test.ts`   | Onboarding Zod Schema: Multi-goals selection, Date of Birth & Age validation (14-90 years), Body Fat (5-60%), Preferred workout times (AM/PM), Standardized equipment enum |
| `unit/onboarding-grpc-actions.test.ts` | Onboarding Server Actions: Multi-goals to proto enum, preferredWorkoutTimes array mapping, DOB, bodyFatPercent, equipment normalization to gRPC SaveHealthProfile, fallback error recovery |
| `unit/profile-grpc-service.test.ts` | Profile Service: aggregates GetProfile, GetPersonalRecords, GetNotificationSettings, handles empty state and 401 unauthenticated |
| `unit/planning-grpc-actions.test.ts` | Coaching & Roadmap: InitiateRoadmap, RegenerateSchedule on adaptation, CreateAdhocSessionPlan |
| `unit/workout-grpc-actions.test.ts` | Workout Execution: beginWorkoutSession, logWorkoutSet with camera angle/RPE, syncWorkoutLogs, completeWorkoutSession |
| `unit/nutrition-grpc-actions.test.ts` | Nutrition Engine: getNutritionPageData aggregation, logMeal with wire enum, recalibratePantryAction |
| `unit/exercise-grpc-repository.test.ts` | Exercise Catalog: searchExercises with filters, getCatalogMetadata taxonomy, getById details |
| `unit/video-source-parser.test.ts` | Video Parser: YouTube watch/shorts/embed recognition, direct MP4 file resolution |
| `unit/audio-cues-synthesizer.test.ts` | Web Audio Tone Synthesizer: Synthetic cue tones (start/good/warning/end) safe fallback |
| `unit/allowed-services.test.ts`    | User RPC allowlist, Admin denial, malformed path denial                                                                                                                                             |
| `unit/app-error.test.ts`           | Authentication and service-unavailable error mapping                                                                                                                                                |
| `unit/oauth-bff-routes.test.ts`    | BFF entry: invalid provider, missing RPC URL, 307 + state cookie, backend error; Callback: missing code, state mismatch, route resolution (onboarding/planning), auth cookies, Profile API fallback |
| `unit/auth-logout-route.test.ts`   | Logout route: calls gRPC AuthService.Logout, clears access/refresh/user_id cookies, supports JSON and 302 redirect                                                                                   |
| `unit/rpc-single-flight-refresh.test.ts` | Single-flight Token Refresh on 401: prevents duplicate refresh calls, updates cookies, transparent retry                                                                                       |
| `unit/dev-login-route.test.ts`     | Dev route: 404 in production, mock auth login for new vs existing user targets in development                                                                                                       |
| `unit/progress-aggregator.test.ts` | Calculates adherence percentage, formats volume (kg/tonnes), sorts top PRs                                                                                           |
| `unit/notification-actions.test.ts` | Notification Server Actions: listNotificationsAction calls listNotifications, markNotificationAsReadAction marks specific notification as read, handles unauthorized/missing access tokens and gRPC failure states |

## Component coverage

| File                                     | Scenarios                                                                                                                                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `component/button.test.tsx`              | Loading state remains accessible and prevents duplicate submission                                                                                                                                   |
| `component/triple-lane.test.tsx`         | Labelled signature has a non-color text alternative                                                                                                                                                  |
| `component/login-actions.test.tsx`       | Popup opens for Google/Facebook, popup-blocker fallback, OAUTH_COMPLETE navigates to dest, OAUTH_ERROR resets pending, popup closed manually resets, no duplicate clicks                             |
| `component/today-timeline.test.tsx`      | Render 4 meals + 1 workout, event time format, clean sub-labels without status duplication, accessible item links                                                                                    |
| `component/quick-actions-fab.test.tsx`   | Renders closed by default, opens menu on click, toggles aria-expanded, renders correct number of items from BFF props, aria-controls links trigger to menu                                           |
| `component/progress-bento-grid.test.tsx` | Renders 4 UI states: Loading skeleton, Error state with retry, Empty state with encouragement, and Success Bento grid                                                                                |
| `component/profile-setup.test.tsx`       | Tests Availability Scheduler, Equipment array multi-select, and Injury constraints manager in Profile                                                                                                |
| `component/log-meal-form.test.tsx`       | Tests collapsed trigger, opening input form, expanding macros (Protein/Carbs/Fat), cancelling, and validation error on empty submit                                                                  |
| `component/meal-detail-view.test.tsx`    | Tests rendering logged meal details, suggestions list, and log something else form section                                                                                                           |
| `component/workout-stats-panel.test.tsx` | Tests rendering WorkoutStatsPanel with action tone (blue) and Dumbbell icon                                                                                                                          |
| `component/nutrition-view.test.tsx`      | Tests rendering NutritionView with recovery tone (green)                                                                                                                                             |
| `component/bottom-navigation.test.tsx`   | nav landmark label, aria-current="page" on active route, no aria-current on inactive, all 4 destinations, /schedule treated as Workout active, icons aria-hidden                                    |
| `component/app-header.test.tsx`          | header banner landmark, BrandMark on top-level, back link aria-label for /nutrition and /roadmap sub-routes, /schedule routes, ArrowLeft icon aria-hidden                                           |
| `component/feedback-state.test.tsx`      | empty/error tones, title heading, description text, icon aria-hidden, no link without action props, action link accessible name and href, ArrowRight icon aria-hidden inside link                    |
| `component/metric-trace.test.tsx`        | SVG has role=img with aria-label=label+value, figure+figcaption structure, visible label+value text, tone modifier class, default blue tone, line path rendered, single-point dataset without throw  |
| `component/empty-state.test.tsx`         | output element (role=status), h3 heading, description text, no p without description, icon aria-hidden, no icon wrapper without icon prop, action slot rendered, no action container without action  |

## End-to-end coverage

| File                    | Scenarios                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `e2e/core-flow.spec.ts` | Login → onboarding, Home → preparation → live workout → summary, mobile navigation |

## Required UI states

- Loading: `src/app/loading.tsx` uses a labelled lane skeleton without full-screen shimmer.
- Error: `src/app/error.tsx` explains the failed route and exposes an explicit retry action.
- Empty: feature-level `FeedbackState` explains why content is absent and supplies one next action.
- Offline: Live Workout keeps the current set visible and disables submission until connectivity returns.
- Injury: Live Workout stops first, explains the consequence, and requires an explicit safe action.

## Commands

```powershell
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd test:e2e
pnpm.cmd build
```
