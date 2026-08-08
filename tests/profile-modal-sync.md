# Mục Lục & Kịch Bản Kiểm Thử: Đồng Bộ Profile Details Modal & Personal Info (Nhóm 2)

## 1. Tổng Quan Mục Tiêu Kiểm Thử
Tài liệu này định nghĩa chi tiết các kịch bản kiểm thử (Test Scenarios) và mục lục các unit test để kiểm chứng:
1. **Task 2.1**: Đồng bộ thông tin người dùng Google OAuth & User Session:
   - Khởi tạo chính xác `dateOfBirth` và `gender` (`Male`, `Female`, `Other`) từ `profile.user.dateOfBirth` và `profile.user.gender` trong `PersonalInfoForm` và mapper.
2. **Task 2.2**: Cập nhật `BodyMetricsForm`, `GoalsForm`, `EquipmentForm`:
   - Đồng bộ danh mục `equipmentList` (Full Gym, Dumbbells, Barbell, Bodyweight, Resistance Band, Kettlebell, Machine).
   - Đồng bộ danh mục `nhóm cơ` (Chest, Back, Legs, Shoulders, Arms, Core, Glutes, Full Body) và `Primary Goals`.
   - Đảm bảo khi bấm **Save**, dữ liệu cập nhật ngay lập tức vào state giao diện (`ProfileContent` deep merge) và gửi `updateProfileServerAction` lên backend gRPC.
   - Bổ sung trạng thái `isSaving` (loading indicator), error handling, và confirm dialog.

---

## 2. Mục Lục Test Suites & Test Cases

### Suite 1: `tests/unit/profile/profile-mapper.test.ts`
- **Case 1.1**: `translateGender`
  - Chuyển đổi `"MALE"` -> `"Male"`, `"FEMALE"` -> `"Female"`, `"OTHER"` -> `"Other"`.
  - Hỗ trợ giữ nguyên định dạng Titlecase `"Male"`, `"Female"`, `"Other"`.
- **Case 1.2**: `translateMuscleGroup`
  - Map đầy đủ các nhóm cơ từ DB catalog (`CHEST`, `BACK`, `LEGS`, `SHOULDERS`, `ARMS`, `CORE`, `GLUTES`, `FULL_BODY`).
- **Case 1.3**: `translateEquipment`
  - Map đầy đủ các thiết bị (`FULL_GYM`, `DUMBBELL_ONLY`, `BARBELL`, `BODYWEIGHT`, `RESISTANCE_BAND`, `KETTLEBELL`, `MACHINE`).
- **Case 1.4**: `translateGoal`
  - Map các mục tiêu (`BUILD_MUSCLE`, `FAT_LOSS`, `STRENGTH`, `ENDURANCE`).
- **Case 1.5**: `mapRawDataToProfileViewModel`
  - Khởi tạo chính xác `user.dateOfBirth` và `user.gender` từ protobuf raw data.
  - Tự động tính BMI chính xác và gán category chuẩn (`Normal`, `Underweight`, `Overweight`, `Obese`).

### Suite 2: `tests/unit/profile/profile-details-modal.test.tsx`
- **Case 2.1**: `PersonalInfoForm`
  - Khởi tạo giá trị ban đầu cho `dateOfBirth` và `gender` từ profile user.
  - Cho phép người dùng chuyển đổi giữa các nút giới tính (`Male`, `Female`, `Other`) và chọn khung giờ tập.
  - Khi bấm Save: gọi `onSave` với dữ liệu mới ngay lập tức và gửi `updateProfileServerAction`.
- **Case 2.2**: `BodyMetricsForm`
  - Hiển thị cân nặng, chiều cao, tỉ lệ mỡ và tính BMI tương ứng.
  - Khi bấm Save Changes -> mở Confirm Dialog -> bấm Confirm & Save: cập nhật state giao diện tức thì và gọi `updateProfileServerAction`.
- **Case 2.3**: `GoalsForm`
  - Hiển thị đầy đủ danh sách nhóm cơ từ DB Catalog (`Chest`, `Back`, `Legs`, `Shoulders`, `Arms`, `Core`, `Glutes`, `Full Body`).
  - Hiển thị đầy đủ Primary Goals (`Build Muscle`, `Lose Fat`, `Strength`, `Endurance`).
  - Khi bấm Save Goal Plan: cập nhật state giao diện tức thì và gọi `updateProfileServerAction`.
- **Case 2.4**: `EquipmentForm`
  - Hiển thị đầy đủ danh sách thiết bị từ DB Catalog (`Full Gym`, `Dumbbells`, `Barbell`, `Bodyweight`, `Resistance Band`, `Kettlebell`, `Machine`).
  - Cho phép toggle chọn/bỏ chọn thiết bị và lưu tức thì.

### Suite 3: `tests/unit/profile/profile-actions.test.ts`
- **Case 3.1**: `updateProfileServerAction`
  - Serialize chuẩn xác các trường `dateOfBirth`, `gender` (uppercase), `availableEquipment` (enum), `preferredMuscleGroups` (enum), `goals` (enum), `weightKg`, `heightCm`, `bodyFatPercent`.
  - Trả về `{ success: true }` khi gRPC update thành công.
- **Case 3.2**: `mapGoalToEnum` & `mapEquipmentToEnum`
  - Map chính xác các chuỗi định dạng từ giao diện người dùng sang Protobuf Enum.

---

## 3. Lệnh Chạy Kiểm Thử

```powershell
pnpm vitest run tests/unit/profile/
pnpm vitest run
```
