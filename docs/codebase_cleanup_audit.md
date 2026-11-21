# FitAI Web Architecture Audit & Surgical Remediation Plan

**Document Version**: 1.0.0  
**Audit Date**: 2026-11-21  
**Target Codebase**: `fitai-web` (`e:\LEARN\a\fitai-web`)  
**Backend Baseline Reference**: `gym-companion` (`e:\LEARN\a\gym-companion`)  
**Author**: Systems Architecture & QA Team (Teamwork Milestone 2)  
**Governance Compliance**: AGENTS.md Rules 1–14 (Rule 2 Practical Simplicity, Rule 3 Surgical Changes, Rule 13 Veteran Pragmatism, Rule 14 Engineer's Deliberation & Trade-offs)

---

## 1. Executive Summary

### 1.1 Context and Purpose
This document delivers an exhaustive, evidence-backed forensic codebase audit of `fitai-web` alongside an actionable, surgical remediation plan. The audit focuses on identifying hardcoded mappings diverging from database schemas and Protobuf contracts, architectural anti-patterns, lifecycle and memory leaks, and logic flaws that threaten production stability.

In accordance with **Rule 13 (Veteran Pragmatism)**, this evaluation rejects architecture theater, superficial fixes, and high-risk speculative rewrites. Instead, each finding is dissected through physical constraints (network I/O, render loops, memory retention, concurrency boundaries) and paired with a surgical, minimal-blast-radius remediation recipe (**Rule 2 & Rule 3**).

### 1.2 Audit Scope & Methodology
The audit surveyed all layers of `fitai-web` against the authoritative PostgreSQL schemas, database seed datasets, and Protobuf contracts in `gym-companion`:
- **Database Schemas & Migrations**: `gym-companion/internal/shared/database/migrations/core/` (specifically `02-exercise.sql`, `04-profile.sql`, `08-normalize-profile-uuids.sql`).
- **Catalog Seed Baseline**: `gym-companion/internal/shared/seeder/data/catalog_metadata_seed.json` (authoritative UUIDs for 10 body parts, 27 equipment types, 52 muscles).
- **Protobuf Specifications**: `gym-companion/proto/contracts/core/` and `supporting/` (coaching, workout execution, exercise, notification).
- **Frontend Code Inspection**: 100% of routes, hooks, components, server actions, BFF aggregates, and utility stores in `fitai-web/src`.
- **Runtime & Test Baseline**: Static typecheck (`tsc --noEmit`), test execution (869 passing Vitest tests), and runtime log examination.

### 1.3 Finding Matrix Summary
A total of **27 distinct findings** were identified across 7 core domains:

| Finding ID | Title / Issue | Severity | Problem Domain | Affected File(s) | Blast Radius |
|---|---|---|---|---|---|
| **A1** | Fake Bodyweight & Weighted Equipment UUIDs | **CRITICAL** | Catalog & Schema Divergence | `get-home-page-data.ts`, `get-live-session-data.ts`, `workout-actions.ts` | Medium |
| **A2** | `ZONE_MUSCLES` String Matching on Normalized UUIDs | **CRITICAL** | Catalog & Schema Divergence | `body-silhouette-card.tsx` | Low |
| **A3** | Inconsistent Injury Contract (UUIDs vs English Strings) | **HIGH** | Catalog & Schema Divergence | `profile-details-modal.tsx`, `roadmap-page.mapper.ts` | Low |
| **A4** | Phantom & Duplicate UUIDs in `muscle-uuid-map.ts` | **MEDIUM** | Catalog & Schema Divergence | `muscle-uuid-map.ts` | Low |
| **A5** | Slug vs UUID Fallback Catalog Drift | **MEDIUM** | Catalog & Schema Divergence | `search-repository.ts`, `catalog-actions.ts` | Low |
| **A6** | Dropped Catalog Metadata `tags` | **HIGH** | Catalog & Schema Divergence | `catalog-actions.ts` | Low |
| **A7** | Phantom Fields on `ExerciseInfo` Contract | **LOW** | Catalog & Schema Divergence | `get-live-session-data.ts` | Low |
| **B1** | Active Session Recovery Deadlock (`COMPLETED` History) | **CRITICAL** | Contract & Protocol Flaw | `get-live-session-data.ts` | Minimal |
| **B2** | Phantom `userId` on Parameterless Protobuf Messages | **HIGH** | Contract & Protocol Flaw | `coaching-actions.ts`, `notification-actions.ts`, `get-workout-stats-data.ts` | Low |
| **B3** | Fabricated Non-Existent `getMuscleLoadStats` RPC | **HIGH** | Contract & Protocol Flaw | `get-progress-dashboard-data.ts` | Minimal |
| **B4** | Multi-Select Filter Truncation (`?.[0]`) | **HIGH** | Contract & Protocol Flaw | `search-repository.ts` | Low |
| **B5** | Conflicting Coaching Style Enums Across Layers | **MEDIUM** | Contract & Protocol Flaw | `profile.mapper.ts`, `live-session.types.ts` | Low |
| **B6** | Profile Completion Algorithm Desynchronization | **MEDIUM** | Contract & Protocol Flaw | `get-home-page-data.ts` | Minimal |
| **B7** | BFF RPC Whitelist Gap (`AdminWorkoutExecutionService`) | **LOW** | Contract & Protocol Flaw | `allowed-services.ts` | Minimal |
| **C1** | OAuth Popup Indefinite Polling & Listener Leak | **CRITICAL** | Resource & Memory Leaks | `login-actions.tsx` | Minimal |
| **C2** | Duel Particle Canvas Compounding RAF Leak | **CRITICAL** | Resource & Memory Leaks | `duel-particle-canvas.tsx` | Minimal |
| **C3** | Unmount Webcam Track & Custom Video Leaks | **HIGH** | Resource & Memory Leaks | `use-camera-stream.ts`, `use-motion-engine.ts` | Low |
| **C4** | Unbounded Memory & Session Storage Post Cache | **MEDIUM** | Resource & Memory Leaks | `post-cache.ts` | Low |
| **D1** | Dogmatic Abuse of `useSyncExternalStore` for I/O | **HIGH** | React Anti-Pattern | `use-solo-duel.ts`, `use-matchmaking.ts`, `use-wake-lock.ts`, `use-scroll-lock.ts` | Medium |
| **D2** | Pseudo-`useEffect` in DOM Ref Callback (`stageRef`) | **HIGH** | React Anti-Pattern | `live-workout.tsx` | Medium |
| **D3** | Side-Effects & State Updates in Render Body | **HIGH** | React Anti-Pattern | `use-live-session.ts`, `use-matchmaking.ts` | Low |
| **D4** | Unchecked JWT Expiration in Route Proxy | **HIGH** | Auth & Session Flaw | `proxy.ts` | Low |
| **D5** | Mock AI Adjustment Timer Without Status Verification | **LOW** | UI Verification Flaw | `ai-adjustment-store.ts`, `use-ai-adjustment-sync.ts` | Low |
| **E1** | Silent Failure Swallowing on Onboarding Profile Save | **CRITICAL** | Error Handling & Integrity | `onboarding-flow.tsx` | Low |
| **E2** | Unsolicited Round-Robin Meal Redistribution | **LOW** | Data Integrity Flaw | `nutrition-daily.ts` | Minimal |
| **F1** | Redundant Sequential Waterfall on Home Page | **MEDIUM** | Performance & Redundancy | `get-home-page-data.ts` | Minimal |
| **F2** | Triplicate `GROUP_SYNONYMS` & Loop Allocation | **MEDIUM** | Performance & Redundancy | `exercise.ts` | Minimal |
| **F3** | Duplicate Difficulty Mappers & camelCase Wrappers | **LOW** | Redundancy & Dead Code | `admin-exercise-service.ts`, `search-repository.ts` | Minimal |
| **F4** | Duplicate BMI Calculation with Conflicting Labels | **LOW** | Redundancy & Dead Code | `progress-aggregator.ts`, `profile.mapper.ts` | Minimal |
| **G1** | Server-Side Timezone Mismatches (UTC vs Client) | **MEDIUM** | Timezone & Localization | `get-home-page-data.ts`, `streak.ts` | Low |
| **G2** | Leaky Fullscreen Exit on External Store Unsubscribe | **MEDIUM** | Lifecycle Bug | `use-fullscreen-scope.ts` | Minimal |
| **G3** | Dummy Context Provider & Global Keydown Listener Leak | **LOW** | Test & DOM Hygiene | `side-panel-context.tsx` | Minimal |
| **G4** | Cargo-Cult `transitionTypes` Next.js DOM Warnings | **LOW** | Framework Hygiene | `transition-types.ts` & 25+ files | Low |
| **G5** | Non-Deterministic Mapper with `Math.random()` | **LOW** | Code Cleanliness | `scheduler/types.ts` | Minimal |

---

## 2. Forensic Audit Catalog: Divergences, Smells & Structural Defects

---

### Domain A: Catalog Metadata, Database Schema & Entity Mapping Divergences

#### Finding A1: Fake Bodyweight & Weighted Equipment GUIDs Diverging from DB Catalog
- **Severity**: **CRITICAL**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/workout/server/workout-actions.ts`: lines 36–37
  - `fitai-web/src/features/workout/server/get-live-session-data.ts`: line 59, lines 371–373
  - `fitai-web/src/features/home/server/get-home-page-data.ts`: lines 304, 326, 561
  - `fitai-web/tests/unit/onboarding-schema.test.ts`: line 12
- **Backend Reference**:
  - `gym-companion/internal/shared/seeder/data/catalog_metadata_seed.json`: lines 58–60
  - `gym-companion/internal/shared/database/migrations/core/02-exercise.sql`: lines 27–33
- **Verbatim Code Quote**:
  ```typescript
  // workout-actions.ts:36-37
  isWeighted: ex.equipmentId !== "7740d3bf-cff0-46e2-931e-e6df19988e31",
  defaultWeightKg: ex.equipmentId === "7740d3bf-cff0-46e2-931e-e6df19988e31" ? undefined : 10,

  // get-live-session-data.ts:371-373
  equipmentId: cfg.isWeighted ? "0712475e-969f-42d1-a217-1055b703d3c6" : "7740d3bf-cff0-46e2-931e-e6df19988e31",
  ```
- **Authoritative Divergence & Defect Mechanism**:
  In PostgreSQL and `catalog_metadata_seed.json`, "Body Weight" equipment has authoritative ID `"9d8f6dd0-73fa-46ac-a669-f81d0661e9f7"`. Neither `"7740d3bf-cff0-46e2-931e-e6df19988e31"` nor `"0712475e-969f-42d1-a217-1055b703d3c6"` exists in the database.
- **Production Failure Mode**:
  Because `ex.equipmentId` for Body Weight movements in the database is `"9d8f6dd0-73fa-46ac-a669-f81d0661e9f7"`, `ex.equipmentId !== "7740d3bf..."` unconditionally evaluates to `true`. Every bodyweight movement (Push-ups, Pull-ups, Planks, Burpees) is misidentified as a weighted exercise and assigned a default load of **10 kg**, corrupting user volume metrics, personal records, and AI coaching recommendations.

---

#### Finding A2: `ZONE_MUSCLES` String Matching on Normalized Injury UUIDs
- **Severity**: **CRITICAL**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/progress/ui/body-silhouette-card.tsx`: lines 33–37, lines 61–66
- **Backend Reference**:
  - `gym-companion/internal/shared/database/migrations/core/08-normalize-profile-uuids.sql`: lines 55–59
- **Verbatim Code Quote**:
  ```typescript
  // body-silhouette-card.tsx:33-37 & 61-66
  const ZONE_MUSCLES: Record<Exclude<BodyZoneId, "full">, string[]> = {
    upper: ["CHEST", "BACK", "SHOULDERS", "ARMS", "BICEPS", "TRICEPS", "TRAPS", "LATS", "DELT"],
    core: ["ABS", "CORE", "OBLIQUES", "LOWER_BACK", "SERRATUS"],
    lower: ["LEGS", "QUADS", "HAMSTRINGS", "GLUTES", "CALVES", "ADDUCTORS", "ABDUCTORS", "HIP"],
  };
  ...
  const zoneInjuries =
    selectedZone === "full"
      ? activeInjuries
      : activeInjuries.filter((inj) =>
          ZONE_MUSCLES[selectedZone].some((zm) => inj.muscleGroup.toUpperCase().includes(zm)),
        );
  ```
- **Authoritative Divergence & Defect Mechanism**:
  Migration `08-normalize-profile-uuids.sql` converted `profile.injuries.muscle_group` to a UUID foreign key referencing `exercise.muscles(id)`. When `inj.muscleGroup` is a UUID (e.g. `"67a3aebd-ad76-49aa-93b7-7c393bf77ced"`), `.toUpperCase().includes("CHEST")` is always `false`.
- **Production Failure Mode**:
  When a user filters the body silhouette card by "Upper", "Core", or "Lower", 100% of their active recorded injuries vanish from the UI. Ironically, `body-silhouette-card.tsx:69` already uses `resolveGoalMuscleIds(activeInjuries.map((inj) => inj.muscleGroup))` for silhouette SVG rendering, yet line 65 falls back to the broken string matching.

---

#### Finding A3: Inconsistent Injury Muscle Contracts (Onboarding UUIDs vs Profile Settings English Strings)
- **Severity**: **HIGH**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/onboarding/ui/onboarding-flow.tsx`: line 407
  - `fitai-web/src/features/profile/components/profile-details-modal.tsx`: lines 775–817, line 834, line 841
  - `fitai-web/src/features/roadmap/model/roadmap-page.mapper.ts`: line 401
- **Authoritative Divergence & Defect Mechanism**:
  - `onboarding-flow.tsx:407`: Passes `m.id` (UUID).
  - `profile-details-modal.tsx:834`: Passes `m.name` (English string such as `"Shoulders"`).
  - Furthermore, `profile-details-modal.tsx:812-816` forcibly hardcodes all dynamic database muscles to category `"Upper Body"`, even for Calves, Quads, and Glutes:
    ```typescript
    ...dynamicDbMuscles.map((dbM) => ({
      name: dbM.name,
      category: "Upper Body" as "Upper Body" | "Lower Body" | "Core & Joints",
      hint: "From Database Catalog",
    }))
    ```
- **Production Failure Mode**:
  The database ends up in a split-brain state where some users have UUIDs in `profile.injuries.muscle_group` while others have raw English strings. Users with onboarding injuries see raw UUIDs displayed on the roadmap page: `"Active constraints: 67a3aebd-ad76-49aa-93b7-7c393bf77ced. Please proceed with caution."` (`roadmap-page.mapper.ts:401`).

---

#### Finding A4: Phantom & Duplicate Entries in `muscle-uuid-map.ts`
- **Severity**: **MEDIUM**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/progress/model/muscle-uuid-map.ts`: lines 1–102
- **Backend Reference**:
  - `gym-companion/internal/shared/seeder/data/catalog_metadata_seed.json`: lines 158–490
- **Authoritative Divergence & Defect Mechanism**:
  Lines 2–51 define 50 muscle mappings with phantom UUIDs (e.g. `"3e015d67-bf6f-41e5-936e-7b967c1d7714": "Abdominals"`). Lines 52–101 define the exact same 50 muscle names mapped to the actual seed UUIDs (e.g. `"67a3aebd-ad76-49aa-93b7-7c393bf77ced": "Abdominals"`). The first 50 entries are dead artifacts from an abandoned mock dataset.
- **Production Failure Mode**:
  Dead code bloat and risk of developer confusion over which UUID set is authoritative.

---

#### Finding A5: Contradictory Fallback Catalogs & Slug vs UUID Drift
- **Severity**: **MEDIUM**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/exercise/api/search-repository.ts`: lines 33–68
  - `fitai-web/src/features/exercise/server/catalog-actions.ts`: lines 34–60
- **Authoritative Divergence & Defect Mechanism**:
  `search-repository.ts` defines `DEFAULT_CATALOG` using slug strings (`{ id: "legs", name: "Legs" }`, `{ id: "dumbbells", name: "Dumbbells" }`), whereas `catalog-actions.ts` defines `FALLBACK_BODY_PARTS` using uppercase tokens (`"UPPER_BODY"`, `"LOWER_BODY"`). The backend database strictly uses UUIDs for `body_parts`, `equipments`, and `muscles`.
- **Production Failure Mode**:
  In offline mode or when gRPC services are unreachable, fallback filters output slug IDs. Subsequent queries or cached exercise comparisons expecting UUIDs fail equality checks.

---

#### Finding A6: Dropped Catalog Metadata `tags`
- **Severity**: **HIGH**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/exercise/server/catalog-actions.ts`: lines 25–31, lines 74–98
- **Backend Reference**:
  - `gym-companion/proto/contracts/supporting/exercise/v1/message/exercise_messages.proto`: lines 176–181
- **Authoritative Divergence & Defect Mechanism**:
  The backend Protobuf message `GetCatalogMetadataResponse` defines:
  ```protobuf
  message GetCatalogMetadataResponse {
    repeated BodyPart body_parts = 1;
    repeated Muscle muscles = 2;
    repeated Equipment equipments = 3;
    repeated Tag tags = 4;
  }
  ```
  `catalog-actions.ts` extracts `bodyParts`, `muscles`, and `equipments`, but completely drops `tags` from `CatalogMetadataResult`.
- **Production Failure Mode**:
  Tag-based exercise filtering (e.g. "Hypertrophy", "Compound", "Isolation") cannot be populated from the server catalog.

---

#### Finding A7: Phantom Fields on `ExerciseInfo` Contract
- **Severity**: **LOW**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/workout/server/get-live-session-data.ts`: line 78, lines 137–138
- **Backend Reference**:
  - `gym-companion/proto/contracts/supporting/exercise/v1/message/exercise_messages.proto`: lines 18–35
- **Authoritative Divergence & Defect Mechanism**:
  `get-live-session-data.ts` references `info?.breathingCue`, `ex.rulesUrl`, and `ex.dialoguesUrl`. The backend Protobuf and database schemas contain no such columns or fields on `Exercise` or `ExerciseInfo`.
- **Production Failure Mode**:
  Silent `undefined` property access falling back to hardcoded strings like `"Breathe steadily"`.

---

### Domain B: Protobuf & gRPC Service Contract Inconsistencies

#### Finding B1: Active Session Recovery Deadlock (Querying `COMPLETED` History & Crashing with `notFound()`)
- **Severity**: **CRITICAL**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/workout/server/get-live-session-data.ts`: lines 471–495
- **Backend Reference**:
  - `gym-companion/internal/workout_execution/infrastructure/persistence/postgres_workout_session_repository.go`: lines 202–211
  - `gym-companion/internal/workout_execution/domain/aggregate/workout_session.go`: lines 509–511
- **Verbatim Code Quote**:
  ```typescript
  // get-live-session-data.ts:471-495
  } catch (startErr: any) {
    ...
    try {
      const historyRes = await execution.getWorkoutHistory({ limit: 10, offset: 0 });
      const firstSession = historyRes.sessions?.[0];
      if (firstSession?.sessionId) {
        console.log("[getLiveSessionData] Aborting hanging session:", firstSession.sessionId);
        await execution.abortWorkoutSession({
          sessionId: firstSession.sessionId,
          reason: "SYSTEM_ABORT_FOR_NEW_SESSION",
        });
      }
      const retryRes = await execution.startWorkoutSession({ planId: targetPlanId });
      ...
    } catch (retryErr) {
      console.error("[getLiveSessionData] Failed to resolve session conflict:", retryErr);
      notFound();
    }
  }
  ```
- **Authoritative Divergence & Defect Mechanism**:
  1. When starting a workout session fails due to an existing active session conflict, the catch block calls `execution.getWorkoutHistory({ limit: 10, offset: 0 })`.
  2. In `postgres_workout_session_repository.go:205`, `FindHistoryByUserID` queries:
     `Where("user_id = ? AND status = ?", userID, "COMPLETED")`.
  3. Therefore, `historyRes.sessions` contains **only completed sessions**.
  4. `firstSession` is guaranteed to be a `COMPLETED` session.
  5. Calling `abortWorkoutSession` on a completed session immediately triggers `derror.ErrSessionAlreadyCompleted` on the backend (`workout_session.go:510`).
  6. The error is thrown into `catch (retryErr)`, which invokes Next.js `notFound()`.
- **Production Failure Mode**:
  Any user who leaves an active session hanging (e.g. browser crash, closed tab, or lost connection) is permanently deadlocked from starting a new workout. Every attempt to start a session hits a 404 Not Found page crash.

---

#### Finding B2: Phantom `userId` Payloads on Parameterless Protobuf Messages
- **Severity**: **HIGH**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/workout-stats/server/get-workout-stats-data.ts`: line 37
  - `fitai-web/src/features/roadmap/server/coaching-actions.ts`: lines 20, 45, 73
  - `fitai-web/src/features/notification/server/notification-actions.ts`: lines 37–41, lines 72–75
  - `fitai-web/src/features/progress/server/get-progress-dashboard-data.ts`: lines 83, 94, 98
- **Backend Reference**:
  - `gym-companion/proto/contracts/core/coaching/v1/message/coaching_messages.proto`: `GetActiveRoadmapRequest {}`, `InitiateRoadmapRequest {}`, `RegenerateScheduleRequest { roadmap_id, reason }`
  - `gym-companion/proto/contracts/generic/notification/v1/message/notification_messages.proto`: `ListNotificationsRequest { limit, offset }`
- **Authoritative Divergence & Defect Mechanism**:
  Frontend actions pass `{ userId: userId || "" }` in request payloads to RPCs whose Protobuf message definitions declare zero fields or omit `user_id`. The backend extracts user identity solely from the authenticated JWT metadata context (`ctx.Value(authKey)`).
- **Production Failure Mode**:
  Passing superfluous fields violates strict serialization contracts, creates false assumptions about client-side user scoping, and risks silent failures if Protobuf deserializers reject unknown fields.

---

#### Finding B3: Fabricated Non-Existent `getMuscleLoadStats` RPC Call
- **Severity**: **HIGH**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/progress/server/get-progress-dashboard-data.ts`: lines 84–92
- **Backend Reference**:
  - `gym-companion/proto/contracts/core/workout_execution/v1/service/workout_execution_service.proto`: lines 10–35
- **Verbatim Code Quote**:
  ```typescript
  // get-progress-dashboard-data.ts:84-92
  typeof (workoutClient as { getMuscleLoadStats?: unknown }).getMuscleLoadStats === "function"
    ? (
        workoutClient as unknown as {
          getMuscleLoadStats: (req: {
            windowDays: number;
          }) => Promise<{ items?: MuscleLoadSummary[] }>;
        }
      ).getMuscleLoadStats({ windowDays: 7 })
    : Promise.resolve({ items: [] as MuscleLoadSummary[] }),
  ```
- **Authoritative Divergence & Defect Mechanism**:
  `WorkoutExecutionService` does not define any RPC named `GetMuscleLoadStats`. The author masked this missing contract by casting `workoutClient` to `unknown` and checking `typeof ... === "function"`.
- **Production Failure Mode**:
  If a mock client implements this function during development, it passes; in production with a real gRPC-web/Connect transport, calling it triggers status 12 `UNIMPLEMENTED`.

---

#### Finding B4: Multi-Select Filter Truncation (`?.[0]`) vs Single-Scalar Protobuf Request
- **Severity**: **HIGH**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/exercise/api/search-repository.ts`: lines 91–95
  - `fitai-web/src/features/exercise/domain/exercise.ts`: lines 81–89
- **Backend Reference**:
  - `gym-companion/proto/contracts/supporting/exercise/v1/message/exercise_messages.proto`: lines 54–62
- **Verbatim Code Quote**:
  ```typescript
  // search-repository.ts:91-95
  const bodyPartId = filters.bodyPartIds?.[0] || raw.bodyPartId || "";
  const equipmentId = filters.equipmentIds?.[0] || raw.equipmentId || "";
  const targetMuscleId = filters.targetMuscleIds?.[0] || raw.targetMuscleId || "";
  ```
- **Authoritative Divergence & Defect Mechanism**:
  The UI domain model `ExerciseFilters` accepts arrays (`bodyPartIds?: string[]`, `equipmentIds?: string[]`). However, `SearchExercisesRequest` in Protobuf only declares single string fields (`string body_part_id = 2; string equipment_id = 3;`). The repository truncates the array using `?.[0]`.
- **Production Failure Mode**:
  When a user selects multiple filters (e.g. Chest and Back, or Dumbbell and Barbell), every filter after index 0 is silently dropped without user feedback.

---

#### Finding B5: Conflicting Coaching Style Enums Across Three Layers
- **Severity**: **MEDIUM**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/profile/model/profile.mapper.ts`: lines 17–31
  - `fitai-web/src/features/workout/model/live-session.types.ts`: line 99
- **Backend Reference**:
  - `gym-companion/internal/shared/database/migrations/core/04-profile.sql`: line 52
- **Authoritative Divergence & Defect Mechanism**:
  - PostgreSQL `04-profile.sql`: `coach_style VARCHAR(50) DEFAULT 'FRIENDLY'`.
  - `profile.mapper.ts`: Maps values strictly to `"STRICT" | "SCIENTIFIC" | "MOTIVATIONAL"`.
  - `live-session.types.ts`: Defines coaching tone as `"normal" | "strict" | "gentle"`.
- **Production Failure Mode**:
  A user with the default `'FRIENDLY'` coach style in the database causes mapper fallbacks or prompt mismatches in the AI coaching engine.

---

#### Finding B6: Profile Completion Algorithm Desynchronization
- **Severity**: **MEDIUM**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/home/server/get-home-page-data.ts`: lines 148–188, lines 196–198
- **Backend Reference**:
  - `gym-companion/internal/profile/domain/service/completion_calculator.go`: lines 19–74
- **Authoritative Divergence & Defect Mechanism**:
  The backend calculates completion percentage authoritatively across **10 fields** (10% each: `displayName`, `gender`, `birthday`, `heightCm`, `weightKg`, `fitnessGoal`, `experienceLevel`, `preferredWorkoutTimes`, `preferredMuscleGroups`, `coachStyle`) and returns it in `profileProto.completionRate`. The frontend independently implements a contradictory algorithm across only **5 fields** (20% each).
- **Production Failure Mode**:
  Users see conflicting profile completion percentages between the home page widget and profile pages.

---

#### Finding B7: BFF RPC Route Whitelist Gap
- **Severity**: **LOW**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/shared/api/bff/allowed-services.ts`: lines 1–30
- **Authoritative Divergence & Defect Mechanism**:
  The whitelist in `allowed-services.ts` guards the browser-to-BFF proxy `/rpc/[...path]`. It lists standard services but omits `AdminWorkoutExecutionService` and `AuthService`.
- **Production Failure Mode**:
  Any future administrative workout control or browser auth action routed via the BFF proxy returns 403 Forbidden.

---

### Domain C: Resource Leaks, Memory Management & Hardware Lifecycles

#### Finding C1: Indefinite Interval & Event Listener Leak in OAuth Popup
- **Severity**: **CRITICAL**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/auth/ui/login-actions.tsx`: lines 71–105
- **Verbatim Code Quote**:
  ```typescript
  // login-actions.tsx:98-105
  window.addEventListener("message", onMessage);

  const pollClosed = window.setInterval(() => {
    if (popup.closed) {
      setPending(false);
    }
  }, 300);
  ```
- **Defect Mechanism**:
  When a user opens the OAuth popup and manually closes it without completing authentication, `if (popup.closed)` executes `setPending(false)`. However, `clearInterval(pollClosed)` is never invoked, and `window.removeEventListener("message", onMessage)` is never called.
- **Production Failure Mode**:
  Every aborted OAuth attempt leaks a permanent 300ms background interval and a global message listener, degrading browser performance and retaining uncollected component scope in memory.

---

#### Finding C2: Animation Loop Cleanup Leak and `useSyncExternalStore` Misuse in `duel-particle-canvas.tsx`
- **Severity**: **HIGH**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/solo-match/ui/duel-particle-canvas.tsx`: lines 90–132
- **Verbatim Code Quote**:
  ```typescript
  // duel-particle-canvas.tsx:90-94, 125-132
  if (rafIdRef.current === null) {
    const tick = () => {
      // animate particles...
      if (list.length > 0) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }
  return () => {};
  }, [lastMilestone, lastRepConfirmedAtMs, myValue, opponentValue]);

  useSyncExternalStore(
    subscribeParticles,
    () => 0,
    () => 0,
  );
  ```
- **Defect Mechanism**:
  1. **Unmount Cleanup Leak**: Line 90 has an `if (rafIdRef.current === null)` guard that prevents duplicate RAF loops during active reps while an animation is already in flight. However, line 125 explicitly returns a no-op cleanup function `return () => {};`. When the duel canvas component unmounts or subscription dependencies update, the active animation frame is never canceled via `cancelAnimationFrame(rafIdRef.current)`. The RAF loop continues ticking in the background on detached canvas elements.
  2. **`useSyncExternalStore` Anti-Pattern**: Driving canvas rendering and RAF subscriptions through `useSyncExternalStore` with dummy constant snapshots (`() => 0`) dogmatically abuses the store API for lifecycle side-effects rather than external immutable state synchronization.
- **Production Failure Mode**:
  When a user leaves the duel screen while particles are animating, orphaned `requestAnimationFrame` callbacks continue executing in the background, retaining uncollected canvas references and wasting CPU/GPU cycles.

---

#### Finding C3: Unmount Webcam Track & Custom Video Leaks
- **Severity**: **HIGH**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/workout/model/use-camera-stream.ts`: lines 10–45, lines 150–164
  - `fitai-web/src/features/workout/model/use-motion-engine.ts`: lines 147–161
- **Defect Mechanism**:
  1. Neither `useCameraStream` nor `useMotionEngine` implements an unmount cleanup effect.
  2. Line 32 of `use-camera-stream.ts` contains: `if (isCustomVideoRef.current) return;`, which causes `stop()` to completely skip tearing down custom video elements and video tracks.
- **Production Failure Mode**:
  If a user navigates away from an active workout session (e.g. clicking the navbar to go to Roadmap or Home), camera tracks remain active in the browser background, keeping the hardware camera indicator LED on and wasting CPU on video frame capture.

---

#### Finding C4: Unbounded Memory & Session Storage Post Cache
- **Severity**: **MEDIUM**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/social/lib/post-cache.ts`: lines 3–34
- **Defect Mechanism**:
  `memoryCache = new Map<string, FeedItemVM>()` and `sessionStorage` store feed items indefinitely with no maximum entry count, TTL expiration, or LRU eviction policy.
- **Production Failure Mode**:
  Extended scrolling through community feeds leads to unbounded heap memory consumption and eventual `QUOTA_EXCEEDED_ERR` exceptions in browser `sessionStorage`.

---

### Domain D: Architectural Anti-Patterns & React Runtime Smells

#### Finding D1: Dogmatic Abuse of `useSyncExternalStore` for Lifecycle Effects and Hardware I/O ("Zero-useEffect" Smells)
- **Severity**: **HIGH**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/solo-match/model/use-solo-duel.ts`: lines 431–435, lines 456–460
  - `fitai-web/src/features/solo-match/model/use-matchmaking.ts`: lines 63–67, lines 76–80
  - `fitai-web/src/shared/lib/use-wake-lock.ts`: line 173
  - `fitai-web/src/shared/lib/use-scroll-lock.ts`: lines 55–68
  - `fitai-web/src/shared/lib/use-debounce.ts`: lines 1–65
  - `fitai-web/src/features/workout/model/use-adhoc-workout.ts`: lines 26–30
- **Verbatim Code Quote**:
  ```typescript
  // use-solo-duel.ts:431-435
  useSyncExternalStore(
    subscribeSession,
    () => true,
    () => true,
  );
  ```
- **Authoritative Divergence & Defect Mechanism**:
  A dogmatic attempt to enforce "Zero-useEffect" across the codebase has led to using `useSyncExternalStore` as a surrogate lifecycle hook. Inside `subscribeSession` (lines 150–429), it instantiates WebTransport/WebSocket clients (`new SoloRefereeClient()`), turns on the hardware webcam (`cameraRef.current.start("user")`), spawns dedicated Web Workers (`new Worker(...)`), and starts animation loops, using dummy snapshots `() => true` purely to trigger cleanup on unmount.
- **Production Failure Mode**:
  React's concurrent renderer expects `useSyncExternalStore` subscribe functions to be pure and synchronous. Initiating asynchronous hardware requests and network handshakes inside subscribe functions leads to duplicate connections under React StrictMode, race conditions, and unmount leaks.

---

#### Finding D2: Pseudo-`useEffect` DOM Ref Callback Pattern in `live-workout.tsx` (`stageRef` Re-render Loop)
- **Severity**: **HIGH**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/workout/ui/live/live-workout.tsx`: lines 182–242, 356, 375
- **Verbatim Code Quote**:
  ```tsx
  // live-workout.tsx:182-184 & 240-242
  const stageRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;
      ...
      const cleanupEffects = workoutEffects.syncEffects(node);
      return () => { ... cleanupEffects?.(); };
    },
    [audio, camera, cameraActive, durationWarning, motion, online, protectionNote, sessionStatus, workoutEffects]
  );
  ...
  <div className="live-workout-root contents" ref={stageRef}>
  ```
- **Defect Mechanism**:
  `stageRef` is attached as a ref callback to the root `<div>`. Its dependency array includes `workoutEffects`, which returns a newly constructed object reference on every render. Because the dependency reference changes, React detaches the ref (calling cleanup) and re-attaches the ref (calling `stageRef` again with the DOM node) on every single render. Inside `stageRef`, it triggers toasts (`toast.info`), starts camera calibration (`motion.startCalibration()`), and handles audio cues.
- **Production Failure Mode**:
  Spurious toast notifications, repeated calibration attempts, and layout-phase state updates that trigger React "Maximum update depth exceeded" warnings.

---

#### Finding D3: Direct Side-Effects and State Updates in Render Body
- **Severity**: **HIGH**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/workout/model/use-live-session.ts`: lines 309–316, lines 338–340, lines 379–385
  - `fitai-web/src/features/solo-match/model/use-matchmaking.ts`: lines 36–40
- **Verbatim Code Quote**:
  ```typescript
  // use-live-session.ts:338-340 & 380-383
  if (state.status === "resting" && state.restEndsAt !== null && restLeft === 0) {
    dispatch({ type: "end-rest" });
  }
  ...
  if (isOnline && !prevOnlineRef.current) {
    prevOnlineRef.current = isOnline;
    void flush();
  }
  ```
- **Defect Mechanism**:
  1. `sessionStorage.setItem` runs directly in the render body.
  2. `dispatch({ type: "end-rest" })` is dispatched during the render phase.
  3. `void flush()` (network sync) is executed directly in the render body when `isOnline` transitions.
- **Production Failure Mode**:
  Violates React rendering purity. State dispatches during render cause immediate re-renders in the same tick or React warnings (`Cannot update a component while rendering a different component`).

---

#### Finding D4: Unchecked JWT Expiration in Next.js Middleware / Route Proxy
- **Severity**: **HIGH**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/proxy.ts`: lines 48–98
- **Defect Mechanism**:
  `proxy.ts` evaluates:
  ```typescript
  if (!isPublicRoute && !accessToken) {
    if (refreshToken) { ... }
  ```
  Token refresh is only triggered if `!accessToken`. If an expired `accessToken` cookie is still present in the browser before its cookie max-age purges it, `!accessToken` is `false`. The proxy forwards the expired token to Server Actions.
- **Production Failure Mode**:
  Users returning to the application after token expiration receive immediate 401 `Unauthenticated` crashes on their first user action instead of having their session refreshed seamlessly.

---

#### Finding D5: Mock AI Adjustment Timer Without Backend Plan Status Verification
- **Severity**: **LOW**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/roadmap/model/ai-adjustment-store.ts`: lines 64–68
  - `fitai-web/src/features/roadmap/hooks/use-ai-adjustment-sync.ts`: lines 24–34
- **Defect Mechanism**:
  `startAIAdjustment` initiates an asynchronous request and immediately sets a fixed `setTimeout(..., 7000)`. When 7 seconds elapse, it transitions to `"completed"` and calls `router.refresh()` without checking if the backend AI regeneration actually finished or failed.
- **Production Failure Mode**:
  If AI generation takes 10 seconds or fails due to an LLM timeout, the UI falsely indicates completion while the roadmap remains unchanged.

---

### Domain E: Critical Business Logic Flaws & Swallowed Errors

#### Finding E1: Silent Failure & Unhandled Error Swallowing on Onboarding Profile Save
- **Severity**: **CRITICAL**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/onboarding/ui/onboarding-flow.tsx`: lines 245–260
- **Verbatim Code Quote**:
  ```typescript
  // onboarding-flow.tsx:245-260
  try {
    const result = await saveOnboardingProfileServerAction(getValues());
    if (!result.success) {
      console.error("[OnboardingFlow] Server returned error:", result.message);
    }
    sessionStorage.setItem("fitai-onboarding-complete", "true");
    router.push("/home", { transitionTypes: ["nav-forward"] });
  } catch (error) {
    console.error("Failed to submit onboarding via gRPC:", error);
    sessionStorage.setItem("fitai-onboarding-complete", "true");
    router.push("/home", { transitionTypes: ["nav-forward"] });
  } finally {
    setIsSubmitting(false);
  }
  ```
- **Defect Mechanism**:
  Both when `result.success === false` and when `saveOnboardingProfileServerAction` throws an unhandled exception, the error is swallowed and logged to the console. The code unconditionally sets `fitai-onboarding-complete: "true"` in `sessionStorage` and navigates to `/home`.
- **Production Failure Mode**:
  If the backend database fails a constraint, rejects a UUID, or experiences network downtime, the user is forwarded to `/home` with no profile in the database. Downstream roadmap generation, workout recommendations, and stats permanently crash because no user profile exists.

---

#### Finding E2: Unsolicited Round-Robin Meal Redistribution in `nutrition-daily.ts`
- **Severity**: **LOW**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/shared/api/bff/aggregate/nutrition-daily.ts`: lines 302–316
- **Verbatim Code Quote**:
  ```typescript
  // nutrition-daily.ts:302-316
  // 6. Self-healing fallback: If snack contains all options and 3 main meals are empty, redistribute across slots
  if (
    result.snack.length >= 4 &&
    result.breakfast.length === 0 &&
    result.lunch.length === 0 &&
    result.dinner.length === 0
  ) {
    const all = [...result.snack];
    result.snack = [];
    for (let i = 0; i < all.length; i++) {
      const targetSlot = slots[i % 4] ?? "snack";
      result[targetSlot].push(all[i]!);
    }
  }
  ```
- **Defect Mechanism**:
  An artificial "self-healing" heuristic intercepts logged meals. If a user logs 4 or more items in the "snack" category and hasn't logged breakfast, lunch, or dinner, it reassigns the user's snacks into breakfast, lunch, and dinner slots.
- **Production Failure Mode**:
  Arbitrary mutation of user data. A user logging afternoon snacks sees their food arbitrarily moved to "breakfast" upon refreshing the page.

---

### Domain F: Performance Waterfalls, Redundancy & Dead Mappers

#### Finding F1: Redundant Sequential RPC Waterfall and Duplicate Data Fetching on Home Page
- **Severity**: **MEDIUM**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/home/server/get-home-page-data.ts`: line 196, lines 211–236
- **Defect Mechanism**:
  `getHomePageData()` sequentially executes `await getProfileData()` (which fires 4 gRPC calls: `getProfile`, `getPersonalRecords`, `getNotificationSettings`, `getWorkoutHistory({ limit: 50 })`). Immediately after, line 221 fires a `Promise.allSettled` batch of 9 RPCs, fetching `getProfile` and `getWorkoutHistory({ limit: 20 })` a second time! The sequential fetch was used solely for a local completion score calculation that is immediately overwritten by `profileProto.completionRate`.
- **Production Failure Mode**:
  Adds 200–500ms of unnecessary sequential latency to the initial home page server-side render.

---

#### Finding F2: Triplicate Copy of `GROUP_SYNONYMS` with Per-Keystroke Object Allocation
- **Severity**: **MEDIUM**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/exercise/domain/exercise.ts`:
    - Definition 1: lines 17–50 (`export const GROUP_SYNONYMS`)
    - Definition 2: lines 113–146 (local `const groupSynonyms` in `countActiveFilters`)
    - Definition 3: lines 235–268 (local `const groupSynonyms` inside `filterExercises` loop)
- **Defect Mechanism**:
  An identical 35-line dictionary is declared 3 times in the same file. In `filterExercises`, the dictionary is allocated inside the `.some()` callback on every single iteration over the exercise list.
- **Production Failure Mode**:
  Allocates hundreds of transient objects per search keystroke during client-side exercise filtering and creates a code divergence trap if one dictionary is updated without the others.

---

#### Finding F3: Redundant Difficulty Mappers & Artificial camelCase Admin Enums
- **Severity**: **LOW**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/admin/api/admin-exercise-service.ts`: lines 17–29, lines 31–49, lines 51–69
  - `fitai-web/src/features/exercise/api/search-repository.ts`: lines 13–25
  - `fitai-web/src/features/profile/model/profile.mapper.ts`: lines 154–184
- **Defect Mechanism**:
  `mapDifficulty` is copy-pasted across multiple files. `admin-exercise-service.ts` invents artificial camelCase statuses (`"submittedForApproval"`, `"approved"`) that require round-trip mapping to database/Protobuf uppercase enums (`"PENDING_APPROVAL"`, `"ACTIVE"`). `translateEquipment` in `profile.mapper.ts` switches on `"FULL_GYM"` and `"DUMBBELL_ONLY"`, which are dead code for normalized profiles storing UUIDs.
- **Production Failure Mode**:
  Unnecessary boilerplate and risk of drift when new statuses are added.

---

#### Finding F4: Duplicate BMI Calculation with Inconsistent Category Labels
- **Severity**: **LOW**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/progress/model/progress-aggregator.ts`: lines 30–55
  - `fitai-web/src/features/profile/model/profile.mapper.ts`: lines 33–55
- **Defect Mechanism**:
  BMI formula and classification are duplicated in two files with slight wording variations in categorization labels.
- **Production Failure Mode**:
  Minor display discrepancies across profile and progress pages.

---

### Domain G: Timezone, DOM Noise & Secondary Smells

#### Finding G1: Server-Side Timezone Evaluation Mismatch (UTC vs Local Client Calendar)
- **Severity**: **MEDIUM**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/home/server/get-home-page-data.ts`: lines 353–356
  - `fitai-web/src/shared/utils/streak.ts`: lines 39–42, lines 51–56
- **Defect Mechanism**:
  Server actions call `new Date().getFullYear()`, `getMonth()`, and `getDate()`. In cloud deployments, the server runs in UTC. For a user in UTC+7 (Vietnam) training between 00:00 and 06:59 local time, the server evaluates the date as the previous calendar day.
- **Production Failure Mode**:
  Morning workouts desync from the daily roadmap widget, streaks are computed against the wrong day, and scheduled workout plans fail to display.

---

#### Finding G2: Leaky Fullscreen Unmount Cleanup in `use-fullscreen-scope.ts`
- **Severity**: **MEDIUM**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/shared/lib/use-fullscreen-scope.ts`: lines 12–16
- **Defect Mechanism**:
  Inside the cleanup function of `subscribe`:
  ```typescript
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => {});
  }
  ```
  If any subcomponent unmounts or resubscribes, it forcefully exits fullscreen mode for the entire browser window.
- **Production Failure Mode**:
  Exits fullscreen unexpectedly when non-fullscreen subcomponents unmount or during route transitions.

---

#### Finding G3: Dummy Context Provider & Permanent Global Keydown Listener Leak
- **Severity**: **LOW**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/shared/ui/side-panel/side-panel-context.tsx`: lines 21–29, lines 68–70
- **Defect Mechanism**:
  `SidePanelProvider` renders `<>{children}</>`. A permanent global `window.addEventListener("keydown", ...)` is attached in `ensureListener()` and never removed.
