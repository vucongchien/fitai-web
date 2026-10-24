# Forgot Password Test Plan

## 1. Overview

Kế hoạch và kịch bản kiểm thử toàn diện cho tính năng **Forgot Password (Quên mật khẩu)** trong `fitai-web`.

## 2. Table of Contents

- [1. Overview](#1-overview)
- [2. Table of Contents](#2-table-of-contents)
- [3. Test Matrix](#3-test-matrix)
- [4. Test Scenarios](#4-test-scenarios)
  - [4.1 Unit Tests — Server Actions](#41-unit-tests--server-actions)
  - [4.2 Unit Tests — State Machine Hook](#42-unit-tests--state-machine-hook)
  - [4.3 Component Tests — AuthPanel Integration](#43-component-tests--authpanel-integration)
- [5. Anti-Enumeration & Security Verification](#5-anti-enumeration--security-verification)
- [6. Verification Commands](#6-verification-commands)

---

## 3. Test Matrix

| Test Suite            | File Path                                      | Focus                                                                                          |
| --------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Server Actions        | `tests/unit/auth/auth-actions.test.ts`         | `sendOtpAction` purpose extension, `resetPasswordAction` validation, ConnectRPC client mapping |
| Hook State Machine    | `tests/unit/auth/forgot-password-flow.test.ts` | 4-step state transitions, anti-enumeration swallow, client-side validation, clean reset        |
| Component Integration | `tests/component/auth-panel.test.tsx`          | Mode toggling, DOM updates, user input handlers, button click flows                            |

---

## 4. Test Scenarios

### 4.1 Unit Tests — Server Actions (`tests/unit/auth/auth-actions.test.ts`)

- **TC-SA-01**: `sendOtpAction` với purpose `"reset_password"` chuẩn hóa identifier (phone / email) và truyền đúng hợp đồng protobuf `AuthService.SendOTP`.
- **TC-SA-02**: `resetPasswordAction` từ chối nếu `resetToken` trống (trả về lỗi `invalid`).
- **TC-SA-03**: `resetPasswordAction` từ chối mật khẩu có độ dài < 8 ký tự.
- **TC-SA-04**: `resetPasswordAction` từ chối khi `newPassword` và `confirmPassword` không trùng khớp.
- **TC-SA-05**: `resetPasswordAction` gọi `AuthService.ResetPassword` thành công và trả về thông điệp thành công.
- **TC-SA-06**: `resetPasswordAction` bắt lỗi từ ConnectRPC (ví dụ token hết hạn) và trả về object error an toàn.

### 4.2 Unit Tests — State Machine Hook (`tests/unit/auth/forgot-password-flow.test.ts`)

- **TC-HK-01**: Khởi tạo ở step `IDENTIFIER` với state rỗng, flags `isPending: false`.
- **TC-HK-02**: `handleSendOtp` với định dạng email/sđt không hợp lệ sẽ set error inline và không gọi server action.
- **TC-HK-03**: `handleSendOtp` thành công lưu `otpToken` và chuyển step sang `VERIFY_OTP`.
- **TC-HK-04 (Security)**: `handleSendOtp` vẫn chuyển sang `VERIFY_OTP` ngay cả khi backend báo lỗi "Account not found" (chống user enumeration).
- **TC-HK-05**: `handleVerifyOtp` với mã hợp lệ lưu `resetToken` và chuyển sang step `NEW_PASSWORD`.
- **TC-HK-06**: `handleVerifyOtp` với mã không hợp lệ giữ nguyên step `VERIFY_OTP` và set error message.
- **TC-HK-07**: `handleResetPassword` kiểm tra độ dài tối thiểu 8 ký tự và khớp mật khẩu trước khi gọi action.
- **TC-HK-08**: `handleResetPassword` thành công chuyển step sang `SUCCESS`.
- **TC-HK-09**: `handleResetPassword` khi token hết hạn chuyển hướng người dùng "Start over".
- **TC-HK-10**: `goToIdentifierStep` và `reset` xóa sạch token và đưa về step ban đầu.

### 4.3 Component Tests — AuthPanel Integration (`tests/component/auth-panel.test.tsx`)

- **TC-UI-01**: Click "Forgot password?" trên form Login chuyển sang màn hình "Reset your password".
- **TC-UI-02**: Click "Back to login" tại màn hình quên mật khẩu chuyển ngược lại form "Log in".
- **TC-UI-03**: Nhập identifier và click "Send verification code" chuyển sang màn hình OTP với header "Check your email" hoặc "Check your phone".

---

## 5. Anti-Enumeration & Security Verification

- **Zero Account Exposure**: Thông báo thành công được hiển thị đồng nhất: _"If an account exists with these details, you'll receive instructions shortly."_
- **No Token in URL**: Toàn bộ `otpToken` và `resetToken` được lưu trữ nội bộ trong React state, không xuất hiện trên query params hay path.
- **Zero useEffect**: Tất cả state transition được kích hoạt trực tiếp từ user event handlers hoặc microtask scheduler.

---

## 6. Verification Commands

```bash
# Chạy toàn bộ test auth
pnpm test tests/unit/auth/ tests/component/auth-panel.test.tsx

# Kiểm tra typecheck
pnpm typecheck

# Kiểm tra tuân thủ bộ kỹ năng (Zero useEffect, React 19 standards)
pnpm audit:skills
```
