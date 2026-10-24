# Implementation Tasks: Phone Number & Gmail Auth with Multiavatar

**Feature ID**: `FEAT-AUTH-01`  
**Status**: IN PROGRESS  
**Plan Reference**: [03-plan.md](file:///e:/LEARN/a/fitai-web/docs/features/auth-phone-google/03-plan.md)

---

## Task Checklist

### Phase 1: Models, Utilities & Unit Tests (TDD)

- [x] **Task 1.1**: Tạo `src/features/auth/model/auth.types.ts` định nghĩa các kiểu dữ liệu DTO và Form States.
- [x] **Task 1.2**: Viết unit test `tests/unit/auth/auth-validation.test.ts` kiểm thử Phone/Email validator, detect, mask.
- [x] **Task 1.3**: Triển khai `src/features/auth/model/auth-validation.ts` và chạy test pass.
- [x] **Task 1.4**: Viết unit test `tests/unit/auth/multiavatar.test.ts` và triển khai `src/features/auth/model/use-multiavatar.ts`.

### Phase 2: Server Actions & Wire Authority

- [x] **Task 2.1**: Triển khai `src/features/auth/server/auth-actions.ts` kết nối gRPC `AuthService` (SendOTP, VerifyOTP, Login, Register) và thiết lập session cookies.
- [x] **Task 2.2**: Viết unit test `tests/unit/auth/auth-actions.test.ts` mock ConnectRPC transport và kiểm thử các luồng thành công/thất bại.

### Phase 3: UI Components (No Icons, Professional & Dynamic)

- [x] **Task 3.1**: Triển khai `src/features/auth/ui/otp-input-group.tsx` (6 ô số, auto-advance, backspace, paste, countdown đếm ngược).
- [x] **Task 3.2**: Triển khai `src/features/auth/ui/avatar-creator.tsx` (Multiavatar SVG live preview khi gõ tên, nút text Đổi kiểu ngẫu nhiên, nút text Tải ảnh từ máy, 4 preset avatar).
- [x] **Task 3.3**: Triển khai `src/features/auth/ui/login-form.tsx` (Google button, Divider, Input thông minh SĐT/Email, OTP verify + shortcut mở Gmail/Outlook, Password login).
- [x] **Task 3.4**: Triển khai `src/features/auth/ui/register-form.tsx` (Step 1: OTP verify, Step 2: Họ tên + AvatarCreator + Password + Giới tính + Ngày sinh).
- [x] **Task 3.5**: Triển khai `src/features/auth/ui/auth-panel.tsx` (Pill tab switcher Đăng nhập / Đăng ký).
- [x] **Task 3.6**: Cập nhật `src/app/(public)/login/page.tsx` tích hợp `AuthPanel`.
- [x] **Task 3.7**: Bổ sung CSS tokens và layout trong `src/app/globals.css` (Glassmorphism, Pill tabs, OTP boxes, Avatar frame).

### Phase 4: Verification & Audits

- [x] **Task 4.1**: Chạy `pnpm test` (518/518 tests passed 100%).
- [x] **Task 4.2**: Chạy `pnpm audit:skills` (Zero-useEffect, React 19 standards, Design tokens).
- [x] **Task 4.3**: Chạy `pnpm audit:comments` (Zero verbose comments).
- [x] **Task 4.4**: Chạy `pnpm lint` và `pnpm typecheck` (0 errors).
- [x] **Task 4.5**: Chạy `pnpm build` xác nhận build thành công.
- [x] **Task 4.6**: Khởi động dev server và chụp snapshot qua `stitch capture browser --url="http://localhost:3000/login"`.