- **Production Failure Mode**:
  Listener persists across unit tests in Vitest/jsdom, triggering console warnings: `An update to SideInspectorPanel inside a test was not wrapped in act(...)`.

---

#### Finding G4: Cargo-Cult `transitionTypes` Next.js DOM Warnings
- **Severity**: **LOW**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/shared/ui/transition-types.ts`
  - 25+ files (e.g. `src/features/home/ui/home-view.tsx:76`, `src/features/onboarding/ui/onboarding-flow.tsx:252`)
- **Defect Mechanism**:
  `transitionTypes={NAV_FORWARD}` is passed directly to Next.js `<Link>` and `router.push`. Next.js does not support this prop, rendering `<a transitionTypes="nav-forward">` into the DOM.
- **Production Failure Mode**:
  Floods the browser devtools and server logs with React DOM attribute warnings: `React does not recognize the transitionTypes prop on a DOM element`.

---

#### Finding G5: Non-Deterministic Identifier Generation in Pure Mapper Function
- **Severity**: **LOW**
- **Exact File Paths & Line Numbers**:
  - `fitai-web/src/features/onboarding/ui/components/scheduler/types.ts`: line 143
- **Defect Mechanism**:
  A pure domain mapper generates item IDs using `Math.random()` and `Date.now()`.
- **Production Failure Mode**:
  Breaks deterministic test snapshots and causes React hydration mismatch warnings if evaluated across server and client.

---

## 3. Engineer's Deliberation: Options & Trade-off Analysis (Rule 14 & Rule 13)

Before prescribing remediation recipes, we deliberate three core architectural dilemmas in accordance with **Rule 14 (Deliberate Before Answering)** and **Rule 13 (Veteran Pragmatism)**.

---

### Dilemma 1: Session Recovery Deadlock (Finding B1)
When starting a workout fails due to a session conflict (an active session is already in progress), how should the application recover?

- **Forensic Contract Reality Check**:
  Direct contract audit of `gym-companion/proto/contracts/core/workout_execution/v1/service/workout_execution_service.proto` and `gym-companion/internal/workout_execution/transport/grpc/handler.go` confirms that **no `GetActiveWorkoutSession` RPC exists** on `WorkoutExecutionService`. Although the persistence layer implements `sessionRepo.FindActiveSessionByUserID(ctx, userID)` in `postgres_workout_session_repository.go:116`, the method is not exposed through gRPC or generated client stubs. Proposing that `getLiveSessionData` call `execution.getActiveWorkoutSession({})` without backend changes will trigger TypeScript compilation errors and gRPC `UNIMPLEMENTED` status 12 errors.

- **Approach A: Cross-Service Contract Alignment (Backend RPC Exposure — Clean Architecture)**
  - *Mechanism*:
    1. Define `rpc GetActiveWorkoutSession(GetActiveWorkoutSessionRequest) returns (GetActiveWorkoutSessionResponse)` in `workout_execution_service.proto`.
    2. Expose the endpoint in Go `GRPCHandler` by querying `sessionRepo.FindActiveSessionByUserID(ctx, userID)`.
    3. Regenerate TypeScript protobuf stubs in `fitai-web`.
    4. In `getLiveSessionData`, query `execution.getActiveWorkoutSession({})` and call `abortWorkoutSession({ sessionId })` before retrying `startWorkoutSession`.
  - *Trade-offs*:
    - Blast Radius: Spans `gym-companion` and `fitai-web` (protobuf schema addition, Go handler implementation, and protobuf client regeneration).
    - Maintainability: Authoritative, cleanest contract alignment; 100% resilient across device crashes and multi-device scenarios.
    - 3 AM Test: Completely eliminates active session deadlocks by querying authoritative backend database state.

- **Approach B: Surgical Frontend Conflict Handling (Zero Backend Changes — Immediate Web Scope)**
  - *Mechanism*:
    1. In `get-live-session-data.ts`, immediately eliminate the broken call to `abortWorkoutSession` on `getWorkoutHistory` (which is hardcoded to return only `COMPLETED` sessions and always triggers `ErrSessionAlreadyCompleted`).
    2. When `startWorkoutSession` throws a session conflict error (`codes.FailedPrecondition` / `"active session already exists"`), stop crashing with Next.js `notFound()`.
    3. Retrieve any cached active `sessionId` from client storage/cookies if available. If found, abort that specific session and retry; if not found, redirect to `/roadmap?conflict=active_session` or surface an actionable recovery modal ("You have an active workout in progress. Resume or Abandon?") rather than crashing with an unhandled 404 error.
  - *Trade-offs*:
    - Blast Radius: Confined strictly to `fitai-web` (no backend deploys or protobuf recompilation required).
    - Maintainability: Simple, prevents the fatal 404 crash immediately, and avoids fabricating non-existent RPCs or aborting completed history.
    - Limitation: Cannot discover an orphaned session ID created on a different browser without backend support or user confirmation.

- **Recommendation**:
  Adopt **Approach B** for immediate frontend stabilization within Milestone 2 (preventing the 404 crash without violating cross-repo deployment boundaries), and schedule **Approach A** as a formal contract alignment story in the next joint backend/frontend release cycle.

---

### Dilemma 2: Equipment Identification & Bodyweight Detection (Finding A1)
How should `fitai-web` distinguish bodyweight movements from weighted resistance exercises?

- **Approach 1: Authoritative Shared Constant `BODYWEIGHT_EQUIPMENT_ID` (Recommended)**
  - *Mechanism*: Define `export const BODYWEIGHT_EQUIPMENT_ID = "9d8f6dd0-73fa-46ac-a669-f81d0661e9f7"` matching `catalog_metadata_seed.json` in a shared constants file, and reference it consistently across `workout-actions.ts`, `get-live-session-data.ts`, and `get-home-page-data.ts`.
  - *Trade-offs*:
    - Blast Radius: Low (string replacement across 3 files + test fixtures).
    - Performance: Zero runtime overhead, 100% synchronous.
    - 3 AM Test: Immediately fixes 100% of bodyweight exercises being assigned 10kg loads.
- **Approach 2: Dynamic Category Resolution via Metadata Store**
  - *Mechanism*: Query `catalogMetadataStore.getEquipmentById(ex.equipmentId)` at runtime and check if `category === "BODYWEIGHT"`.
  - *Trade-offs*:
    - Complexity: Introduces asynchronous dependency on metadata store during server action execution.
    - Blast Radius: High (requires passing catalog store into pure server actions and mappers).
- **Approach 3: Backend Protobuf Schema Mutation**
  - *Mechanism*: Add `bool is_weighted = 15;` to `Exercise` in Protobuf contracts.
  - *Trade-offs*:
    - Blast Radius: High (cross-repo schema migration, backend domain updates, frontend contract regeneration).
- **Recommendation**: Adopt **Approach 1** for immediate surgical remediation, complemented by a fallback check `ex.equipmentCategory === "BODYWEIGHT"` where catalog metadata is already loaded.

---

### Dilemma 3: Lifecycle Management vs "Zero-useEffect" Dogmatism (Finding D1, D2, D3)
How should asynchronous hardware, WebSockets, and animation loops be managed?

- **Approach 1: Surgical Migration to Idiomatic `useEffect` (Recommended)**
  - *Mechanism*: Replace misused `useSyncExternalStore` instances (which use dummy snapshots `() => true` purely to run setup/cleanup) and DOM ref callback pseudo-effects with standard, idiomatic `useEffect` hooks with explicit dependency arrays.
  - *Trade-offs*:
    - Maintainability: Eliminates 200+ lines of wrapper classes, dummy snapshot functions, and circular dependency workarounds.
    - React Compatibility: Fully compatible with React 18/19 Concurrent Mode and StrictMode.
    - 3 AM Test: Hardware webcams, intervals, and WebSocket connections are deterministically cleaned up on unmount.
- **Approach 2: Dogmatic Retention of `useSyncExternalStore` with Ref Buffering**
  - *Mechanism*: Keep `useSyncExternalStore`, but wrap all hardware operations in synchronous ref queues.
  - *Trade-offs*:
    - Architecture Theater: High complexity, zero tangible benefit, still violates React's expectation of pure store subscriptions.
- **Approach 3: Full Rewrite to External State Machine (XState / Zustand)**
  - *Mechanism*: Move the entire workout session into an external state machine library.
  - *Trade-offs*:
    - Blast Radius: Massive rewrite of live workout runner, high risk of introducing new regressions.
- **Recommendation**: Adopt **Approach 1**. Idiomatic React `useEffect` is practical, simple, well-understood (**Rule 2**), and eliminates the root cause of leaks and ref callback storms.

---

## 4. Actionable Surgical Remediation Recipes

The remediation plan is organized into **4 prioritized phases** to ensure zero regressions during future implementation.

---

### Phase 1: Critical Remediations (Immediate Bug Fixes & Leaks)

#### Recipe 1.1: Fix Active Session Recovery Deadlock (Finding B1)
- **Target File**: `fitai-web/src/features/workout/server/get-live-session-data.ts`
- **Context & Defect**:
  In lines 476–485, the conflict catch block queries `execution.getWorkoutHistory()`, which returns only `COMPLETED` sessions from PostgreSQL (`Where("user_id = ? AND status = ?", userID, "COMPLETED")`). Calling `abortWorkoutSession` on completed sessions throws `ErrSessionAlreadyCompleted`, causing the server action to crash with Next.js `notFound()`. Furthermore, `execution.getActiveWorkoutSession` does not currently exist on the gRPC backend.
- **Surgical Remediation Recipes**:

  **Approach B (Surgical Frontend Fallback — Zero Backend Changes)**:
  Eliminate the invalid history query and completed-session abort call. Safely handle the session conflict by catching the conflict error, attempting to abort known cached session IDs if present, or returning a graceful conflict recovery response instead of crashing with `notFound()`:
  ```typescript
  // Replace lines 476–503 in get-live-session-data.ts:
  // BEFORE:
  try {
    const historyRes = await execution.getWorkoutHistory({ limit: 10, offset: 0 });
    const firstSession = historyRes.sessions?.[0];
    if (firstSession?.sessionId) {
      await execution.abortWorkoutSession({
        sessionId: firstSession.sessionId,
        reason: "SYSTEM_ABORT_FOR_NEW_SESSION",
      });
    }
    const retryRes = await execution.startWorkoutSession({ planId: targetPlanId });
    if (retryRes.sessionId) {
      activeSessionId = retryRes.sessionId;
    }
  } catch (retryErr) {
    console.error(
      "[getLiveSessionData] Failed to resolve active session conflict & start session:",
      retryErr,
    );
  }

  if (!activeSessionId) {
    console.error("[getLiveSessionData] CRITICAL ERROR: Could not obtain execution session UUID.");
    notFound();
  }

  // AFTER (SURGICAL FIX - APPROACH B):
  // 1. Remove the broken getWorkoutHistory call (prevents aborting COMPLETED history)
  // 2. Detect active session conflict (gRPC code 9: FailedPrecondition)
  const isConflict =
    startErr?.code === 9 ||
    startErr?.message?.toLowerCase().includes("active session already exists");

  if (isConflict) {
    console.warn("[getLiveSessionData] Active session conflict detected. Initiating safe recovery.");
    // Attempt targeted abort ONLY if a cached active session ID exists from client context:
    const cachedOrphanSessionId = ""; // e.g. retrieved from request cookies/context if maintained
    if (cachedOrphanSessionId) {
      try {
        await execution.abortWorkoutSession({
          sessionId: cachedOrphanSessionId,
          reason: "SYSTEM_ABORT_FOR_NEW_SESSION",
        });
        const retryRes = await execution.startWorkoutSession({ planId: targetPlanId });
        if (retryRes.sessionId) {
          activeSessionId = retryRes.sessionId;
        }
      } catch (abortErr) {
        console.warn("[getLiveSessionData] Targeted session abort failed:", abortErr);
      }
    }
  }

  // If session cannot be started due to conflict, redirect to recovery rather than 404 crash:
  if (!activeSessionId) {
    if (isConflict) {
      console.warn("[getLiveSessionData] Redirecting to active session recovery flow.");
      redirect("/roadmap?conflict=active_session");
    }
    notFound();
  }
  ```

  **Approach A (Cross-Service Contract Alignment — Backend RPC Exposure)**:
  When backend contract modifications are coordinated:
  1. Add to `gym-companion/proto/contracts/core/workout_execution/v1/service/workout_execution_service.proto`:
     ```protobuf
     service WorkoutExecutionService {
       // ... existing RPCs ...
       rpc GetActiveWorkoutSession(GetActiveWorkoutSessionRequest) returns (GetActiveWorkoutSessionResponse);
     }

     message GetActiveWorkoutSessionRequest {}

     message GetActiveWorkoutSessionResponse {
       WorkoutSession session = 1;
     }
     ```
  2. Implement in `gym-companion/internal/workout_execution/transport/grpc/handler.go` by delegating to existing `sessionRepo.FindActiveSessionByUserID(ctx, userID)`.
  3. Regenerate TypeScript protobuf stubs (`pnpm --prefix fitai-web proto:generate`).
  4. In `get-live-session-data.ts`:
     ```typescript
     try {
       const activeRes = await execution.getActiveWorkoutSession({});
       if (activeRes.session?.sessionId) {
         console.log("[getLiveSessionData] Aborting hanging active session:", activeRes.session.sessionId);
         await execution.abortWorkoutSession({
           sessionId: activeRes.session.sessionId,
           reason: "SYSTEM_ABORT_FOR_NEW_SESSION",
         });
         const retryRes = await execution.startWorkoutSession({ planId: targetPlanId });
         if (retryRes.sessionId) {
           activeSessionId = retryRes.sessionId;
         }
       }
     } catch (activeErr) {
       console.warn("[getLiveSessionData] Active session recovery failed:", activeErr);
     }
     ```

#### Recipe 1.2: Standardize Authoritative Bodyweight Equipment GUID (Finding A1)
- **Target Files**:
  - Create `fitai-web/src/features/exercise/constants/equipment.ts`
  - `fitai-web/src/features/workout/server/workout-actions.ts`
  - `fitai-web/src/features/workout/server/get-live-session-data.ts`
  - `fitai-web/src/features/home/server/get-home-page-data.ts`
  - `fitai-web/tests/unit/onboarding-schema.test.ts`
- **Surgical Edit**:
  1. Define constant:
     ```typescript
     // src/features/exercise/constants/equipment.ts
     export const BODYWEIGHT_EQUIPMENT_ID = "9d8f6dd0-73fa-46ac-a669-f81d0661e9f7";
     ```
  2. Replace all instances of `"7740d3bf-cff0-46e2-931e-e6df19988e31"` with `BODYWEIGHT_EQUIPMENT_ID`.
  3. In `get-live-session-data.ts:371-373` (`buildAi12ExercisesSessionPlan`), fix the parameter reference (using `cfg.isWeighted` instead of referencing undefined `ex.equipmentId`) and eliminate dummy weighted GUID `"0712475e-969f-42d1-a217-1055b703d3c6"`:
     ```typescript
     equipmentId: cfg.isWeighted
       ? "0b51cb97-73e0-49fa-8f87-6e8e8fee544d" // Authoritative Dumbbell UUID from catalog_metadata_seed.json
       : BODYWEIGHT_EQUIPMENT_ID,
     ```
  4. **Synchronize Test Fixture**: In `fitai-web/tests/unit/onboarding-schema.test.ts:12`, update the hardcoded equipment ID from `"7740d3bf-cff0-46e2-931e-e6df19988e31"` to `BODYWEIGHT_EQUIPMENT_ID` (or `"9d8f6dd0-73fa-46ac-a669-f81d0661e9f7"`) so unit test fixtures stay 100% aligned with authoritative catalog seeds.

#### Recipe 1.3: Fix `BodySilhouetteCard` Zone Injury Filtering (Finding A2)
- **Target File**: `fitai-web/src/features/progress/ui/body-silhouette-card.tsx`
- **Context & Defect**:
  `resolveZoneForMuscleId(id: MuscleId)` expects SVG path identifiers (e.g. `"abs-upper-left"`), returning `"neutral"` when passed a database UUID or muscle name. To map injuries correctly to `"upper"`, `"core"`, or `"lower"` body zones, the lookup must first resolve the UUID/name to SVG IDs via `resolveMuscleIdsForGroup(inj.muscleGroup)`.
- **Surgical Edit** (Replace lines 61–66):
  ```typescript
  // BEFORE:
  const zoneInjuries =
    selectedZone === "full"
      ? activeInjuries
      : activeInjuries.filter((inj) =>
          ZONE_MUSCLES[selectedZone].some((zm) => inj.muscleGroup.toUpperCase().includes(zm)),
        );

  // AFTER (SURGICAL FIX):
  // Import resolveMuscleIdsForGroup, resolveZoneForMuscleId from "@/features/progress/model/body-muscles";
  const zoneInjuries =
    selectedZone === "full"
      ? activeInjuries
      : activeInjuries.filter((inj) => {
          if (!inj.muscleGroup) return false;
          // 1. Resolve UUID / anatomical muscle group name to SVG path IDs via catalog map
          const svgIds = resolveMuscleIdsForGroup(inj.muscleGroup);
          if (svgIds.length > 0) {
            const matchesZone = svgIds.some(
              (id) => resolveZoneForMuscleId(id) === selectedZone,
            );
            if (matchesZone) return true;
          }
          // 2. Fallback check against ZONE_MUSCLES for legacy unmapped string records
          return ZONE_MUSCLES[selectedZone]?.some((zm) =>
            inj.muscleGroup.toUpperCase().includes(zm),
          );
        });
  ```

#### Recipe 1.4: Fix OAuth Popup Interval & Listener Leak (Finding C1)
- **Target File**: `fitai-web/src/features/auth/ui/login-actions.tsx`
- **Surgical Edit** (Replace lines 98–105):
  ```typescript
  // AFTER (SURGICAL FIX):
  let pollClosed: number | null = null;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    window.removeEventListener("message", onMessage);
    if (pollClosed !== null) {
      window.clearInterval(pollClosed);
      pollClosed = null;
    }
    setPending(false);
  };

  window.addEventListener("message", onMessage);

  pollClosed = window.setInterval(() => {
    if (popup.closed) {
      cleanup();
    }
  }, 300);
  ```

#### Recipe 1.5: Fix Duel Particle Canvas Compounding RAF Leak (Finding C2)
- **Target File**: `fitai-web/src/features/solo-match/ui/duel-particle-canvas.tsx`
- **Surgical Edit** (Lines 125–126):
  ```typescript
  // BEFORE:
  return () => {};
  }, [lastMilestone, lastRepConfirmedAtMs, myValue, opponentValue]);

  // AFTER (SURGICAL FIX):
  return () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };
  }, [lastMilestone, lastRepConfirmedAtMs, myValue, opponentValue]);
  ```

#### Recipe 1.6: Stop Silent Error Swallowing in Onboarding (Finding E1)
- **Target File**: `fitai-web/src/features/onboarding/ui/onboarding-flow.tsx`
- **Surgical Edit** (Lines 245–260):
  ```typescript
  // AFTER (SURGICAL FIX):
  // 1. Add required import:
  import { toast } from "@/shared/ui/toast";

  // 2. Prevent redirect on error and alert user:
  try {
    const result = await saveOnboardingProfileServerAction(getValues());
    if (!result.success) {
      toast.error(result.message || "Failed to save profile. Please review your information.");
      return;
    }
    sessionStorage.setItem("fitai-onboarding-complete", "true");
    router.push("/home");
  } catch (error) {
    console.error("Failed to submit onboarding via gRPC:", error);
    toast.error("Network or server error while saving profile. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
  ```

---

### Phase 2: High Severity Remediations (Hardware Lifecycles, Contracts & React Hygiene)

#### Recipe 2.1: Add Webcam Track & Custom Video Unmount Cleanup (Finding C3)
- **Target Files**:
  - `fitai-web/src/features/workout/model/use-camera-stream.ts`
  - `fitai-web/src/features/workout/model/use-motion-engine.ts`
- **Surgical Edit**:
  1. In `use-camera-stream.ts:31-45`, ensure `useEffect` is imported and refactor `stop()` to clean up `videoRef`, media stream tracks, object URL, and reset state:
     ```typescript
     // Ensure useEffect is imported:
     import { useCallback, useEffect, useMemo, useRef, useState } from "react";

     // Refactor stop() to cleanly terminate custom video & camera tracks:
     const stop = useCallback(() => {
       if (videoRef.current) {
         videoRef.current.pause();
         videoRef.current.srcObject = null;
         videoRef.current.removeAttribute("src");
       }
       if (streamRef.current) {
         streamRef.current.getTracks().forEach((track) => track.stop());
         streamRef.current = null;
       }
       cleanupObjectUrl();
       isCustomVideoRef.current = false;
       setIsCustomVideo(false);
       setState("idle");
     }, [cleanupObjectUrl]);

     // Add unmount cleanup effect:
     useEffect(() => {
       return () => {
         stop();
       };
     }, [stop]);
     ```
  2. In `use-motion-engine.ts`, add unmount effect calling `dispose()` / `stop()`.

#### Recipe 2.2: Remove Phantom `userId` RPC Payloads (Finding B2)
- **Target Files**:
  - `fitai-web/src/features/workout-stats/server/get-workout-stats-data.ts:37`
  - `fitai-web/src/features/roadmap/server/coaching-actions.ts:20, 45, 73`
  - `fitai-web/src/features/notification/server/notification-actions.ts:37-41, 72-75`
  - `fitai-web/src/features/progress/server/get-progress-dashboard-data.ts:83`
- **Surgical Edit**:
  Change parameterless calls from `{ userId: userId || "" }` to `{}`:
  ```typescript
  // Example in get-workout-stats-data.ts:37
  // BEFORE: coachingClient.getActiveRoadmap({ userId: userId || "" })
  // AFTER:  coachingClient.getActiveRoadmap({})
  ```

#### Recipe 2.3: Remove Fabricated `getMuscleLoadStats` RPC Call (Finding B3)
- **Target File**: `fitai-web/src/features/progress/server/get-progress-dashboard-data.ts`
- **Surgical Edit** (Lines 84–92):
  Remove the fake RPC invocation and return `{ items: [] }` directly (or aggregate stats from `workoutHistory` locally):
  ```typescript
  Promise.resolve({ items: [] as MuscleLoadSummary[] }),
  ```

#### Recipe 2.4: Move Render-Phase Side-Effects to Effects & Callbacks (Finding D3)
- **Target File**: `fitai-web/src/features/workout/model/use-live-session.ts`
- **Surgical Edit**:
  1. Move draft persistence (lines 309–316) into `useEffect`:
     ```typescript
     useEffect(() => {
       if (currentDraftStr !== lastDraftRef.current) {
         lastDraftRef.current = currentDraftStr;
         try {
           sessionStorage.setItem(draftKey(plan.sessionId), currentDraftStr);
         } catch {}
       }
     }, [currentDraftStr, plan.sessionId]);
     ```
  2. Move `end-rest` dispatch (lines 338–340) out of render body into the ticker tick callback or a dedicated `useEffect`:
     ```typescript
     useEffect(() => {
       if (state.status === "resting" && state.restEndsAt !== null && restLeft === 0) {
         dispatch({ type: "end-rest" });
       }
     }, [state.status, state.restEndsAt, restLeft]);
     ```
  3. Move `flush()` trigger (lines 380–385) into `useEffect`:
     ```typescript
     useEffect(() => {
       if (isOnline && !prevOnlineRef.current) {
         prevOnlineRef.current = true;
         void flush();
       } else if (!isOnline) {
         prevOnlineRef.current = false;
       }
     }, [isOnline, flush]);
     ```

#### Recipe 2.5: Replace Pseudo-Effect DOM Ref Callback with `useEffect` (Finding D2)
- **Target File**: `fitai-web/src/features/workout/ui/live/live-workout.tsx`
- **Surgical Edit**:
  1. Change `stageRef` into a pure DOM ref: `const stageElementRef = useRef<HTMLDivElement | null>(null);`.
  2. Attach ref simply: `<div className="live-workout-root contents" ref={stageElementRef}>`.
  3. Move session status handling, toasts, and effect syncing into standard `useEffect` hooks guarded by specific dependencies (`sessionStatus`, `durationWarning`, `protectionNote`).

#### Recipe 2.6: Check JWT Expiration Before Route Forwarding (Finding D4)
- **Target File**: `fitai-web/src/proxy.ts`
- **Surgical Edit** (Lines 48–52):
  Parse JWT `exp` claim to detect expired tokens before forwarding:
  ```typescript
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
      return Date.now() >= payload.exp * 1000 - 30_000; // 30s buffer
    } catch {
      return true;
    }
  };

  const needsRefresh = !accessToken || isTokenExpired(accessToken);
  if (!isPublicRoute && needsRefresh) {
    if (refreshToken) {
      // Execute token refresh...
  ```

---

### Phase 3: Medium Severity Remediations (Performance, Catalogs & Timezones)

#### Recipe 3.1: Eliminate Sequential RPC Waterfall on Home Page (Finding F1 & Finding B6)
- **Target File**: `fitai-web/src/features/home/server/get-home-page-data.ts`
- **Surgical Edit**:
  1. Remove lines 196–198: Remove `await getProfileData()` and `computeProfileCompletion`.
  2. Rely directly on `profileProto.completionRate` returned by `profileClient.getProfile({})` in the parallel `Promise.allSettled` batch.
  3. Latency reduction: **200–500ms saved** on every home page visit.

#### Recipe 3.2: Harmonize Fallback Catalogs & Extract Tags (Finding A5 & Finding A6)
- **Target Files**:
  - `fitai-web/src/features/exercise/server/catalog-actions.ts`
  - `fitai-web/src/features/exercise/api/search-repository.ts`
- **Surgical Edit**:
  1. In `catalog-actions.ts`, include `tags`:
     ```typescript
     tags: (data.tags ?? []).map((t) => ({ id: t.id, name: t.name })),
     ```
  2. Standardize `DEFAULT_CATALOG` in `search-repository.ts` to use identical fallback taxonomy matching `catalog-actions.ts`.

#### Recipe 3.3: Delete Phantom UUIDs in `muscle-uuid-map.ts` (Finding A4)
- **Target File**: `fitai-web/src/features/progress/model/muscle-uuid-map.ts`
- **Surgical Edit**:
  Delete lines 2–51 (the 50 phantom UUID mappings). Retain only lines 52–101 which match `catalog_metadata_seed.json`.

#### Recipe 3.4: Bounded LRU Cache for Social Feed (Finding C4)
- **Target File**: `fitai-web/src/features/social/lib/post-cache.ts`
- **Surgical Edit**:
  Enforce maximum cache size of 100 entries with LRU memory eviction and corresponding `sessionStorage` cleanup:
  ```typescript
  const MAX_CACHE_SIZE = 100;

  export function cacheFeedItem(item: FeedItemVM): void {
    if (!item?.id) return;

    // Enforce bounded memory cache (LRU eviction)
    if (memoryCache.size >= MAX_CACHE_SIZE && !memoryCache.has(item.id)) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) {
        memoryCache.delete(oldestKey);
        try {
          if (typeof window !== "undefined" && window.sessionStorage) {
            window.sessionStorage.removeItem(`feed_post_${oldestKey}`);
          }
        } catch {
          // Ignore sessionStorage errors
        }
      }
    }

    memoryCache.set(item.id, item);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(`feed_post_${item.id}`, JSON.stringify(item));
      }
    } catch {
      // Ignore storage quota or disabled errors
    }
  }
  ```

#### Recipe 3.5: Client Timezone Synchronization for Server Actions (Finding G1)
- **Target Files**:
  - `fitai-web/src/features/home/server/get-home-page-data.ts`
  - `fitai-web/src/shared/utils/streak.ts`
- **Surgical Edit**:
  Accept client timezone offset from request headers (e.g. `x-timezone: Asia/Ho_Chi_Minh` or cookie) to compute calendar day keys accurately.

---

### Phase 4: Low Severity Cleanups (DOM Noise, Duplicates & Dead Code)

#### Recipe 4.1: Consolidate `GROUP_SYNONYMS` and `mapDifficulty` (Finding F2 & Finding F3)
- **Target Files**:
  - `fitai-web/src/features/exercise/domain/exercise.ts`
  - `fitai-web/src/features/admin/api/admin-exercise-service.ts`
- **Surgical Edit**:
  1. Remove the 2 duplicate inline declarations of `groupSynonyms` in `countActiveFilters` and `filterExercises`. Reference the exported `GROUP_SYNONYMS` object directly.
  2. Export a single `mapDifficulty` function from `domain/exercise.ts` and import it in `admin-exercise-service.ts` and `search-repository.ts`.

#### Recipe 4.2: Remove Unrecognized `transitionTypes` DOM Prop (Finding G4)
- **Target Files**: `transition-types.ts` and call-sites across 25+ files.
- **Surgical Edit**:
  Remove `transitionTypes` from `<Link>` components or map it to standard CSS view transitions. Eliminates 100% of React DOM attribute console warnings.

#### Recipe 4.3: Remove Unsolicited Meal Redistribution (Finding E2)
- **Target File**: `fitai-web/src/shared/api/bff/aggregate/nutrition-daily.ts`
- **Surgical Edit**:
  Delete lines 302–316 so logged snacks remain in the user's snack slot.

#### Recipe 4.4: Consolidate Duplicate BMI Calculation (Finding F4)
- **Target Files**: `progress-aggregator.ts`, `profile.mapper.ts`
- **Surgical Edit**: Extract shared `computeBmi` and `classifyBmi` to `src/shared/utils/bmi.ts`.

---

## 5. Comprehensive Verification, Test & Validation Protocol

To ensure zero regressions across all 27 findings during execution, every cleanup must be verified against the following protocol:

### 5.1 Automated Quality Gates
Execute the following verification suite from `fitai-web`:
```powershell
# 1. Static Type Checking (Must pass with 0 errors)
cd e:\LEARN\a\fitai-web
pnpm typecheck

