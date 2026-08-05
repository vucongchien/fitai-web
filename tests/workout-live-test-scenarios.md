# Danh Mục Kịch Bản Kiểm Thử Module Live Workout & Summary

Tài liệu này ghi chép các kịch bản kiểm thử (Test Scenarios) dành cho module **Live Workout Execution & Session Summary**.

---

## 📋 Mục Lục Kịch Bản Kiểm Thử

### 1. `tests/component/workout-summary-flow.test.tsx`
- **Mục tiêu**: Kiểm thử các trạng thái UI và logic dữ liệu của `WorkoutSummaryView` và `SetTimer`.
- **Chi tiết kịch bản**:
  1. `renders report successfully when sessionStorage has report data`:
     - *Mô tả*: Lưu một `SessionReport` chuẩn vào `sessionStorage` bằng `reportStorageKey`.
     - *Kỳ vọng*: Component render tiêu đề "Session complete.", hiển thị đúng 6 sets, 1,500 kg volume, 7.5 RPE, và PR bài tập "Barbell Squat".
  2. `renders Error State cleanly when sessionStorage has no data (no fake 2160kg report)`:
     - *Mô tả*: Render `WorkoutSummaryView` với `sessionId` không tồn tại trong `sessionStorage`.
     - *Kỳ vọng*: Hiển thị trang báo lỗi "Session Summary Unavailable" kèm nút "Return Home", KHÔNG hiển thị dữ liệu giả 2160kg.
  3. `renders Restart button with RotateCcw icon instead of confusing +10s label`:
     - *Mô tả*: Render component `SetTimer`.
     - *Kỳ vọng*: Nút bấm Reset timer hiển thị nhãn "Restart" đồng bộ với hành vi `onRestart()`.

---

### 2. `tests/unit/session-flow.test.ts`
- **Mục tiêu**: Kiểm thử logic pure function của State Machine & Timeline (`buildTimeline`, `stepIndexAfterPhase`, `stepIndexAfterExercise`).
- **Kịch bản**: Đảm bảo timeline bài tập xếp theo đúng 3 giai đoạn: Warmup ➔ Main ➔ Cooldown.

---

### 3. `tests/unit/training-load.test.ts`
- **Mục tiêu**: Kiểm thử các công thức tính toán tải tập luyện (`sessionVolumeKg`, `averageRpe`, `averageFormScore`, `estimateCalories`).
- **Kịch bản**: Đảm bảo Calories và Volume được tính đúng chuẩn thể thao thay vì công thức hardcode.

---

## 🚀 Hướng Dẫn Chạy Test
```bash
# Chạy toàn bộ test suite
pnpm test

# Chỉ chạy test live workout summary
npx vitest tests/component/workout-summary-flow.test.tsx
```
