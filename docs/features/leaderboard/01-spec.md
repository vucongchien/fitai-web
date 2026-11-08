# Leaderboard (Bảng Xếp Hạng) Front-End — Specification

## 1. Summary & Business Value

Hệ thống Bảng Xếp Hạng (XP Leaderboard) là tính năng cốt lõi thuộc phân hệ Gamification của FITAI, nhằm mục tiêu tạo động lực tập luyện liên tục, thúc đẩy thói quen kỷ luật và mang lại trải nghiệm thi đua tích cực (Positive Reinforcement, Zero Penalties) cho cộng đồng gymer.

Backend Go (`gym-companion`) đã hoàn thiện và cung cấp RPC `contracts.supporting.gamification.v1.service.GamificationService.GetGlobalLeaderboard` (truy vấn Top 50 vận động viên có tổng điểm XP cao nhất toàn hệ thống, kèm theo thứ hạng và thông số cá nhân `my_standing` của người dùng đang đăng nhập).

Feature này tập trung xây dựng toàn bộ giao diện và luồng tương tác Leaderboard trên Frontend Next.js (`fitai-web`) theo chuẩn Design System **Triple Lane**:

- Tôn vinh Top 3 trên bục vinh quang (Podium) đẳng cấp, tinh gọn, đậm chất thể thao.
- Bảng xếp hạng cuộn mượt cho các thứ hạng tiếp theo (Rank 4–50) với đầy đủ thông tin: Avatar, Tên, Cấp độ (Level), Tổng XP.
- Thanh ghim cố định (Sticky Floating Card) hiển thị tức thì vị trí, điểm số và khoảng cách tới hạng tiếp theo của chính người dùng (`my_standing`).
- Điều hướng thuận tiện từ Thẻ Thống kê cá nhân (Profile League Rank), khu vực Arena / Challenge và Community.

---

## 2. Actors & Entry Points

| Actor                               | Entry Point           | Trigger                                                                                                   |
| :---------------------------------- | :-------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Vận động viên (Athlete / Gymer)** | `/(main)/leaderboard` | Truy cập trực tiếp trang Bảng Xếp Hạng qua URL hoặc điều hướng nội bộ.                                    |
| **Vận động viên (Athlete / Gymer)** | `/(main)/profile`     | Nhấp vào thẻ chỉ số **"League rank"** trong `ProfileStatsGrid` để xem vị trí của mình trên bảng tổng sắp. |
| **Vận động viên (Athlete / Gymer)** | `/(main)/challenge`   | Nhấp vào banner / link "Leaderboard" tại sảnh Arena / Solo Challenge để xem bảng vàng thi đấu.            |

---

## 3. Scope & Non-Goals

### In-scope

1. **Trang Bảng Xếp Hạng chuyên biệt (`/leaderboard`):**
   - Hỗ trợ SSR tải nhanh kèm Suspense skeleton loader chống giật layout (Cumulative Layout Shift = 0).
   - Gọi ConnectRPC `GamificationService.GetGlobalLeaderboard({ limit: 50 })`.
2. **Top 3 Podium (Bục vinh quang thể thao):**
   - Thiết kế bục 3 bậc: Vị trí #1 ở giữa (Gold, cao nhất), #2 bên trái (Silver), #3 bên phải (Bronze).
   - Avatar viền kim loại quý, huy hiệu vương miện / cúp, hiển thị Level và XP nổi bật.
3. **Danh sách thứ hạng từ #4 đến #50:**
   - Mỗi hàng hiển thị: Số thứ tự hạng, Avatar (fallback initials / icon), Tên hiển thị, Huy hiệu Level, Điểm XP định dạng có dấu phẩy (`12,450 XP`).
   - Tự động highlight hàng của người dùng hiện tại (nếu nằm trong Top 50) với viền Relay Blue nhạt và nhãn "You".
4. **Thanh trạng thái cá nhân (Sticky My Standing Card):**
   - Ghim cố định phía dưới màn hình (ngay trên Bottom Navigation trên mobile hoặc chân trang danh sách).
   - Hiển thị thứ hạng chính xác của người dùng (kể cả khi user nằm ngoài Top 50, ví dụ `#142`), kèm XP hiện tại và cấp độ.
5. **Bộ chuyển đổi chế độ xem (Scope Tabs):**
   - Tab "Toàn cầu" (Global All-time) kết nối trực tiếp dữ liệu backend.
   - Tab "Tuần này" (This Week / League Tier) hỗ trợ giao diện phân hạng giải đấu (chuẩn bị cho giải tuần).
6. **Tích hợp liên kết từ Profile:**
   - Cập nhật thẻ `League rank` trong `ProfileStatsGrid` thành phần tử có thể nhấp (Clickable / Accessible Link) dẫn tới `/leaderboard`.
