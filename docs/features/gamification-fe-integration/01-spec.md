# Gamification Front-End Integration — Specification

## Summary

Tích hợp toàn diện hệ thống Gamification (XP, Cấp độ, Chuỗi ngày kỷ luật Streak, Huy hiệu Badges) từ Backend Go (`gym-companion`) vào giao diện Frontend Next.js (`fitai-web`).

Feature này loại bỏ 100% các công thức mock/tính tay cục bộ hiện tại (như tính streak từ 30 buổi tập, mock level bằng `totalWorkouts / 4`), giải quyết bài toán đồng bộ dữ liệu thời gian thực sau buổi tập bằng kỹ thuật **Choreographed Animation Buffer** chuẩn phong cách Duolingo, và bổ sung thanh cuộn huy hiệu ngang (**Badge Carousel**) dưới Profile Hero Card.

### User & Business Value

- **Thúc đẩy động lực & Giữ chân người dùng (Retention Loop):** Trải nghiệm ăn mừng sau buổi tập mô phỏng Duolingo mang lại dopamine tức thì sau khi hoàn thành bài tập thể lực gian khổ.
- **Tính chuẩn xác & Minh bạch:** Xóa bỏ độ lệch giữa logic FE và BE, đảm bảo chuỗi ngày kỷ luật (Streak) tính đúng theo cả buổi tập gym và nhật ký dinh dưỡng, giải quyết triệt để vấn đề lệch múi giờ.
- **Tôn vinh thành tựu (Pride & Progress):** Người dùng nhìn thấy rõ huy hiệu đã mở khóa, tiến độ lên cấp độ tiếp theo thay vì một con số tĩnh vô nghĩa.

---

## Actors & Entry Points

| Actor                   | Entry Point                                    | Trigger                                                            |
| :---------------------- | :--------------------------------------------- | :----------------------------------------------------------------- |
| **Gymer (Active User)** | `/(main)/home`                                 | Mở ứng dụng hàng ngày xem thẻ Streak trạng thái hôm nay.           |
| **Gymer (Active User)** | `/(main)/profile`                              | Xem hồ sơ cá nhân, cấp độ, thanh XP và cuộn xem danh mục Huy hiệu. |
| **Gymer (Active User)** | `/(workout)/workouts/live/[sessionId]/summary` | Vừa hoàn thành bài tập gym, trải nghiệm màn hình tổng kết ăn mừng. |

---

## Scope

### In-scope

