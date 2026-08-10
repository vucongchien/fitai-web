# Danh Mục Kịch Bản Kiểm Thử Module Live Workout & Summary

Tài liệu này ghi chép các kịch bản kiểm thử (Test Scenarios) dành cho module **Live Workout Execution & Session Summary**.

---

## 📋 Mục Lục Kịch Bản Kiểm Thử

### 1. `tests/component/workout-summary-flow.test.tsx`

- **Mục tiêu**: Kiểm thử các trạng thái UI và logic dữ liệu của `WorkoutSummaryView` và `SetTimer`.
- **Chi tiết kịch bản**:
  1. `renders report successfully when sessionStorage has report data`:
     - _Mô tả_: Lưu một `SessionReport` chuẩn vào `sessionStorage` bằng `reportStorageKey`.
     - _Kỳ vọng_: Component render tiêu đề "Session complete.", hiển thị đúng 6 sets, 1,500 kg volume, 7.5 RPE, và PR bài tập "Barbell Squat".
  2. `renders Error State cleanly when sessionStorage has no data (no fake 2160kg report)`:
     - _Mô tả_: Render `WorkoutSummaryView` với `sessionId` không tồn tại trong `sessionStorage`.
     - _Kỳ vọng_: Hiển thị trang báo lỗi "Session Summary Unavailable" kèm nút "Return Home", KHÔNG hiển thị dữ liệu giả 2160kg.
  3. `renders Restart button with RotateCcw icon instead of confusing +10s label`:
     - _Mô tả_: Render component `SetTimer`.
     - _Kỳ vọng_: Nút bấm Reset timer hiển thị nhãn "Restart" đồng bộ với hành vi `onRestart()`.

---

### 2. `tests/unit/session-flow.test.ts`

- **Mục tiêu**: Kiểm thử logic pure function của State Machine & Timeline (`buildTimeline`, `stepIndexAfterPhase`, `stepIndexAfterExercise`).
- **Kịch bản**: Đảm bảo timeline bài tập xếp theo đúng 3 giai đoạn: Warmup ➔ Main ➔ Cooldown.

---

### 3. `tests/unit/training-load.test.ts`

- **Mục tiêu**: Kiểm thử các công thức tính toán tải tập luyện (`sessionVolumeKg`, `averageRpe`, `averageFormScore`, `estimateCalories`).
- **Kịch bản**: Đảm bảo Calories và Volume được tính đúng chuẩn thể thao thay vì công thức hardcode.

---

### 4. `tests/unit/get-live-session-data.test.ts`

- **Mục tiêu**: Kiểm thử khả năng khởi tạo và fallback mượt mà của `getLiveSessionData` khi offline, khi gRPC gặp 404 NotFound hoặc khi bắt đầu buổi tập Adhoc.
- **Chi tiết kịch bản**:
  1. `returns fallback exercise plan when offline so live session never starts empty`:
     - _Mô tả_: Gọi `getLiveSessionData` khi môi trường offline (gRPC rỗng hoặc lỗi 404).
     - _Kỳ vọng_: Trả về `LiveSessionPlan` có danh sách bài tập fallback hợp lệ (Squat, Pushup, Plank), kèm theo `videoUrl` và `thumbnailUrl` chất lượng cao, đảm bảo người dùng có thể xem video hướng dẫn bất cứ lúc nào.
  2. `parses exerciseIds encoded in adhoc sessionId when starting adhoc workout`:
     - _Mô tả_: Gọi `getLiveSessionData` với `sessionId` mã hóa dạng `adhoc_ex-pushup,ex-plank_1723...`.
     - _Kỳ vọng_: Phân tích và lấy đúng thông tin danh sách bài tập mà người dùng đã chọn trong Adhoc builder kèm đầy đủ URL video demo.

---

### 5. `tests/unit/audio-cues-synthesizer.test.ts`