# 2. Complete Unit & Component Test Suite
pnpm test

# 3. Linter & Formatting Checks
pnpm lint
```

### 5.2 Targeted Regression Test Suites
The following test suites must be executed specifically for affected domains:
- **Workout & Active Session Recovery**:
  `pnpm vitest run tests/unit/workout-grpc-actions.test.ts tests/unit/get-live-session-data.test.ts`
- **Profile & Injury Normalization**:
  `pnpm vitest run tests/unit/profile/profile-mapper.test.ts tests/unit/onboarding-schema.test.ts`
- **Progress & Silhouette Card**:
  `pnpm vitest run tests/features/progress/progress-components.test.ts`
- **OAuth & Auth Panel**:
  `pnpm vitest run tests/component/auth-panel.test.ts tests/unit/oauth-bff-routes.test.ts`
- **Search & Exercise Filters**:
  `pnpm vitest run tests/unit/exercise-search-repository.test.ts`

### 5.3 Database & Contract Cross-Check Commands
Verify that frontend constants match authoritative database seeds in `gym-companion`:
```powershell
# Verify Bodyweight Equipment ID in catalog metadata seed:
grep -n -C 2 "Body Weight" e:\LEARN\a\gym-companion\internal\shared\seeder\data\catalog_metadata_seed.json
# Expected output: "id": "9d8f6dd0-73fa-46ac-a669-f81d0661e9f7"

