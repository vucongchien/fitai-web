# ADR-0001: Hybrid Gamification Transport Architecture

## Status: Accepted

## Context

Frontend (`fitai-web`) cần tích hợp với `GamificationService` từ Backend Go (`gym-companion`). Có 2 nhu cầu khác nhau:

1. **First Paint (Home & Profile):** Cần hiển thị Streak và Level ngay khi HTML trả về từ server, không được giật layout (zero CLS) và không được nhấp nháy skeleton.
2. **Interactive & Post-Workout (Workout Summary & Badges Modal):** Cần gọi API động sau khi kết thúc buổi tập, hoặc khi người dùng click xem chi tiết huy hiệu.

Các lựa chọn:

1. _Pure Client-Side (React Query qua `/rpc/...`):_ Gây CLS ở Header và Profile, phụ thuộc hoàn toàn vào client JS.
2. _Pure SSR (Chỉ gọi qua Server Component):_ Màn hình kết thúc bài tập không thể refresh động nếu không reload cứng toàn trang.
3. _Hybrid Architecture:_ Kết hợp SSR cho First-Paint và Client-Side ConnectRPC cho Post-workout / interactive modals.

## Decision

**Áp dụng Hybrid Transport Architecture:**

1. **Server-Side SSR:** Trong `getHomePageData` và `getProfileData`, sử dụng `createServerTransport(accessToken)` bọc trong `Promise.allSettled` để gọi đồng thời `GetStreak`, `GetMyXp`, `GetMyBadges`.
2. **Client-Side BFF Whitelist:** Mở quyền `contracts.supporting.gamification.v1.service.GamificationService` trong `allowed-services.ts` để các component client (`workout-summary-view.tsx`, `ProfileBadgesCarousel`) có thể gọi RPC trực tiếp qua endpoint `/rpc/...`.

## Rationale

- Đạt được zero CLS cho người dùng khi vào trang chủ hoặc hồ sơ.
- Đảm bảo tính linh hoạt cho màn hình kết thúc buổi tập (chạy animation và background sync mượt mà).
- Tuân thủ nhất quán với kiến trúc Next.js App Router hiện có của dự án.

## Consequences

- Cần bổ sung `GamificationService` vào `allowedRpcServices` và cập nhật unit test `allowed-services.test.ts`.
- Mở rộng kiểu dữ liệu của `ProfileViewModel` và `HomePageData`.
- Nếu Backend Gamification gặp sự cố, Server Components fallback về default values mà không gây HTTP 500 (Graceful Degradation).
