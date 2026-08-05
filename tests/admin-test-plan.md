# Kịch bản Kiểm thử Module Admin (Admin Test Plan)

Tài liệu này tổng hợp mục lục và chi tiết các kịch bản kiểm thử (Unit Tests & Component Tests) cho module Admin trong dự án FitAI Web.

---

## 📋 Mục lục Test Suites

1. [Admin Exercise Service Unit Tests (`tests/unit/admin-exercise-service.test.ts`)](#1-admin-exercise-service-unit-tests)
2. [Admin User Service Unit Tests (`tests/unit/admin-user-service.test.ts`)](#2-admin-user-service-unit-tests)
3. [Admin UI Component Tests (`tests/components/admin-table.test.tsx`)](#3-admin-ui-component-tests)

---

## 1. Admin Exercise Service Unit Tests

- **File**: `tests/unit/admin-exercise-service.test.ts`
- **Mục tiêu**: Kiểm tra logic xử lý dữ liệu bài tập trong Admin, phân trang Infinite Scroll (Cursor Pagination), các bộ lọc và các hàm mutation status (`approve`, `archive`, `create`, `update`, `delete`).

### Kịch bản chi tiết:
1. `fetchAdminExercises`:
   - [x] Lấy trang đầu tiên thành công với `limit` chỉ định và trả về `nextCursor`.
   - [x] Lấy trang tiếp theo bằng `cursor` hợp lệ.
   - [x] Lọc danh sách theo từ khóa tìm kiếm (`q`).
   - [x] Lọc danh sách theo 4 trạng thái: `created`, `submittedForApproval`, `approved`, `archived`.
   - [x] Lọc danh sách theo `bodyPartId`, `equipmentId`, `difficulty`.
2. `approveExercise`:
   - [x] Đổi trạng thái bài tập từ `created` hoặc `submittedForApproval` sang `approved`.
3. `archiveExercise`:
   - [x] Đổi trạng thái bài tập sang `archived`.
4. `createExercise` & `updateExercise`:
   - [x] Tạo bài tập mới với trạng thái mặc định `created`.
   - [x] Cập nhật thông tin bài tập thành công.
5. `deleteExercise`:
   - [x] Xóa bài tập khỏi danh sách thành công.

---

## 2. Admin User Service Unit Tests

- **File**: `tests/unit/admin-user-service.test.ts`
- **Mục tiêu**: Kiểm tra phân trang người dùng, lọc theo `role` (`admin`/`coach`/`user`), lọc theo `status` (`active`/`banned`), và action `toggleUserStatus`.

### Kịch bản chi tiết:
1. `fetchAdminUsers`:
   - [x] Lấy danh sách phân trang người dùng.
   - [x] Tìm kiếm người dùng theo tên hoặc email.
   - [x] Lọc người dùng theo `role` và `status`.
2. `toggleUserStatus`:
   - [x] Chuyển đổi trạng thái giữa `active` và `banned`.

---

## 3. Admin UI Component Tests

- **File**: `tests/components/admin-table.test.tsx`
- **Mục tiêu**: Kiểm tra việc render của Admin Table với các trạng thái Loading, Empty, Error và Data.

### Kịch bản chi tiết:
1. Render Table:
   - [x] Hiển thị đúng danh sách cột và các dòng dữ liệu.
   - [x] Hiển thị Skeleton Loading khi đang tải dữ liệu.
   - [x] Hiển thị Empty State khi danh sách trả về rỗng.
   - [x] Trigger callback nạp trang tiếp theo khi element Sentinel đi vào viewport.