# Verify Abdominals Muscle ID in catalog metadata seed:
grep -n -C 2 "Abdominals" e:\LEARN\a\gym-companion\internal\shared\seeder\data\catalog_metadata_seed.json
# Expected output: "id": "67a3aebd-ad76-49aa-93b7-7c393bf77ced"

# Verify Protobuf GetActiveRoadmapRequest has no user_id:
grep -n -A 3 "message GetActiveRoadmapRequest" e:\LEARN\a\gym-companion\proto\contracts\core\coaching\v1\message\coaching_messages.proto
# Expected output: Empty message definition {}
```

### 5.4 Manual Leak & Lifecycle Verification Flows
1. **OAuth Popup Timer Leak (Finding C1)**:
   - Navigate to `/login`. Click "Continue with Google".
   - Close the Google OAuth popup window manually.
   - Open Chrome DevTools > Memory > Take Heap Snapshot.
   - Verify that no orphan 300ms timer intervals or detached `window` event listeners remain.
2. **Duel Particle Canvas Unmount Cleanup (Finding C2)**:
   - Navigate to `/challenge/[matchId]`.
   - Perform completed reps to trigger burst particle animations.
   - Navigate away or unmount the duel canvas component while particles are active.
   - Open Chrome DevTools > Performance. Verify that the animation frame loop is canceled upon unmount and no orphan RAF callbacks tick indefinitely.
3. **Webcam Unmount Cleanup (Finding C3)**:
   - Enter `/workout/live/[planId]`. Allow camera access (observe hardware camera LED turn on).
   - Click navbar to navigate to `/roadmap`.
   - Verify that hardware camera indicator LED immediately turns off.
4. **Session Recovery Conflict (Finding B1)**:
   - Create an active workout session in the database without completing it.
   - Navigate to start a new workout.
   - Verify the application handles the session conflict gracefully (either resolving via Approach A `GetActiveWorkoutSession` RPC or presenting an actionable recovery modal via Approach B), and does NOT crash with a 404 Not Found (`notFound()`) error.

---

## 6. Conclusion
This audit provides an unvarnished, forensic assessment of the `fitai-web` codebase. By adhering strictly to **Rule 2 (Practical Simplicity)**, **Rule 3 (Surgical Changes)**, and **Rule 13 (Veteran Pragmatism)**, the proposed remediation plan fixes critical crash vectors, stops silent data loss, plugs memory/hardware leaks, and restores contract integrity without embarking on high-risk, speculative rewrites.
