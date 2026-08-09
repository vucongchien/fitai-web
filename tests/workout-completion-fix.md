# Workout Completion & gRPC Session Execution Test Plan

## 1. Mục tiêu (Objective)
Giải quyết sự cố buổi tập đã lên lịch (scheduled workout session) sau khi tập xong không chuyển sang màu xanh lá cây (COMPLETED) trên trang Roadmap & Home.

## 2. Nguyên nhân (Root Cause)
- Khi hoàn thành bài tập, client gọi Server Action `completeWorkoutSession({ sessionId })`.
- gRPC backend `WorkoutExecutionService` yêu cầu session phải được khởi tạo/kích hoạt trước đó bằng API `startScheduledWorkoutSession({ sessionId })`.
- Do frontend chưa từng gọi `startScheduledWorkoutSession` khi vào trang tập, `WorkoutExecutionService` trả về lỗi:
  `ConnectError: [unknown] rpc error: code = NotFound desc = failed to complete workout session: failed to complete session tx: workout session not found`
- server action nhảy vào khối catch fallback local, dẫn đến DB backend (`CoachingService` / `WorkoutExecutionService`) không cập nhật trạng thái session sang `COMPLETED`.

## 3. Giải pháp (Fix Implementation)
1. In `src/features/workout/server/get-live-session-data.ts`: Tải buổi tập scheduled sẽ tự động gửi gRPC `startScheduledWorkoutSession({ sessionId })`.
2. In `src/features/workout/server/workout-actions.ts`: Hàm `completeWorkoutSession` chủ động gọi `startScheduledWorkoutSession({ sessionId })` trước khi thực hiện `completeWorkoutSession`.

## 4. Kịch bản Test (Test Scenarios)
- **Unit Test 1**: `tests/unit/get-live-session-data.test.ts`
  - Đảm bảo hàm `getLiveSessionData` hoạt động mượt mà khi online/offline.
- **Unit Test 2**: `tests/unit/workout-grpc-actions.test.ts`
  - Xác nhận `startWorkoutSession({ planId })` được ưu tiên gọi để tạo phiên tập trong DB trước khi thực hiện `completeWorkoutSession`.

## 5. Kết quả kiểm thử (Verification)
- Ran `pnpm vitest run tests/unit/workout-grpc-actions.test.ts tests/unit/get-live-session-data.test.ts`: **PASS 100% (6/6 tests)**.
