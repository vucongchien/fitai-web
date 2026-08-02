# FITAI Web

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

FITAI primarily serves people who are new to structured exercise or returning after a break. They need to know what to do next, train with confidence, and make progress without shame-based streaks or unsafe pressure.

## Product Purpose

FITAI turns body information, goals, availability, equipment, safety constraints, and workout results into a four-week adaptive training roadmap. Success means the user can understand and begin the next safe session quickly, complete it reliably, and see evidence that the plan adapts to their progress.

## Positioning

FITAI joins planning and execution in one feedback loop: onboarding creates the initial roadmap, each completed session contributes evidence, and later sessions can be adjusted around performance, schedule changes, and injury recovery.

## Operating Context

- The product is mobile-first and is commonly used in a gym, where attention, connectivity, and available hand movement may be limited.
- The primary loop is Login → Onboarding → Planning → Home → Roadmap/Schedule → Workout → Summary → Progress.
- Live workout must provide a complete manual logging path. Camera-based form analysis is an internal adapter until its model quality and privacy behavior are validated.
- English is the first interface language. Measurements use kilograms and centimeters by default.

## Capabilities and Constraints

- Authentication currently supports Google and Facebook through the generated Auth ConnectRPC service.
- The generated protobuf contracts under `src/shared/api/gen` are the wire authority and must not be edited manually.
- Server Components call ConnectRPC from the server. Client Components call a same-origin `/rpc` BFF, which attaches the access token held in secure HttpOnly cookies.
- Workout logging is online-first. The UI can preserve an unsent draft locally, but must not replay a mutation whose outcome is ambiguous until the backend offers an idempotency guarantee.
- A health profile must reach the backend-defined completion threshold before roadmap generation.
- A roadmap spans four weeks and contains week, day, and session plans. No more than six sessions are scheduled in one week.
- The product does not diagnose medical conditions. An injury report stops the active workout and routes the user toward recovery and schedule adjustment.

## Brand Commitments

- Product name: FITAI.
- Voice: direct, calm, encouraging, and specific. Actions use plain verbs and errors explain the next corrective step.
- The interface is light-first with a white, black, and gray foundation.
- The confirmed signature is “Triple Lane”: Relay Blue represents planning and interaction, Sprint Coral represents active effort, and Field Green represents safe completion and recovery.
- The identity must feel fresh, athletic, and premium through restraint, typography, layout, and motion rather than dark luxury, neon gym styling, gradients, glassmorphism, or decorative color.

## Evidence on Hand

- Core business rules are documented in `docs/NGHIEP_VU_COT_LOI_BABOK.md`.
- Generated ConnectRPC/protobuf contracts are available under `src/shared/api/gen`.
- There are no approved customer claims, testimonials, benchmark results, production imagery, or validated camera-model accuracy figures. The interface must not fabricate them.

## Product Principles

1. Put one safe next action ahead of motivation theater.
2. Show progress as evidence, never as punishment.
3. Explain why a plan or schedule changed.
4. Keep manual workout logging complete even when AI camera support is unavailable.
5. Preserve user control during injury, recovery, and network failure.

## Accessibility & Inclusion

- Target WCAG 2.2 AA for contrast, keyboard interaction, focus, semantics, and reduced motion.
- Color is never the only indicator of plan, effort, completion, warning, or injury state.
- Interactive targets are at least 48 by 48 CSS pixels on mobile.
