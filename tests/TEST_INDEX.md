# FITAI frontend test index

## Contents

- [Unit coverage](#unit-coverage)
- [Component coverage](#component-coverage)
- [End-to-end coverage](#end-to-end-coverage)
- [Required UI states](#required-ui-states)
- [Commands](#commands)

## Unit coverage

| File                             | Scenarios                                                                                                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unit/onboarding-schema.test.ts` | Valid beginner profile, missing availability, maximum six training days                                                                                                                             |
| `unit/allowed-services.test.ts`  | User RPC allowlist, Admin denial, malformed path denial                                                                                                                                             |
| `unit/app-error.test.ts`         | Authentication and service-unavailable error mapping                                                                                                                                                |
| `unit/oauth-bff-routes.test.ts`  | BFF entry: invalid provider, missing RPC URL, 307 + state cookie, backend error; Callback: missing code, state mismatch, route resolution (onboarding/planning), auth cookies, Profile API fallback |
| `unit/dev-login-route.test.ts`   | Dev route: 404 in production, mock auth login for new vs existing user targets in development                                                                                                       |
| `unit/progress-aggregator.test.ts` | Calculates adherence percentage, formats volume (kg/tonnes), sorts top PRs                                                                                            |

## Component coverage

| File                                   | Scenarios                                                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `component/button.test.tsx`            | Loading state remains accessible and prevents duplicate submission                                                                                                       |
| `component/triple-lane.test.tsx`       | Labelled signature has a non-color text alternative                                                                                                                      |
| `component/login-actions.test.tsx`     | Popup opens for Google/Facebook, popup-blocker fallback, OAUTH_COMPLETE navigates to dest, OAUTH_ERROR resets pending, popup closed manually resets, no duplicate clicks |
| `component/today-timeline.test.tsx`    | Render 4 meals + 1 workout, event time format, clean sub-labels without status duplication, accessible item links                                                        |
| `component/quick-actions-fab.test.tsx` | Renders closed by default, opens menu on click, toggles aria-expanded, renders correct number of items from BFF props                                                    |
| `component/progress-bento-grid.test.tsx`| Renders 4 UI states: Loading skeleton, Error state with retry, Empty state with encouragement, and Success Bento grid                                                    |
| `component/profile-setup.test.tsx`      | Tests Availability Scheduler, Equipment array multi-select, and Injury constraints manager in Profile                                                         |

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
