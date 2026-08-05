# Workout Flow Test Plan & Documentation

Tài liệu mô tả chi tiết danh mục và các kịch bản kiểm thử (Test Plan) cho **Flow Tập luyện (Workout Execution Flow)** trong ứng dụng FITAI.

---

## Mục lục (Table of Contents)

1. [Tổng quan (Overview)](#1-tổng-quan-overview)
2. [Cấu trúc Test Suite (Test Suite Structure)](#2-cấu-trúc-test-suite-test-suite-structure)
3. [Chi tiết Kịch bản Kiểm thử (Test Cases Detail)](#3-chi-tiết-kịch-bản-kiểm-thử-test-cases-detail)
   - [3.1 Session Flow & State Machine](#31-session-flow--state-machine)
   - [3.2 Session Guards & Safety Checks](#32-session-guards--safety-checks)
   - [3.3 Pose Metrics & Form Score Calculation](#33-pose-metrics--form-score-calculation)
   - [3.4 Training Load & PR Detection](#34-training-load--pr-detection)
   - [3.5 Workout Summary Component](#35-workout-summary-component)
4. [Hướng dẫn Chạy Test (Execution Guide)](#4-hướng-dẫn-chạy-test-execution-guide)

---

## 1. Tổng quan (Overview)

Workout Flow chịu trách nhiệm quản lý vòng đời phiên tập trực tiếp từ khi khởi tạo, hướng dẫn bằng nhạc/giọng nói/video/bản tin, đếm số rep/tính ROM qua camera AI hoặc thủ công, cho đến khi tổng kết và tính toán tải trọng tập luyện (Volume, RPE, Form Score, PR).

## 2. Cấu trúc Test Suite (Test Suite Structure)

| File Test | Loại Test | Chức năng kiểm thử chính |
| :--- | :--- | :--- |
| `tests/unit/session-flow.test.ts` | Unit | Khởi tạo timeline, chuyển phase (warmup/main/cooldown), đếm số set, skip phase/exercise. |
| `tests/unit/session-guards.test.ts` | Unit | Cảnh báo phiên tập trống, đếm các set chưa xác minh (unverified sets), cảnh báo tập quá tải. |
| `tests/unit/pose-metrics.test.ts` | Unit | Tính ROM %, đếm reps từ góc khớp, tính Form Score (0 - 100), kiểm tra form rules. |
| `tests/unit/training-load.test.ts` | Unit | Tính tổng Volume (kg), RPE trung bình, Form score trung bình, Calo ước tính, phát hiện Kỷ kỷ lục mới (PRs). |
| `tests/component/workout-summary.test.tsx` | Component | Render thông số thực từ `SessionReport`, fallback khi không có storage, hiển thị Form Score & PR. |

---

## 3. Chi tiết Kịch bản Kiểm thử (Test Cases Detail)

### 3.1 Session Flow & State Machine
- **TC-SF-01**: Khởi tạo session timeline với đúng số lượng bài tập theo 3 phase: Warmup, Main, Cooldown.
- **TC-SF-02**: Chuyển trạng thái làm việc (Working state) -> Đánh giá set (Reviewing state) -> Nghỉ ngơi (Resting state).
- **TC-SF-03**: Hỗ trợ Skip Exercise đối với các bài tập Warmup hoặc Cooldown.

### 3.2 Session Guards & Safety Checks
- **TC-SG-01**: Phát hiện phiên tập trống (`needsEmptySessionPrompt`) khi không có set nào được ghi nhận.
- **TC-SG-02**: Đếm chính xác số set chưa được xác minh qua AI (`countUnverifiedSets`).
- **TC-SG-03**: Cảnh báo quá tải (`isAnomalousLoad`) khi Volume phiên hiện tại vượt mức trung bình gần đây.

### 3.3 Pose Metrics & Form Score Calculation
- **TC-PM-01**: Tính toán góc khớp giữa 3 điểm keypoints (ví dụ: vai - khuỷu tay - cổ tay).
- **TC-PM-02**: Đếm rep dựa trên chu kỳ Co contraction - Extension (Start -> Peak -> End).
- **TC-PM-03**: Công thức Form Score chuẩn hóa dựa trên tỷ lệ ROM, số lỗi vi phạm quy tắc, và tốc độ trung bình theo từng rep.

### 3.4 Training Load & PR Detection
- **TC-TL-01**: Tính tổng Volume (kg) = Σ(Reps * Weight).
- **TC-TL-02**: Tự động so sánh ước tính 1RM với dữ liệu lịch sử để phát hiện PR (Personal Record) mới.
- **TC-TL-03**: Trả về `averageFormScore = null` khi toàn bộ các set được ghi thủ công (Manual mode).

### 3.5 Workout Summary Component
- **TC-WS-01**: Đọc dữ liệu từ `sessionStorage` và hiển thị đúng Total Sets, Training Volume (kg), RPE trung bình.
- **TC-WS-02**: Hiển thị badge Form Score khi có dữ liệu camera, hoặc hiển thị "No form score today" khi là manual set.
- **TC-WS-03**: Sử dụng dữ liệu fallback mặc định khi không tìm thấy storage key mà không làm văng giao diện UI.

---

## 4. Hướng dẫn Chạy Test (Execution Guide)

Chạy tất cả các unit test và component test liên quan tới Workout module:
```bash
pnpm test
```
