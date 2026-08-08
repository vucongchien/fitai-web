# Kế hoạch Kiểm thử Hồ sơ Sức khỏe & Onboarding qua gRPC (Profile & Onboarding Test Plan)

Tài liệu này mô tả chi tiết mục lục, kịch bản kiểm thử (Test Scenarios), ma trận ca kiểm thử (Test Cases) và phương pháp xác minh cho module **User Health Profile & Onboarding** kết nối trực tiếp gRPC backend `ProfileService`, `WorkoutExecutionService`, `NotificationService`.

---

## 1. Mục tiêu Kiểm thử (Test Objectives)

1. **Chuẩn hóa Định danh & Dữ liệu (Identity & Data Normalization)**:
   - Đảm bảo `userId` được tự động trích xuất từ phiên xác thực (Auth Cookie/Session) và inject vào các gRPC message.
   - Chuẩn hóa toàn bộ Enum: Goals (`BUILD_MUSCLE`, `FAT_LOSS`), Coach Style (`MOTIVATIONAL`, `STRICT`, `SCIENTIFIC`), Experience Level (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`), Severity (`MILD`, `MODERATE`, `SEVERE`).
2. **Toàn vẹn Dữ liệu Hồ sơ (Profile Data Integrity)**:
   - Lấy đồng thời thông tin hồ sơ sức khỏe (`ProfileService.GetProfile`), kỷ lục cá nhân 1RM (`WorkoutExecutionService.GetPersonalRecords`) và cấu hình thông báo (`NotificationService.GetNotificationSettings`).
   - Xử lý mượt mà khi người dùng là người mới (New User) chưa có PR hoặc chưa hoàn thiện hồ sơ.
3. **Khả năng Phục hồi & Phòng chống Lỗi (Resilience & Error Handling)**:
   - Xử lý đầy đủ 4 trạng thái UI: Loading, Error với Retry Action, Empty State và Success State.
   - Khi mất kết nối hoặc backend timeout, fallback hiển thị giao diện báo lỗi thân thiện thay vì crash ứng dụng.

---

## 2. Mục lục Ca Kiểm thử (Test Scenarios Index)

### 2.1. Khai báo Hồ sơ Onboarding (`SaveHealthProfile`)
- **TC-PROF-01**: Khai báo Onboarding thành công với đầy đủ chỉ số (chiều cao, cân nặng, mục tiêu, ngày sinh, chấn thương) $\rightarrow$ Gửi gRPC `SaveHealthProfile`, nhận `completionRate`, kích hoạt `aiCoachActivated`.
- **TC-PROF-02**: Chuẩn hóa Enum & Mapping:
  - Goal `"build-muscle"` $\rightarrow$ `["BUILD_MUSCLE"]`.
  - Experience `"beginner"` $\rightarrow$ `"BEGINNER"`.
  - Coach Style `"balanced"` $\rightarrow$ `"SCIENTIFIC"`.
  - Equipment `"Full Gym & Cable"` $\rightarrow$ `["FULL_GYM"]`.
- **TC-PROF-03**: Xử lý khi có chấn thương $\rightarrow$ Đóng gói đúng `InjuryInput` `{ muscle_group, severity, notes }`.
- **TC-PROF-04**: Xử lý khi gRPC backend lỗi kết nối $\rightarrow$ Trả về mã lỗi rõ ràng để UI hiển thị thông báo.

### 2.2. Lấy Thông tin Hồ sơ Chi tiết (`getProfileData`)
- **TC-PROF-05**: Lấy dữ liệu hồ sơ gRPC thành công $\rightarrow$ Tổng hợp đúng ViewModel gồm user info, health metrics, 1RM PRs, streak và notification settings.
- **TC-PROF-06**: Xử lý khi chưa có Access Token $\rightarrow$ Fallback an toàn hoặc yêu cầu đăng nhập lại.
- **TC-PROF-07**: Xử lý khi `GetPersonalRecords` hoặc `GetNotificationSettings` rỗng $\rightarrow$ Cung cấp mảng rỗng mặc định mà không làm vỡ giao diện.

### 2.3. Cập nhật Chỉ số & Quản lý Chấn thương (Server Actions)
- **TC-PROF-08**: `updateGoalsAndStyleAction` $\rightarrow$ Gọi gRPC `ProfileService.UpdateProfile` thành công.
- **TC-PROF-09**: `logBodyMetricsAction` $\rightarrow$ Gọi gRPC `ProfileService.LogPeriodicMetrics` với cân nặng, body fat %.
- **TC-PROF-10**: `reportInjuryAction` $\rightarrow$ Gọi gRPC `ProfileService.ReportInjury` và lưu vết chấn thương.
- **TC-PROF-11**: `recoverInjuryAction` $\rightarrow$ Gọi gRPC `ProfileService.RecoverInjury` đánh dấu đã hồi phục.

---

## 3. Danh sách File Kiểm thử Liên quan

| File Kiểm thử | Phạm vi Kiểm thử |
| :--- | :--- |
| `tests/unit/profile-grpc-service.test.ts` | gRPC Profile Service, Data Aggregation, 1RM, Notifications |
| `tests/unit/onboarding-grpc-actions.test.ts` | Onboarding Server Actions, Enum Mapping, Validation |
| `tests/unit/profile/profile-mapper.test.ts` | Mapping từ Protobuf Response sang Profile ViewModel |
| `tests/component/profile-setup.test.tsx` | UI Profile Setup, Availability, Equipment & Injury Managers |
