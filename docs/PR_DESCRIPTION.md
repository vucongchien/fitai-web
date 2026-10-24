## Summary

This PR connects the Social Public Profile to real backend Connect-RPC services, unifies the entire social surface under the `/community` route hierarchy, and implements a resilient `<BackButton />` component with external referrer protection.

---

### 1. Connect-RPC Social Service Integration

- Sourced author identity (`fullName`, `avatarUrl`, `role`) and social engagement metrics (`followerCount`, `followingCount`, `postCount`, `isFollowing`) directly from gRPC `SocialService.GetSocialSummary`.
- Handled zero-post profiles gracefully without falling back to scraping user info from first feed items.
- Standardized ViewModel classes to clean plain objects (`PublicProfileVM`, `SocialSummaryVM`) for seamless React Server Component (RSC) boundary serialization.

---

### 2. Route Unification (`/community`)

Consolidated previously fragmented `/social/*` routes into a unified `/community` namespace while preserving Next.js Route Groups for mobile layout optimization:

| URL Endpoint                | Route Group Location                                  | Layout Behavior                                        |
| :-------------------------- | :---------------------------------------------------- | :----------------------------------------------------- |
| `/community`                | `src/app/(main)/community/page.tsx`                   | Standard shell with App Header & Bottom Navigation bar |
| `/community/posts/[postId]` | `src/app/(focused)/community/posts/[postId]/page.tsx` | Fullscreen focused header with dedicated Thread view   |
| `/community/users/[userId]` | `src/app/(focused)/community/users/[userId]/page.tsx` | Fullscreen focused header with user profile & tabs     |

- Internal business code remains cleanly encapsulated under `src/features/social/`.
- Updated all internal links in `FeedCard`, `ThreadView`, `ThreadCommentItem`, and `ReactionBar`.
- Completely removed dead code folders from `src/app/(focused)/social/`.

---

### 3. Resilient Navigation (`<BackButton />`)

Created a unified, accessible `<BackButton fallbackHref="/community" />` component (`src/shared/ui/back-button.tsx`):

- **Smart Browser Pop vs Fallback**: Calls `router.back()` when internal history exists (`window.history.length > 1`), and falls back safely to `fallbackHref` when navigating directly.
- **External Referrer Guard**: Prevents bouncing the user out to search engines or social apps (e.g. Google, Facebook) when opening direct links in the same tab.
- **Haptic Touch & Accessibility**: Integrated 25ms mobile touch tick (`triggerHaptic`) and keyboard focus ring.

---

## Screenshots & Visual Verification

|                                                              1. Community Feed (`/community`)                                                               |                                                        2. User Profile (`/community/users/[id]`)                                                        |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------: |
| ![01 Community Feed](https://raw.githubusercontent.com/vucongchien/fitai-web/feat/social-public-profile-connect-rpc/docs/screenshots/01_community_feed.png) | ![02 User Profile](https://raw.githubusercontent.com/vucongchien/fitai-web/feat/social-public-profile-connect-rpc/docs/screenshots/02_user_profile.png) |

|                                                        3. Thread Detail (`/community/posts/[id]`)                                                         |                                                                  4. Back Navigation to Feed                                                                  |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------: |
| ![03 Thread Detail](https://raw.githubusercontent.com/vucongchien/fitai-web/feat/social-public-profile-connect-rpc/docs/screenshots/03_thread_detail.png) | ![04 Back to Feed](https://raw.githubusercontent.com/vucongchien/fitai-web/feat/social-public-profile-connect-rpc/docs/screenshots/04_back_to_community.png) |

---

## Testing & Quality Assurance

- **End-to-End Live Browser Testing**: Verified Community ➔ Profile ➔ Thread ➔ Back to Profile ➔ Back to Community with zero runtime errors.
- **Component & Unit Tests**: All 22 tests in `tests/component/back-button.test.tsx`, `tests/component/thread-comments-flow.test.tsx`, and `tests/unit/social` passed 100%.
- **Pre-commit Pipeline**: Skills audit, comments policy, oxlint, Vitest, TypeScript check, and Next.js production build (`next build`) passed cleanly.

---

> [!NOTE]
> **AI Usage Disclosure (Rule 6):** This PR was developed with AI assistance (Antigravity). Human maintainer review and testing required before merging.
