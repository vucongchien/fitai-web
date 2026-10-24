# ADR-0002: Choreographed Animation Buffer for Post-Workout Experience

## Status: Accepted

## Context

Hệ thống Gamification của backend là Event-Driven:

1. `WorkoutExecutionService` kết thúc bài tập và bắn sự kiện `WorkoutSessionCompleted` vào Kafka topic `fitai.workout.events`.
2. Gamification `WorkoutEventConsumer` tiêu thụ message, cập nhật Streak, XP và Badges vào Postgres. Quá trình này mất khoảng 150ms – 400ms.
3. Khi người dùng hoàn thành buổi tập trên Frontend, router chuyển hướng ngay lập tức sang `/workouts/live/[sessionId]/summary` (trong 100ms – 200ms).

Nếu trang Summary query dữ liệu Gamification ngay lập tức, sẽ xảy ra **Eventual Consistency Race Condition** (dữ liệu Streak/XP chưa kịp cập nhật, gây cảm giác lag/lỗi).

Các lựa chọn:

1. _Hiển thị Loading Spinner ("Đang tính điểm kinh nghiệm..."):_ Trải nghiệm rất tệ, làm đứt mạch cảm xúc sau bài tập.
2. _Chặn ở Server Action (Blocking poll):_ Bắt backend hoặc server action chờ consumer xử lý xong mới trả response $\rightarrow$ Làm chậm flow, tăng nguy cơ timeout.
3. _Choreographed Animation Buffer (Mô hình Duolingo):_ Chạy chuỗi diễn hoạt ăn mừng client-side có kịch bản (2.5s – 3.0s) bằng số liệu dự phóng lạc quan (Optimistic Projection), kết hợp background reconciliation.

## Decision

**Áp dụng Choreographed Animation Buffer (Phong cách Duolingo):**

- Client tính toán dự phóng tức thì số XP và Streak mới từ kết quả bài tập đã biết (`localTotals.totalSets >= 3` $\rightarrow$ Base 50 XP, Form Bonus, PR Bonus, $+1$ Streak).
- Kích hoạt chuỗi diễn hoạt tuần tự đẹp mắt kéo dài ~3 giây:
  - Nhịp 1 (0.0s – 0.6s): Stats Card & Header chúc mừng.
  - Nhịp 2 (0.6s – 1.8s): Lửa Streak bùng sáng, số chuỗi lật $N \to N+1$, lịch tuần tick xanh.
  - Nhịp 3 (1.8s – 2.6s): Thẻ XP nhảy số count-up, thanh tiến trình Level trượt lướt.
  - Nhịp 4 (2.6s – 3.0s): Huy hiệu PR Breaker / Streak nếu đạt mốc.
- Trong thời gian 3 giây này, client gọi ngầm `GetStreak` và `GetMyXp` từ server để đối soát (reconcile) và revalidate cache.

## Rationale

- Xóa bỏ 100% cảm giác trễ mạng hoặc loading spinner.
- Tận dụng tâm lý học phần thưởng: người dùng tập trung tận hưởng niềm vui thành tựu thể lực.
- Khi người dùng bấm nút "Tiếp tục" về Home, database và cache đã hoàn tất đồng bộ từ trước.

## Consequences

- Cần xây dựng state machine mini hoặc animation timeline trong `workout-summary-view.tsx`.
- Cần hàm tính nhẩm XP optimistic ở client đồng bộ công thức với backend `CalculateWorkoutXp`.
