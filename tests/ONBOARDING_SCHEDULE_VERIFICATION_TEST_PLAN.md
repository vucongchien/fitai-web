# Kế Hoạch Kiểm Thử Xác Thực Lịch Tập Onboarding (Onboarding Schedule Verification Test Plan)

## Mục lục
1. [Mục tiêu kiểm thử](#1-mục-tiêu-kiểm-thử)
2. [Bối cảnh & Vấn đề cần kiểm chứng](#2-bối-cảnh--vấn-đề-cần-kiểm-chứng)
3. [Danh sách kịch bản kiểm thử (Test Cases)](#3-danh-sách-kịch-bản-kiểm-thử-test-cases)
   - [Case 1: Flow Onboarding chọn nhiều ngày & nhiều slot qua các Step](#case-1-flow-onboarding-chọn-nhiều-ngày--nhiều-slot-qua-các-step)
   - [Case 2: Chuyển đổi dữ liệu và Serialization sang Protobuf Array](#case-2-chuyển-đổi-dữ-liệu-và-serialization-sang-protobuf-array)
   - [Case 3: Fallback Behavior khi dữ liệu rỗng hoặc undefined](#case-3-fallback-behavior-khi-dữ-liệu-rỗng-hoặc-undefined)
4. [Hướng dẫn chạy test](#4-hướng-dẫn-chạy-test)

---

## 1. Mục tiêu kiểm thử
Xác thực chính xác hành vi của hệ thống khi người dùng chọn lịch tập (Preferred Workout Times) trong quy trình Onboarding:
- Khi người dùng chọn nhiều ngày (ví dụ 4-5 ngày) hoặc nhiều khung giờ trong ngày ở Step 3.
- Khi người dùng bấm tiếp tục chuyển qua các Step 4, Step 5, Step 6 rồi Submit.
- Xác định nguyên nhân tại sao dữ liệu gửi lên gRPC `ProfileService.SaveHealthProfile` lại nhận đúng danh sách ngày đã chọn hay bị rơi về giá trị fallback mặc định `["mon:17:30-19:00", "wed:17:30-19:00", "fri:17:30-19:00"]`.

---

## 2. Bối cảnh & Vấn đề cần kiểm chứng
- **Component**: `OnboardingFlow` (`src/features/onboarding/ui/onboarding-flow.tsx`)
- **Schedule Component**: `WorkoutSchedulePicker` + `AvailabilityScheduler` (`src/features/onboarding/ui/components/workout-schedule-picker.tsx`)
- **Normalizer**: `formatWorkoutTimesToProto` + `normalizeWorkoutTimes` (`src/features/onboarding/domain/workout-times-normalizer.ts`)
- **Server Action**: `saveOnboardingProfileServerAction` (`src/features/onboarding/server/onboarding-actions.ts`)

---

## 3. Danh sách kịch bản kiểm thử (Test Cases)

### Case 1: Flow Onboarding chọn nhiều ngày & nhiều slot qua các Step
- **Mô tả**: Giả lập người dùng đi qua từng bước của Onboarding:
  1. Step 1: Chọn Goal.
  2. Step 2: Điền thông số cơ thể.
  3. Step 3: Bật thêm Thứ 3 (`Tue`), Thứ 5 (`Thu`), Thứ 7 (`Sat`) ngoài Thứ 2, 4, 6 mặc định.
  4. Step 4 -> 5 -> 6: Điền các thông tin còn lại và bấm **Generate my plan**.
- **Kỳ vọng**: `saveOnboardingProfileServerAction` phải nhận được toàn bộ các ngày đã bật thay vì chỉ có 3 ngày mặc định.

### Case 2: Chuyển đổi dữ liệu và Serialization sang Protobuf Array
- **Mô tả**: Kiểm tra hàm `formatWorkoutTimesToProto` với:
  - Input gồm 5 ngày: `mon`, `tue`, `wed`, `thu`, `fri`.
  - Input 1 ngày có 2 khung giờ: `mon: ["06:00-07:30", "17:30-19:00"]`.
- **Kỳ vọng**: Output mảng chuỗi phải chứa đầy đủ các slot tương ứng.

### Case 3: Fallback Behavior khi dữ liệu rỗng hoặc undefined
- **Mô tả**: Kiểm tra khi input là `undefined`, `null`, `{}` hoặc object không có slot nào.
- **Kỳ vọng**: Hàm fallback chính xác về `["mon:17:30-19:00", "wed:17:30-19:00", "fri:17:30-19:00"]`.

---

## 4. Hướng dẫn chạy test
Chạy bằng Vitest:
```bash
pnpm vitest tests/unit/onboarding-schedule-state.test.ts
pnpm vitest tests/component/onboarding-schedule-flow.test.tsx
```
