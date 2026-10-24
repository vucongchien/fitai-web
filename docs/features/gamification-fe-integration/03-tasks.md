# Gamification Front-End Integration — Tasks

> References: [01-spec.md](./01-spec.md) · [02-design.md](./02-design.md) · [ADR-0001](./adr/ADR-0001-hybrid-gamification-transport.md) · [ADR-0002](./adr/ADR-0002-post-workout-animation-buffer.md)

---

## Phase 1: Gateway & SSR Data Integration (Foundation)

- [ ] **T-01** [FR-01]: Whitelist `contracts.supporting.gamification.v1.service.GamificationService` in `src/shared/api/bff/allowed-services.ts`.
- [ ] **T-02** [FR-01]: Update unit test `tests/unit/allowed-services.test.ts` verifying `GamificationService` is allowed through the proxy.
- [ ] **T-03** [FR-02]: Update `src/features/home/server/get-home-page-data.ts`:
  - Initialize `createClient(GamificationService, transport)`.
  - Invoke `gamificationClient.getStreak({})` inside `Promise.allSettled`.
  - Remove hand-rolled `calculateConsecutiveStreakDays(history)` and map canonical `currentStreak`, `longestStreak`, and `isActiveToday` to `home-page.types.ts`.
- [ ] **T-04** [FR-03]: Update `src/features/profile/server/get-profile-data.ts`:
  - Concurrently fetch `gamificationClient.getMyXp({})`, `getStreak({})`, `getMyBadges({})` inside `Promise.allSettled`.
  - Update `profile.types.ts` & `profile.mapper.ts`: Remove mock `Math.floor(totalWorkouts / 4)`, accurately map `level`, `xp`, `xpToNextLevel`, `levelProgressPercentage`, `badges`, and `longestStreakDays`.

---

## Phase 2: Profile Badges Carousel & Hero Update

- [ ] **T-05** [FR-04]: Create `ProfileBadgesCarousel` component → `src/features/profile/components/profile-badges-carousel.tsx`:
  - Horizontal scroll container with `flex gap-3 overflow-x-auto scrollbar-none snap-x`.
  - Render circular avatar/icon inside each badge card:
    - Unlocked: Vibrant color, amber/gold glow border.
    - Locked: 50% grayscale opacity + small padlock `🔒` badge.
  - Floating circular `>` button (`ChevronRight`) with smooth scrolling (`scrollBy({ left: 200, behavior: 'smooth' })`).
- [ ] **T-06** [FR-04]: Create `BadgeDetailModal` component → `src/features/profile/components/badge-detail-modal.tsx`:
  - Triggered by clicking any badge in the carousel.
  - Displays enlarged icon, full badge name, unlock criteria, and unlocked date.
- [ ] **T-07** [FR-03, FR-04]: Update `ProfileHeroCard` (`src/features/profile/components/profile-hero-card.tsx`) and mount `ProfileBadgesCarousel` into `src/features/profile/components/profile-content.tsx` directly below the Hero Card.

---

## Phase 3: Duolingo Staged Celebration Deck

- [ ] **T-08** [FR-05]: Create celebration cards and state machine controller → `src/features/workout/ui/live/celebration-deck.tsx`:
  - Step 1: `BaseSessionSummaryCard` (Stats pills: XP, Form Accuracy, Duration/Volume).
  - Step 2: `StreakMilestoneCard` (Fiery Mascot, big numbers, Share & Continue).
  - Step 3: `BadgeUnlockedCard` (3D Badge rays, PR Breaker / Streak unlock, Share & Continue).
  - Step 4: `LeaderboardPromotionCard` (Top 3 Podium, percentile rank, Share & Continue).
- [ ] **T-09** [FR-05, FR-06]: Mount `CelebrationDeck` into `src/features/workout/ui/live/workout-summary-view.tsx`:
  - Mount deck as prominent modal / full-page transition.
  - Trigger background verification query (`getStreak` and `getMyXp`) during user taps so cache revalidates before returning home.

---

## Phase 4: Verification & Quality Gates

- [ ] **V-01** [AC-01]: Route `/rpc/.../GamificationService/...` returns data successfully, not `403 Forbidden`.
- [ ] **V-02** [AC-02]: Zero references to `Math.floor(totalWorkouts / 4)` remain in the frontend codebase.
- [ ] **V-03** [AC-03]: Home Page displays canonical streak from Backend Gamification.
- [ ] **V-04** [AC-04]: Profile Page displays horizontal Badges Carousel with circular `>` button, opening detail modal on click.
- [ ] **V-05** [AC-05]: Summary screen runs the multi-stage celebration deck before navigating home.
- [ ] **V-06** [AC-06]: Entire test suite (`pnpm test`) and `pnpm typecheck` pass with zero regressions.
