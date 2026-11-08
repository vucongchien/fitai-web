# Leaderboard (Bảng Xếp Hạng) Front-End — Tasks Breakdown

> References: [01-spec.md](./01-spec.md) · [02-design.md](./02-design.md)

---

## Phase 1: Data Contracts & Server Fetcher (BFF)

- [x] **T-LB-01** [FR-01, FR-02]: Định nghĩa ViewModels tại `src/features/leaderboard/model/leaderboard.types.ts`:
  - `LeaderboardEntryVM` (`rank`, `userId`, `displayName`, `avatarUrl`, `xp`, `level`, `isCurrentUser`).
  - `LeaderboardDataVM` (`topEntries`, `podium`, `rankedList`, `myStanding`, `totalParticipants`).
  - `LeaderboardFilterTab` (`"global"` | `"weekly"`).
- [x] **T-LB-02** [FR-02]: Xây dựng mapper tại `src/features/leaderboard/model/leaderboard.mapper.ts`:
  - `mapLeaderboardResponse(response, currentUserId)` chuyển đổi an toàn BigInt sang number, sắp xếp Top 3 thành cấu trúc bục `[Rank 2, Rank 1, Rank 3]`, tách danh sách hạng 4–50, và gán cờ `isCurrentUser`.
- [x] **T-LB-03** [FR-01]: Viết Server Component fetcher `getLeaderboardData(limit?: number)` tại `src/features/leaderboard/server/get-leaderboard.ts`:
  - Khởi tạo `GamificationService` client qua `createServerTransport(accessToken)`.
  - Gọi `client.getGlobalLeaderboard({ limit: 50 })`.
  - Bắt lỗi an toàn, fallback ViewModel rỗng nếu backend ngoại lệ.

---

## Phase 2: UI Components (Triple Lane Design System)

- [x] **T-LB-04** [FR-08]: Tạo component `LeaderboardSkeleton` tại `src/features/leaderboard/ui/leaderboard-skeleton.tsx` (Skeleton bục vinh quang 3 bậc, danh sách 6 hàng, và thanh ghim bottom).
- [x] **T-LB-05** [FR-03]: Tạo component `LeaderboardPodium` tại `src/features/leaderboard/ui/leaderboard-podium.tsx`:
  - Render 3 cột bục vinh quang: #2 (Bạc bên trái), #1 (Vàng hoàng kim ở giữa, nhô cao, vương miện), #3 (Đồng bên phải).
  - Avatar bo tròn viền kim loại, tên hiển thị, tag cấp độ và điểm XP.
- [x] **T-LB-06** [FR-04, FR-05]: Tạo component `LeaderboardRow` tại `src/features/leaderboard/ui/leaderboard-row.tsx`:
  - Hiển thị thứ tự rank (mono font), avatar, tên người dùng, huy hiệu `Lv.X`, điểm XP format có dấu phẩy.
  - Highlight nổi bật nếu `isCurrentUser = true` với badge "YOU".
- [x] **T-LB-07** [FR-04]: Tạo component `LeaderboardList` tại `src/features/leaderboard/ui/leaderboard-list.tsx`:
  - Render danh sách các hàng thứ hạng từ #4 đến #50 hoặc empty state khi danh sách chưa có ai.
- [x] **T-LB-08** [FR-06]: Tạo component `LeaderboardMyStanding` tại `src/features/leaderboard/ui/leaderboard-my-standing.tsx`:
  - Thanh ghim nổi (Sticky Bar) cố định ở đáy view.
  - Hiển thị thứ hạng hiện tại của người dùng, avatar, tên, số XP.
  - Xử lý trạng thái người dùng chưa có điểm (Unranked).
- [x] **T-LB-09** [FR-03, FR-04, FR-05, FR-06]: Tạo component `LeaderboardView` tại `src/features/leaderboard/ui/leaderboard-view.tsx`:
  - Tích hợp bộ chuyển tab "Toàn cầu" (All-time) và "Tuần này" (Weekly League).
  - Gắn kết `LeaderboardPodium`, `LeaderboardList`, và `LeaderboardMyStanding`.

---

## Phase 3: Route, Page & Navigation Integration

- [x] **T-LB-10** [FR-01]: Tạo trang Server Component `src/app/(main)/leaderboard/page.tsx`:
  - Gọi `getLeaderboardData()`.
  - Bọc bằng `Suspense fallback={<LeaderboardSkeleton />}` và `PageTransition`.
  - Thiết lập SEO Metadata: `title: "Leaderboard — Global XP Ranking | FITAI"`.
- [x] **T-LB-11** [FR-07]: Cập nhật `AppHeader` (`src/shared/ui/app-header.tsx`):
  - Bổ sung `backDestination = { href: "/profile", label: "Profile" }` khi truy cập `/leaderboard`.
- [x] **T-LB-12** [FR-07]: Cập nhật `ProfileStatsGrid` (`src/features/gamification/ui/profile-stats-grid.tsx`):
  - Chuyển thẻ "League rank" thành thẻ liên kết Link dẫn tới `/leaderboard`, kèm tooltip và hover state mượt mà.

---

## Phase 4: Verification & Quality Gates

- [x] **V-LB-01**: Viết unit test cho mapper `tests/unit/leaderboard/leaderboard-mapper.test.ts` (kiểm tra safe bigint, podium sorting, user highlighting, fallback unranked).
- [x] **V-LB-02**: Viết component test `tests/component/leaderboard/leaderboard-view.test.tsx` (kiểm tra render podium, render rows, empty state, my standing bar, tab switching).
- [x] **V-LB-03**: Chạy toàn bộ test suite vitest (`pnpm test`) đảm bảo 100% pass, không có regression.
- [x] **V-LB-04**: Chạy `pnpm typecheck` kiểm tra TypeScript an toàn tuyệt đối.
- [x] **V-LB-05**: Rà soát giao diện UI/UX trên mobile viewport và desktop, kiểm tra contrast WCAG 2.2 AA.