1. **Gateway BFF & Security:**
   - Mở quyền truy cập `contracts.supporting.gamification.v1.service.GamificationService` trong [`allowed-services.ts`](file:///e:/LEARN/a/fitai-web/src/shared/api/bff/allowed-services.ts).
2. **Surgical Fix cho Home Page:**
   - Thay thế việc tính tay `calculateConsecutiveStreakDays` bằng RPC `GamificationService.GetStreak`.
   - Cập nhật `TodayStreakBadge` phản ánh chính xác trạng thái `is_active_today` (đã hoàn thành hôm nay hay đang chờ tập).
3. **Surgical Fix & Bổ sung cho Profile Page:**
   - Thay thế mock `userLevel = Math.floor(totalWorkouts / 4)` bằng `GamificationService.GetMyXp` (`level`, `xp`, `xp_to_next_level`, `level_progress_percentage`).
   - Thay thế streak mock bằng `current_streak` và hiển thị thêm `longest_streak`.
   - Xây dựng thanh cuộn huy hiệu ngang (**Badges Horizontal Carousel**) ngay dưới `ProfileHeroCard` với icon badge, badge bị khóa `🔒`, và nút cuộn tròn `>`.
   - Modal/Drawer xem chi tiết từng huy hiệu khi nhấn vào.
4. **Post-Workout Celebration Flow (Phong cách Duolingo):**
   - Xây dựng trải nghiệm ăn mừng phân đoạn (**Choreographed Animation Buffer**) tại `workout-summary-view.tsx`.
   - Nhịp 1: Kết quả thể lực (Volume, Thời gian, Sets, Fatigue).
   - Nhịp 2: XP đếm tăng (+XP earned) và thanh Level progress chạy lên.
   - Nhịp 3: Ngọn lửa Streak bùng cháy (Flame ignite animation) + số ngày lật từ $N \to N+1$.
   - Nhịp 4: Pop-up chúc mừng nếu mở khóa huy hiệu mới (`PR_BREAKER`, `STREAK_7`...).
   - Chạy background reconciliation để khi user nhấn "Tiếp tục" về Home, DB và cache đã đồng bộ hoàn toàn.

### Non-goals

- Xây dựng toàn bộ trang Bảng xếp hạng toàn cầu (`GetGlobalLeaderboard`) thành 1 trang riêng (dành cho Phase mở rộng cộng đồng sau).
- Tính năng điều chỉnh số dư FitCoins hay can thiệp Streak của Admin trên giao diện User thường (thuộc Admin Portal).
- Thay đổi logic nghiệp vụ tính điểm XP hay luật Streak dưới Backend Go.

---

## Current vs Expected Behavior

| Hạng mục                     | Hiện tại (Current)                                                           | Kỳ vọng (Expected)                                                                                                                                            |
| :--------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Cổng BFF RPC**             | Chặn `GamificationService` (`403 Forbidden`).                                | Cho phép chuyển tiếp an toàn qua proxy `/rpc/...`.                                                                                                            |
| **Streak Home**              | Duyệt mảng `history` tối đa 30 buổi tập, tự tính bằng Date JS.               | Lấy chuẩn từ `GamificationService.GetStreak`, biết được `longest_streak` và `is_active_today`.                                                                |
| **Level Profile**            | Cố định công thức mock `totalWorkouts / 4`.                                  | Lấy chuẩn từ `GamificationService.GetMyXp` theo hàm căn bậc hai chuẩn $Level(X) = \min(\lfloor\sqrt{X/50}\rfloor + 1, 100)$.                                  |
| **Badges Profile**           | Không có UI, không hiển thị huy hiệu nào.                                    | Hàng ngang cuộn mượt (Carousel) hiển thị toàn bộ 13 huy hiệu hệ thống với icon, viền trạng thái, và nút tròn `>`.                                             |
| **Màn hình Summary sau tập** | Chỉ có bảng thông số tĩnh (Volume, Sets, Time). Chuyển về Home ngay lập tức. | Chuỗi animation ăn mừng Duolingo (Thống kê $\to$ XP đếm số $\to$ Lửa Streak bùng sáng $\to$ Huy hiệu mới). Đệm thời gian 2.5s để Kafka consumer kịp ghi nhận. |

---

## Functional Requirements (FR)

- **FR-01 (Gateway):** BFF route `/rpc/...` phải chấp thuận các lời gọi hàm đến `contracts.supporting.gamification.v1.service.GamificationService`.
- **FR-02 (Home Streak):** `getHomePageData` phải gọi `GamificationService.GetStreak` song song qua `Promise.allSettled`. Nếu lỗi mạng/timeout, fallback an toàn về `{ days: 0 }` mà không làm crash SSR.
- **FR-03 (Profile Stats & XP):** `getProfileData` phải gọi song song `GetMyXp` và `GetStreak`. ViewModel mở rộng để chứa `level`, `xp`, `xpToNextLevel`, `levelProgressPercentage`, `currentStreak`, `longestStreak`.
- **FR-04 (Badges Carousel):**
  - Component hiển thị cuộn ngang `overflow-x-auto snap-x scrollbar-none`.
  - Huy hiệu đã mở khóa: hiển thị icon nổi bật, viền màu sắc.
  - Huy hiệu chưa mở khóa: hiển thị mờ (grayscale), có icon ổ khóa nhỏ `🔒`.
  - Có nút tròn mũi tên `>` ở góc phải để người dùng click cuộn nhanh sang bên phải.
  - Nhấn vào badge hiển thị modal chi tiết (Tên, mô tả, ngày đạt).
- **FR-05 (Choreographed Celebration Flow):**
  - Tại `workout-summary-view.tsx`, hiển thị tuần tự các block chúc mừng:
    1. Tổng quan buổi tập (Volume, Time, Fatigue).
    2. Block XP: Hiển thị `+50 XP` (+ bonus nếu có), animated count-up số điểm và thanh level bar.
    3. Block Streak: Ngọn lửa bùng cháy, số chuỗi lật tăng $+1$, hiển thị lời khen kỷ luật.
    4. Block Badge (nếu đạt kỷ lục mới PR hoặc mốc streak): Highlight huy hiệu tương ứng.
  - Nút "Tiếp tục" / "Về trang chủ" điều hướng về Home mượt mà.
- **FR-06 (Background Reconciliation):** Khi màn hình Summary chạy animation, tự động trigger prefetch/revalidation để làm mới cache Home và Profile.

---

## User Scenarios & Use Cases

### UC-01: Gymer xem thông tin chuỗi ngày tại Trang chủ

1. Người dùng mở trang chủ `/home`.
2. Server fetch song song thông tin lộ trình và `GetStreak`.
3. Nếu người dùng chưa tập hôm nay nhưng duy trì streak từ hôm qua (`daysDiff == 1`):
   - Header hiển thị ngọn lửa cam kèm dòng chữ: `5-day streak`.
   - Tooltip / trạng thái hiển thị: _"Tập luyện hôm nay để duy trì chuỗi!"_.
4. Nếu người dùng đã tập xong hôm nay:
   - Ngọn lửa bừng sáng rực rỡ với trạng thái _"Đã hoàn thành mục tiêu hôm nay"_.

### UC-02: Gymer chiêm ngưỡng bộ sưu tập Huy hiệu trên Profile

1. Người dùng vào `/profile`.
2. Ngay dưới thẻ Hero Card (tên, avatar, level), người dùng thấy một hàng ngang các huy hiệu:
   - Thấy các huy hiệu đã đạt như `Khởi Đầu Mới`, `Chiến Binh 7 Ngày` sáng màu.
   - Thấy các huy hiệu mục tiêu như `Kỷ Luật 30 Ngày`, `Bậc Thầy Thể Hình` có icon khóa `🔒`.
3. Người dùng bấm nút tròn `>` để cuộn nhanh xem các huy hiệu phía sau.
4. Người dùng bấm vào 1 huy hiệu: modal mở ra hiển thị _"Chiến Binh 7 Ngày — Duy trì chuỗi kỷ luật 7 ngày liên tiếp. Mở khóa ngày: 15/10/2026"_.

### UC-03: Gymer hoàn thành buổi tập & Trải nghiệm ăn mừng kiểu Duolingo

1. Người dùng hoàn thành set tập cuối cùng trên Live Workout $\rightarrow$ bấm "Hoàn tất buổi tập".
2. Hệ thống gọi `completeWorkoutSession` lưu DB và redirect sang màn hình Summary.
3. Màn hình Summary khởi động chuỗi diễn hoạt ăn mừng (Choreographed Celebration):
   - **0.5s đầu:** Card hoàn thành buổi tập xuất hiện với các chỉ số tạ và thời gian.
   - **Giây 1.0 – 2.0:** Thẻ `+55 XP` bay lên, con số đếm nhảy vui mắt, thanh level chạy dài ra thêm 1 nấc.
   - **Giây 2.0 – 3.0:** Ngọn lửa Streak bùng cháy, con số `4` lật sang `5 NGÀY LIÊN TIẾP! 🔥`.
   - _(Nếu phá PR):_ Modal mini chúc mừng _"Mở khóa huy hiệu: Phá Vỡ Giới Hạn (PR Breaker)!"_.
4. Trong lúc diễn hoạt chạy, request ngầm gọi xác thực dữ liệu từ backend.
5. Người dùng hài lòng bấm "Tiếp tục", quay trở về Home với dữ liệu mới tinh đã sẵn sàng.

---

## Business Rules & Invariants

- **BR-GM-01 (Virtual Streak Integrity):** Nếu người dùng bỏ tập $\ge 2$ ngày, streak hiển thị là `0`. Nếu bỏ tập đúng 1 ngày (hôm nay chưa tập), streak vẫn giữ nguyên con số ngày hôm qua nhưng cờ `is_active_today = false`.
- **BR-GM-02 (Non-linear Level Curve):** Cấp độ được tính toán duy nhất theo SSOT của backend: $\text{Level} = \min(\lfloor\sqrt{X/50}\rfloor + 1, 100)$. FE không tự ý đổi công thức tính level.
- **BR-GM-03 (Graceful Degradation):** Gamification là supporting domain. Nếu dịch vụ Gamification chết hoặc timeout, trang Home và Profile **bắt buộc vẫn phải tải thành công**, các trường streak/level fallback về giá trị an toàn (streak = 0, level giữ nguyên).

---

## Acceptance Criteria

- [ ] Route `/rpc/contracts.supporting.gamification.v1.service.GamificationService/*` không còn bị chặn `403 Forbidden`.
- [ ] Không còn bất kỳ đoạn mã nào dùng `Math.floor(totalWorkouts / 4)` để tính level trên Profile.
- [ ] Home Page hiển thị chính xác số ngày streak lấy từ `GamificationService.GetStreak`.
- [ ] Profile Page hiển thị thanh cuộn ngang Badges Carousel có nút tròn `>`, hỗ trợ xem chi tiết khi click.
- [ ] Màn hình Summary có thẻ ăn mừng tuần tự (XP count-up, Streak flame ignition) trước khi người dùng bấm về Home.
- [ ] Toàn bộ unit tests hiện có (`pnpm test`) tiếp tục pass 100%.

---

## Explicit Assumptions

1. **Asset Icons:** Tạm thời sử dụng Lucide icons / SVGs phong cách phẳng hiện đại có sẵn trong codebase làm icon cho 13 badges trước khi import vector graphic riêng từ designer.
2. **Timezone:** Lấy ngày địa phương của trình duyệt người dùng (`YYYY-MM-DD`) để gửi kèm trong truy vấn nếu cần, tránh lệch ngày múi giờ UTC.