- **Mục tiêu**: Kiểm thử hệ thống phát âm thanh tổng hợp Web Audio API Chime & Web Speech API Text-To-Speech (TTS).
- **Chi tiết kịch bản**:
  1. `safely executes tone generation without crashing in mock browser environment`: Phát âm thanh chime tone không gây crash ứng dụng.
  2. `safely executes text to speech without crashing in mock browser environment`: Đọc câu thoại hướng dẫn tư thế bằng Web Speech API không bị ngắt rớt.

---

### 6. `tests/unit/workout-grpc-actions.test.ts`

- **Mục tiêu**: Kiểm thử các Server Actions điều phối gRPC Workout Execution (`beginWorkoutSession`, `logWorkoutSet`, `completeWorkoutSession`, `getPersonalRecords`).
- **Chi tiết kịch bản**:
  1. `beginWorkoutSession creates adhoc plan and starts live session`: Tạo plan adhoc và khởi chạy workout session gRPC.
  2. `logWorkoutSet sends set performance to gRPC LogWorkoutSet`: Gửi số rep, weight, RPE, Form Score sang gRPC execution.
  3. `completeWorkoutSession finishes session and returns totals`: Tổng kết buổi tập, tính tổng volume và cập nhật PR.
  4. `getPersonalRecords maps gRPC records to dictionary`: Ánh xạ kỷ lục cá nhân từ gRPC thành Dictionary key-value.

---

### 7. `tests/unit/pose-metrics-timed.test.ts`

- **Mục tiêu**: Kiểm thử tính toán độ lệch hông `signed_hip_y_diff`, kiểm tra form bài tập tĩnh (Plank) và cơ chế tính s (seconds hold) khi đúng/sai nhẹ.
- **Chi tiết kịch bản**:
  1. `detects phase as 'always' for metric: 'none' or thresholds.always`:
     - _Mô tả_: Đọc cấu hình `phase_detection` của `plank.json`.
     - _Kỳ vọng_: Nhận diện đúng phase `"always"` cho bài tập tĩnh không phân biệt start/active rep.
  2. `calculates signedHipYDiff correctly for straight plank pose`:
     - _Mô tả_: Truyền keypoints vai, hông, cổ chân nằm trên cùng một đường thẳng.
     - _Kỳ vọng_: Trả về độ lệch hông bằng `0`.
  3. `evaluates Plank rules for Warning (severity 1) and Danger (severity 2)`:
     - _Mô tả_: Đánh giá posture đối với các mức độ võng hông.
     - _Kỳ vọng_: Hông thẳng -> `Correct` (no error); Hông võng nhiều -> phát hiện lỗi `Danger` (`severity: 2`) và đưa ra câu cảnh báo chỉnh tư thế.

---

### 8. `tests/unit/voice-coaching-dialogues.test.ts`

- **Mục tiêu**: Kiểm thử truy xuất câu thoại hướng dẫn tư thế theo `dialogues_url` (voice_coaching) và khớp phong cách huấn luyện (`normal`, `strict`, `gentle`).
- **Chi tiết kịch bản**:
  1. `selects correct gentle warning dialogue for Plank signed_hip_y_diff`: Lấy đúng câu nhắc nhở nhẹ nhàng khi hông hơi võng ở bài Plank.
  2. `selects correct strict danger dialogue for Plank signed_hip_y_diff`: Lấy đúng câu cảnh báo nghiêm khắc khi võng lưng quá nặng nguy cơ đau thắt lưng.
  3. `selects normal style as default when style is normal`: Lấy câu thoại mặc định phong cách Normal.

---

## 🚀 Hướng Dẫn Chạy Test

```bash
# Chạy toàn bộ unit test live session, audio cues, timed plank, dialogues & workout actions
pnpm vitest run tests/unit/voice-coaching-dialogues.test.ts tests/unit/pose-metrics-timed.test.ts tests/unit/get-live-session-data.test.ts tests/unit/audio-cues-synthesizer.test.ts tests/unit/workout-grpc-actions.test.ts
```
