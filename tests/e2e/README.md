# 📋 Mục Lục & Tài Liệu Kiểm Thử E2E Toàn Hệ Thống (End-to-End & DB Gap Analysis)

Tài liệu này tổng hợp mục tiêu kiểm thử, kiến trúc kiểm thử luồng nghiệp vụ end-to-end kết hợp phân tích đối soát khoảng trống cơ sở dữ liệu (PostgreSQL Database Gap Analysis) cho hệ sinh thái **FitAI (Forange Next.js & Gym-Companion Go gRPC Backend)**.

---

## 🎯 Mục Tiêu & Tiêu Chuẩn Kiểm Thử

| Tiêu Chí | Mô Tả Yêu Cầu |
| :--- | :--- |
| **Mục tiêu cốt lõi** | Kiểm tra trọn vẹn dòng chảy nghiệp vụ từ UI $\rightarrow$ Next.js Server Actions $\rightarrow$ gRPC Gateway / Service $\rightarrow$ PostgreSQL $\rightarrow$ Transactional Outbox $\rightarrow$ Change Propagation. |
| **Tiêu chuẩn Data Gap** | Mỗi kịch bản bắt buộc chạy hàm **Database Gap Analyzer** trực tiếp trên PostgreSQL container (`fitai-postgres-test`). Yêu cầu **0 DATA GAPS** (không thiếu trường, không sai lệch kiểu dữ liệu, không ghi đè mất mát mảng JSON, bảo toàn tính bất biến của lịch sử quá khứ). |
| **Định danh UUID** | Chuẩn hóa UUID thuần túy (`00000000-0000-0000-0000-000000000001`) theo đúng chuẩn thiết kế Bounded Context `profile.users`, `profile.body_metrics`, `profile.injuries`. |

---

## 📑 Danh Mục Các Luồng Kiểm Thử (E2E Test Suites)

### 1. Luồng 1: Tập Tự Do / Kế Hoạch Tuỳ Biến (Ad-hoc Workout Execution)
- **File test**: [`workout-ad-hoc-and-plan.spec.ts`](file:///e:/LEARN/a/forange/tests/e2e/workout-ad-hoc-and-plan.spec.ts)
- **Helper phân tích DB**: [`helpers/db-workout-analyzer.ts`](file:///e:/LEARN/a/forange/tests/e2e/helpers/db-workout-analyzer.ts)
- **Mục tiêu**:
  - Người dùng bấm "Quick Workout" từ màn hình chính.
  - Tự động sinh phiên tập `USER_ADHOC` qua `CreateAdhocSessionHandler`.
  - Nhập hiệp tập (Reps, Weight, RPE), bấm Complete Set và Finish Session.
  - Kiểm tra DB: Bảng `workout_execution.workout_sessions` cập nhật `COMPLETED`, ghi nhận `workout_set_logs`, và sinh CloudEvents `workoutSessionStarted`, `workoutSessionCompleted` trong `workout_execution.outbox`.

---

### 2. Luồng 2: Tập Theo Kế Hoạch AI Lộ Trình (Plan-based Workout Execution)
- **File test**: [`workout-ad-hoc-and-plan.spec.ts`](file:///e:/LEARN/a/forange/tests/e2e/workout-ad-hoc-and-plan.spec.ts)
- **Helper phân tích DB**: [`helpers/db-workout-analyzer.ts`](file:///e:/LEARN/a/forange/tests/e2e/helpers/db-workout-analyzer.ts)
- **Mục tiêu**:
  - Người dùng truy cập Roadmap 4 tuần (`coaching.roadmaps`), chọn buổi tập được huấn luyện viên AI lên lịch sẵn (`COACH_SCHEDULED`).
  - Giao diện Live Workout hiển thị bài tập mục tiêu (Bench Press, Pull Up).
  - Hoàn thành các hiệp tập và kết thúc buổi tập.
  - Kiểm tra DB: Khối lượng tập luyện (`total_volume_kg`), trạng thái hoàn tất và tính toàn vẹn của dữ liệu session plan.

---

### 3. Luồng 3: Hệ Thống Thông Báo Nội Bộ (In-App Notification Flow)
- **File test**: [`notification-flow.spec.ts`](file:///e:/LEARN/a/forange/tests/e2e/notification-flow.spec.ts)
- **Helper phân tích DB**: [`helpers/db-notification-analyzer.ts`](file:///e:/LEARN/a/forange/tests/e2e/helpers/db-notification-analyzer.ts)
- **Mục tiêu**:
  - Hiển thị badge chấm đỏ thông báo chưa đọc trên thanh điều hướng (`/home`).
  - Điều hướng vào `/notifications` và hiển thị danh sách 3 thông báo mẫu với metadata JSON đầy đủ.
  - Click vào thông báo chưa đọc để gọi `MarkNotificationAsReadAction`.
  - Kiểm tra DB: Bảng `notification.in_app_notifications` cập nhật chính xác cột `is_read = true` cho bản ghi tương ứng.

---

### 4. Luồng 4: Cập Nhật Profile & Tái Tạo Lịch Tập Thích Ứng (Profile & Adaptive Plan Regeneration)
- **File test**: [`profile-and-regenerate-flow.spec.ts`](file:///e:/LEARN/a/forange/tests/e2e/profile-and-regenerate-flow.spec.ts)
- **Helper phân tích DB**: [`helpers/db-profile-analyzer.ts`](file:///e:/LEARN/a/forange/tests/e2e/helpers/db-profile-analyzer.ts)
- **Mục tiêu**:
  - Truy cập `/profile`, mở Modal "Body Metrics", cập nhật cân nặng (`75kg`), cân nặng mục tiêu (`72kg`), tỉ lệ mỡ (`16%`).
  - Mở Modal "Injury Management", ghi nhận chấn thương mới ở nhóm cơ vai (`Shoulders`, `Mild`).
  - Kiểm tra DB:
    - `profile.users` cập nhật `target_weight_kg`.
    - `profile.body_metrics` lưu lịch sử chỉ số cơ thể mới nhất.
    - `profile.injuries` lưu vết chấn thương đang hoạt động (`status = 'ACTIVE'`).
    - **Anti Data-Overwrite Check**: Bảo toàn 100% các mảng cấu hình (`goals`, `available_equipment`, `preferred_muscle_groups`), không bị rỗng do merge payload.
    - **Transactional Outbox**: Phát sinh các sự kiện `ProfileUpdated` và `InjuryReported`.
    - **History Invariant Check**: Giữ nguyên vẹn 100% các buổi tập `COMPLETED` trong quá khứ, chỉ tác động điều chỉnh các buổi tập `PENDING` trong tương lai.

---

## 🚀 Hướng Dẫn Chạy Toàn Bộ Test Suite

```bash
# Di chuyển vào thư mục frontend Forange
cd e:\LEARN\a\forange

# Chạy toàn bộ 4 luồng E2E tuần tự (Chromium)
pnpm exec playwright test tests/e2e/workout-ad-hoc-and-plan.spec.ts tests/e2e/notification-flow.spec.ts tests/e2e/profile-and-regenerate-flow.spec.ts --project=chromium
```
