# Workout Schedule & Estimated Duration Test Plan (Clean iOS Edition)

Comprehensive test plan and index for the clean, iOS-style Workout Schedule (`preferred_workout_times`) and Estimated Duration (`estimated_duration_minutes`) system.

---

## 📑 Table of Contents

1. [Test Objectives](#1-test-objectives)
2. [Test Suite Structure & File Directory](#2-test-suite-structure--file-directory)
3. [Detailed Test Scenarios](#3-detailed-test-scenarios)
   - [3.1 Schedule Engine & Normalizer](#31-schedule-engine--normalizer)
   - [3.2 Zod Validation Schema](#32-zod-validation-schema)
   - [3.3 Server Action & gRPC Transport](#33-server-action--grpc-transport)
   - [3.4 UI Components & Clean iOS Picker](#34-ui-components--clean-ios-picker)
   - [3.5 Roadmap & SessionPlan Duration Mapping](#35-roadmap--sessionplan-duration-mapping)
4. [Execution Commands](#4-execution-commands)

---

## 1. Test Objectives

- **Rest Days vs. Active Training Days**: Verify that unselected days in Key-Value map are strictly treated as dedicated **Rest Days**. The AI Agent must never schedule workouts on these days.
- **Estimated Duration Synchronization**: Verify accurate conversion from time slot ranges (`HH:mm-HH:mm`) to duration minutes (e.g. `06:00-07:30` $\rightarrow$ 90 mins) and proper precedence of `estimated_duration_minutes` from SessionPlan.
- **Backward Compatibility**: Seamless support for modern Key-Value map, standardized protobuf string arrays (`mon:06:00-07:30`), and legacy AM/PM strings.
- **Clean iOS Aesthetics & Error Handling**: Ensure zero clutter, elegant segmented controls, 7-day pill selectors, and graceful empty/error states.

---

## 2. Test Suite Structure & File Directory

| Test File | Target Scope | Purpose |
| :--- | :--- | :--- |
| `tests/unit/workout-times-normalizer.test.ts` | `normalizeWorkoutTimes`, `validateTimeSlot`, `calculateSlotDurationMinutes`, `calculateWeeklyScheduleStats`, `applyWeeklyPreset` | Complete verification of time normalization, slot duration math, weekly metrics, and presets. |
| `tests/unit/onboarding-schema.test.ts` | `onboardingSchema`, `onboardingDefaults` | Validates Zod schema accepting Key-Value map and rejecting empty schedule submissions. |
| `tests/unit/onboarding-grpc-actions.test.ts` | `saveOnboardingProfileServerAction` | Verifies schedule serialization into standardized proto string array for `ProfileService.SaveHealthProfile`. |
| `tests/unit/profile/profile-actions.test.ts` | `updateProfileServerAction`, `mapGoalToEnum`, `mapEquipmentToEnum`, `mapCoachStyleToEnum` | Verifies server action profile updates, non-breaking modal isolation, and enum mappers. |
| `tests/unit/profile/profile-components.test.tsx` | `ProfileContent`, `PersonalInfoForm`, `WorkoutSchedulePicker` | Verifies component rendering, modal opening, and user interaction. |
| `tests/unit/profile/profile-mapper.test.ts` | `mapRawDataToProfileViewModel`, `calculateBMI`, `calculateOneRepMax` | Verifies profile ViewModel mapping, safe defaults, and calculations. |

---

## 3. Detailed Test Scenarios

### 3.1 Schedule Engine & Normalizer
- **Case N1 (Day Key Normalization)**: English day abbreviations (`mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`).
- **Case N2 (Slot Duration Math)**:
  + `06:00-07:30` $\rightarrow$ 90 minutes.
  + `17:30-19:00` $\rightarrow$ 90 minutes.
  + `18:00-18:45` $\rightarrow$ 45 minutes.
  + Legacy `PM` / `AM` $\rightarrow$ default 60 minutes.
- **Case N3 (Time Slot Validation)**:
  + Accepts valid windows (20 to 240 mins).
  + Rejects under 20 mins or exceeding 4 hours.
  + Rejects malformed time strings.
- **Case N4 (Universal Normalizer)**:
  + Key-Value map: `{"mon": ["06:00-07:30", "17:30-19:00"]}`.
  + Standardized string array: `["mon:06:00-07:30", "fri:18:00-19:30"]`.
  + Migrates legacy strings: `["Mon PM", "Wed PM", "Fri PM"]` $\rightarrow$ `17:30-19:00`.
- **Case N5 (Protobuf Array Serialization)**: Serializes into `["mon:06:00-07:30", "wed:17:30-19:00"]`.
- **Case N6 (Weekly Schedule Stats)**: Accurately calculates `activeDaysCount`, `totalSlotsCount`, `avgDurationMinutes`, `totalHoursPerWeek`, and `restDays`.

### 3.2 Zod Validation Schema
- **Case S1**: Accepts valid Key-Value map `{ mon: ["06:00-07:30"] }`.
- **Case S2**: Accepts legacy string array `["Mon PM", "Wed PM"]`.
- **Case S3**: Rejects empty array `[]` with `"Choose at least one preferred workout time window."`.
- **Case S4**: Rejects empty object `{}` with zero selected slots.

### 3.3 Server Action & gRPC Transport
- **Case G1**: `saveOnboardingProfileServerAction` normalizes schedule and transmits to gRPC.
- **Case G2**: `updateProfileServerAction` merges profile data without overwriting other tabs.
- **Case G3**: Resilient error handling on network failure.

---

## 4. Execution Commands

```bash
# Run schedule normalizer tests
pnpm vitest run tests/unit/workout-times-normalizer.test.ts

# Run onboarding schema and actions
pnpm vitest run tests/unit/onboarding-schema.test.ts
pnpm vitest run tests/unit/onboarding-grpc-actions.test.ts

# Run profile actions and UI tests
pnpm vitest run tests/unit/profile/

# TypeScript Typecheck
pnpm typecheck
```