7. **Đồng bộ Design System Triple Lane & Chuẩn Accessibility WCAG 2.2 AA:**
   - Màu sắc chủ đạo: Nền sáng sạch `clear-white` / `soft-paper`, điểm nhấn `relay-blue` (#4B57F2) cho trạng thái kích hoạt, `sprint-coral` (#FF5A47) cho XP nỗ lực, và vàng kim thể thao cho bục Top 1.
   - Typography: Phông tiêu đề condensed dứt khoát (`Anybody Variable`), phông nội dung độ đọc cao (`Atkinson Hyperlegible`).
   - Kích thước cảm ứng tối thiểu 48x48px trên mobile, đầy đủ aria-label, hỗ trợ bàn phím.

### Non-Goals

- Hệ thống giải thưởng trao quà vật lý tự động.
- Tính năng gian lận điểm hoặc can thiệp vị trí từ phía Client.
- Thay đổi cấu trúc cơ sở dữ liệu hoặc logic tính rank dưới Redis/Postgres của backend Go.

---

## 4. Current vs Expected Behavior

| Hạng mục                           | Hiện tại (Current)                                                                 | Kỳ vọng mới (Expected)                                                                              |
| :--------------------------------- | :--------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| Tuyến đường `/leaderboard`         | Chưa tồn tại (404 Not Found).                                                      | Trang SSR tải dữ liệu Top 50 mượt mà, đầy đủ SEO metadata và PageTransition.                        |
| Thẻ `League rank` ở Profile        | Chỉ hiển thị số tĩnh `#12` hoặc `--`, không thể tương tác.                         | Trở thành thẻ liên kết tương tác, hover hiệu ứng, click mở ngay `/leaderboard`.                     |
| Trải nghiệm thi đua xã hội         | Người dùng không thấy được ai đang dẫn đầu, không biết cộng đồng tập luyện ra sao. | Trực quan hóa bục Top 3 rực rỡ, danh sách xếp hạng rõ ràng, khơi dậy tinh thần thể thao.            |
| Trạng thái người dùng ngoài Top 50 | Không biết mình đang ở đâu nếu không vào top đầu.                                  | Thanh Sticky My Standing thể hiện rõ thứ hạng thực tế (ví dụ `#85`), tạo mục tiêu phấn đấu lọt Top. |

---

## 5. Functional Requirements (FR)

- **FR-01 (Data Fetching):** `getLeaderboardData` thực thi trên Server (BFF Server Component), kết nối ConnectRPC `GamificationService.GetGlobalLeaderboard` với `limit = 50`.
  - Nếu backend chưa phản hồi hoặc gặp sự cố mạng, fallback an toàn với mảng rỗng và `myStanding: null`, không gây crash SSR hay 500.
- **FR-02 (Data Mapping & Formatting):** Chuyển đổi an toàn kiểu dữ liệu Protobuf `bigint` (`xp`) sang JavaScript `number` bằng `safeBigIntToNumber`, format số có phân tách hàng nghìn (`12,450 XP`).
- **FR-03 (Top 3 Podium):** Render bục vinh quang theo thứ tự hiển thị thị giác: Rank 2 (Trái) — Rank 1 (Giữa, nhô cao) — Rank 3 (Phải).
  - Có các chỉ số trực quan: Rank badge (#1 vàng kim, #2 bạc, #3 đồng), ảnh đại diện bo tròn, tên người dùng, điểm XP và cấp độ.
- **FR-04 (Ranked List 4–50):** Render danh sách từ thứ hạng 4 trở đi. Mỗi dòng hiển thị rõ thứ hạng, avatar, tên, level badge, số điểm XP.
- **FR-05 (Current User Highlighting):** Khi `currentUserId` trùng khớp với một mục trong danh sách, hàng đó được làm nổi bật với viền xanh `relay-blue/20` và huy hiệu `You`.
- **FR-06 (Sticky My Standing Bar):** Ghim cố định ở cạnh dưới của view danh sách.
  - Hiển thị thứ hạng hiện tại của người dùng, avatar, tên, số XP.
  - Nếu người dùng chưa có lượt tập (0 XP / unranked), hiển thị thông điệp khuyến khích: _"Hoàn thành buổi tập đầu tiên để ghi danh trên bảng vàng!"_.
- **FR-07 (Navigation Integration):** Thẻ `League rank` trong `ProfileStatsGrid` liên kết trực tiếp tới `/leaderboard`. Thanh `AppHeader` hiển thị nút Back quay lại khi ở trang `/leaderboard`.
- **FR-08 (Loading & Empty States):** Có `LeaderboardSkeleton` hiển thị trước khi dữ liệu tải xong và Empty State tinh tế khi chưa có dữ liệu bảng xếp hạng.

---

## 6. Acceptance Criteria

- [x] **AC-01**: Truy cập `/leaderboard` tải dữ liệu thành công từ `GamificationService.GetGlobalLeaderboard`.
- [x] **AC-02**: Bục Top 3 hiển thị đúng thứ tự trực quan: #2 bên trái, #1 ở giữa cao nhất, #3 bên phải.
- [x] **AC-03**: Thẻ `League rank` ở trang Profile nhấp vào điều hướng chính xác tới `/leaderboard`.
- [x] **AC-04**: Thanh ghim My Standing hiển thị đúng thứ hạng cá nhân của người dùng.
- [x] **AC-05**: Giao diện chuẩn Triple Lane, responsive hoàn hảo trên mobile (360px–430px) và desktop, đạt tiêu chuẩn WCAG 2.2 AA.
- [x] **AC-06**: Toàn bộ unit tests và component tests vượt qua 100%, không phát sinh lỗi TypeScript (`pnpm typecheck`).
