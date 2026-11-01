# Kịch bản kiểm thử: Live Exercise Instructions Sheet (Hướng dẫn bài tập)

## 1. Mục tiêu kiểm thử

Xác nhận rằng component `InstructionsSheet` trong luồng tập luyện trực tiếp (`/workouts/live/[sessionId]`) hiển thị đầy đủ hình ảnh minh họa bài tập đồng bộ với danh mục tìm kiếm (`exerciseSearchRepository` / `ExerciseCard`), hỗ trợ huy hiệu AI Tracking, tự động đọc phát âm hướng dẫn bằng giọng nói và xử lý các trạng thái fallback khi không có ảnh.

## 2. Kịch bản chi tiết (`tests/component/live-instructions-sheet.test.tsx`)

### Kịch bản 1: Hiển thị hình ảnh thumbnail của bài tập từ danh mục bài tập

- **Đầu vào**: `LiveExercise` với `thumbnailUrl` là đường dẫn hình ảnh động GIF (ví dụ `https://static.exercisedb.dev/media/DsgkuIt.gif` cho Dumbbell Lateral Raise).
- **Kỳ vọng**: Component render thẻ `<img>` với `alt="Dumbbell Lateral Raise"` và `src` chứa đường dẫn tương ứng, sử dụng class `.detail-thumb__img` và tối ưu hóa không làm đứt vòng lặp animation.

### Kịch bản 2: Hiển thị huy hiệu AI Form Tracking

- **Đầu vào**: `LiveExercise` với `hasAiSupported = true`.
- **Kỳ vọng**: Xuất hiện nhãn `AI form tracking` kèm biểu tượng Camera trên góc hình ảnh, tương đồng với thẻ bài tập ở giao diện tìm kiếm (`ExerciseCard`).

### Kịch bản 3: Ẩn huy hiệu AI khi bài tập không hỗ trợ camera AI

- **Đầu vào**: `LiveExercise` với `hasAiSupported = false`.
- **Kỳ vọng**: Không hiển thị nhãn AI trên hình ảnh.

### Kịch bản 4: Trạng thái Fallback khi không có thumbnail

- **Đầu vào**: `LiveExercise` với `thumbnailUrl = ""`.
- **Kỳ vọng**: Hiển thị container fallback `.detail-thumb__fallback` với biểu tượng quả tạ (`Dumbbell`), không gây crash giao diện hoặc làm vỡ layout.

### Kịch bản 5: Đầy đủ các trường nội dung hướng dẫn

- **Đầu vào**: Bài tập có `instructions`, `notes`, `breathingCue`, `formCues`.
- **Kỳ vọng**: Render đúng các mục:
  - Header: "How to do it" và tên bài tập.
  - Các bước thực hiện (Execution steps hoặc hướng dẫn tổng quát).
  - Ghi chú từ HLV ("Coach note for today").
  - Hướng dẫn nhịp thở ("Breathing").
  - Các lưu ý kỹ thuật chuẩn ("Form cues").

### Kịch bản 6: Nút xem video hướng dẫn demo

- **Đầu vào**: Bài tập có `videoUrl` và callback `onWatchVideo`.
- **Kỳ vọng**: Hiển thị nút "Watch tutorial video" trên thanh tiêu đề cho phép người dùng mở video demo trực quan.

### Kịch bản 7: Đóng sheet với hiệu ứng mượt mà

- **Đầu vào**: Bấm nút "Close" (hoặc backdrop).
- **Kỳ vọng**: Kích hoạt timeout đóng và gọi callback `onClose`.
