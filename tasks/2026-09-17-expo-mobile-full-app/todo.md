# Todo: FITAI Mobile Native Full-Application Plan

Checklist công việc được trích xuất trực tiếp từ mục "Order of work" của `plan.md` sau khi đạt kiểm toán APPROVED (100/100) từ SDLC Auditor & Architect.

- [x] 1. Bóc tách Headless Logic & Design Tokens dùng chung: Viết `src/shared/design-system/tokens.ts`, `src/shared/ui/charts/use-circular-progress.ts`, `src/features/workout/domain/session-timer-math.ts`; cập nhật `circular-progress.tsx` và `use-session-timer.ts`; chạy test xác nhận Web 100% pass (Zero Regression).
- [x] 2. Chuẩn bị cấu hình & Mở rộng TSConfig: Cập nhật `mobile/tsconfig.json` mở rộng trường `include` bao quát `app/**/*.tsx` và `app/**/*.ts`.
- [x] 3. Xây dựng Tầng Lưu trữ MMKV + SecureStore: Viết `mobile/src/shared/lib/storage.ts`, `mobile/src/shared/lib/secure-storage.ts`, và `mobile/src/shared/lib/offline-queue.ts`.
- [x] 4. Xây dựng Bộ Linh kiện UI Primitives & 3 Trạng thái Giao diện: Viết `theme.ts`, `loading-state.tsx`, `error-state.tsx`, `empty-state.tsx`, `card.tsx`, `button.tsx`, `badge.tsx`.
- [x] 5. Xây dựng Tầng Truyền thông gRPC & Auth Store: Viết `mobile/src/shared/api/client-transport.ts` (ConnectRPC native transport) và `mobile/src/features/auth/model/auth-store.ts`.
- [x] 6. Xây dựng Engine Quản lý Buổi tập & Crash Recovery: Viết `mobile/src/features/workout/model/active-workout-store.ts` và `mobile/src/features/workout/model/rest-timer.ts`.
- [x] 7. Xây dựng Domain Stores cho các Phân hệ: Viết `today-dashboard.ts`, `roadmap-store.ts`, `nutrition-store.ts`, `profile-store.ts`, `exercise-catalog-store.ts`.
- [x] 8. Thiết lập Khung Điều hướng Expo Router v4 (Root Shell & Auth Screens): Viết `mobile/app/_layout.tsx`, `mobile/app/index.tsx`, `mobile/app/(auth)/login.tsx`, `mobile/app/(auth)/onboarding.tsx`.
- [x] 9. Thiết lập Bottom Navigation Bar & Màn hình Chính: Viết `mobile/app/(tabs)/_layout.tsx`, `today.tsx`, `workout.tsx`, `nutrition.tsx`, `roadmap.tsx`, `profile.tsx`.
- [x] 10. Xây dựng Màn hình Chi tiết Buổi tập & Modal Tính năng: Viết `mobile/app/workout/live.tsx`, `mobile/app/workout/summary.tsx`, `mobile/app/nutrition/log-meal.tsx`, `mobile/app/search/index.tsx`.
- [x] 11. Viết Bộ Kiểm thử Tự động Toàn diện & Chạy Nghiệm thu: Viết 5 test suites Vitest (`mobile-storage`, `mobile-offline-queue`, `mobile-active-workout-recovery`, `mobile-auth-transport`, `mobile-ui-states`), chạy `pnpm test tests/unit/mobile`, `pnpm typecheck`, `pnpm lint`, và `pnpm run task:check`.
