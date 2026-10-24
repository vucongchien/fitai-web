# Forgot Password — Specification

## Summary

Cho phép người dùng đặt lại mật khẩu khi quên, thông qua luồng xác minh OTP gửi đến email/số điện thoại đã đăng ký. Feature này hoàn thiện nút "Forgot password?" hiện tại (đang là `alert()` stub) trên `LoginForm`.

### User/Business Value

- Giảm tải support: người dùng tự phục hồi tài khoản thay vì liên hệ hỗ trợ.
- Tăng retention: loại bỏ rào cản khi người dùng quên mật khẩu.
- Backend đã có sẵn toàn bộ RPC (`SendOTP`, `VerifyOTP`, `ResetPassword`), chỉ cần wire UI + server actions.

## Actors & Entry Point

| Actor                     | Trigger                                   |
| ------------------------- | ----------------------------------------- |
| Người dùng chưa đăng nhập | Click "Forgot password?" trên `LoginForm` |

## Scope

### In-scope

- Luồng 3 bước: nhập identifier → xác minh OTP → đặt mật khẩu mới.
- Hỗ trợ cả email và số điện thoại Việt Nam.
- Tái sử dụng `OtpInputGroup`, `useOtpCountdown`, validation utilities hiện có.
- Server actions mới: mở rộng `sendOtpAction` + tạo `resetPasswordAction`.
- Xử lý đầy đủ Loading / Error / Empty states.

### Non-goals

- Đổi mật khẩu khi đã đăng nhập (`ChangePassword` — feature riêng).
- Forgot password qua link email (magic link) — backend dùng OTP.
- Rate limiting UI-side (backend đã xử lý).
- Tạo route `/forgot-password` riêng — giữ trong `AuthPanel` state machine.

## Current vs Expected Behavior

| Aspect                 | Current                                          | Expected                                                        |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| Nút "Forgot password?" | `alert("Password reset link...")`                | Chuyển `AuthPanel` sang mode `"forgot-password"`                |
| Send OTP cho reset     | `sendOtpAction` chỉ nhận `"login" \| "register"` | Thêm `"reset_password"` vào allowed purposes                    |
| Reset password action  | Không tồn tại                                    | `resetPasswordAction(resetToken, newPassword, confirmPassword)` |
| UI flow                | Không có                                         | 3-step form trong `AuthPanel`                                   |

## User Scenario

### UC-01: Happy Path — Reset mật khẩu thành công

**Preconditions:** Người dùng đã có tài khoản với email/phone đã xác minh.

**Flow:**

1. Tại màn hình Login, user click "Forgot password?"
2. `AuthPanel` chuyển sang mode `"forgot-password"`, hiển thị **Step 1: Enter Identifier**
   - Input field nhập email hoặc số điện thoại
   - Nút "Send verification code"
   - Link "Back to login" để quay lại
3. User nhập identifier → click "Send verification code"
   - Gọi `sendOtpAction(identifier, "reset_password")`
   - **Luôn hiển thị**: "If an account exists with these details, you'll receive instructions shortly." (anti-enumeration)
   - Chuyển sang **Step 2** bất kể backend response
   - Nếu lỗi kỹ thuật (network, 500) → hiển thị generic error
4. **Step 2: Verify OTP**
   - Hiển thị `OtpInputGroup` (6 ô số, tự động submit khi nhập đủ)
   - Badge hiển thị identifier đã mask (`0912 ••• 678` hoặc `a•••@example.com`)
   - Nút "Change phone/email" quay lại Step 1
   - Countdown resend (60s) — khi hết cho phép gửi lại OTP
   - Smart shortcut: nếu email → nút mở Gmail/Outlook
5. User nhập OTP → tự động verify
   - Gọi `verifyOtpAction(otpToken, code)`
   - Nếu valid → nhận `resetToken`, chuyển **Step 3**
   - Nếu invalid → hiển thị error, cho nhập lại
6. **Step 3: Set New Password**
   - 2 fields: "New password" + "Confirm password"
   - Password validation: minimum 8 ký tự
   - Show/hide password toggle (Eye/EyeOff)
   - Nút "Reset password"
7. User nhập mật khẩu mới → submit
   - Gọi `resetPasswordAction(resetToken, newPassword, confirmPassword)`
   - Nếu thành công → hiển thị success message, tự động chuyển về Login form sau 2s
   - Nếu lỗi (token expired, password yếu, v.v.) → hiển thị error

**Postconditions:** Mật khẩu đã được đổi. User có thể đăng nhập với mật khẩu mới.

### UC-02: Identifier không tồn tại (Anti-Enumeration)

1. User nhập email/phone chưa đăng ký
2. UI **vẫn hiển thị thành công**: "If an account exists with these details, you'll receive instructions shortly."
3. Chuyển sang Step 2 (OTP) bình thường — user sẽ không nhận được OTP nhưng UI không tiết lộ điều đó
4. Nếu user nhập OTP bất kỳ → backend trả "Invalid verification code" (generic error)
5. User có thể quay về Step 1 hoặc Login

### UC-03: OTP hết hạn hoặc sai

1. User nhập OTP sai → error "Invalid verification code"
2. User nhập OTP hết hạn → error "Verification code has expired"
3. User có thể gửi lại OTP (sau khi countdown hết)

### UC-04: Reset token hết hạn

1. User ở Step 3 quá lâu, `resetToken` hết hạn
2. Submit → backend trả lỗi → UI hiển thị: "Reset session has expired. Please start over."
3. Nút "Start over" quay về Step 1

### UC-05: User quay lại Login giữa chừng

1. User ở bất kỳ step nào, click "Back to login"
2. `AuthPanel` chuyển về mode `"login"`, reset toàn bộ state forgot-password
3. Không side effect nào còn lại

## Functional Requirements

| ID    | Requirement                                                                                           |
| ----- | ----------------------------------------------------------------------------------------------------- |
| FR-01 | `AuthPanel` hỗ trợ mode `"forgot-password"` ngoài `"login"` và `"register"`                           |
| FR-02 | Step 1 validate identifier (email hoặc phone VN) bằng `detectIdentifierType()` trước khi gọi API      |
| FR-03 | `sendOtpAction` chấp nhận purpose `"reset_password"`                                                  |
| FR-04 | Step 2 tái sử dụng `OtpInputGroup` với cùng UX pattern như RegisterForm                               |
| FR-05 | `verifyOtpAction` trả về `resetToken` khi purpose là reset password                                   |
| FR-06 | Tạo `resetPasswordAction(resetToken, newPassword, confirmPassword)` gọi `AuthService.ResetPassword`   |
| FR-07 | Step 3 validate: newPassword ≥ 8 ký tự, newPassword === confirmPassword                               |
| FR-08 | Sau reset thành công, hiển thị success rồi tự động chuyển về Login                                    |
| FR-09 | Mọi step xử lý đầy đủ Loading (button disabled + spinner), Error (inline message), và navigation back |
| FR-10 | Nút "Back to login" hoặc "Start over" luôn available ở mọi step                                       |

## Business Rules & Invariants

- **Anti-enumeration (CRITICAL)**: Step 1 (Send OTP) **luôn hiển thị success message** bất kể identifier có tồn tại hay không. Không bao giờ tiết lộ account tồn tại qua error message. Backend nên trả success trong cả hai trường hợp; nếu backend trả error cho identifier không tồn tại, UI phải swallow và vẫn hiển thị success.
- `resetToken` là one-time use, do backend enforce. UI không cần track.
- OTP expiry & rate limiting do backend enforce. UI chỉ hiển thị error message trả về.
- Không auto-login sau reset — user phải đăng nhập lại với mật khẩu mới (security best practice).
- Không lưu bất kỳ state nào vào URL/query params (token, OTP) — tất cả trong React state.

### Standardized Error Messages (Security-Conscious)

| Context                    | Message                                                                         | Rationale                                          |
| -------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| Forgot password — send OTP | "If an account exists with these details, you'll receive instructions shortly." | Anti-enumeration: không tiết lộ account có tồn tại |
| Send OTP (generic)         | "If an eligible account exists, a verification code will be sent."              | Anti-enumeration                                   |
| OTP invalid/expired        | "Invalid verification code" / "Verification code has expired"                   | Generic, không tiết lộ thêm info                   |
| Reset token expired        | "Reset session has expired. Please start over."                                 | Generic                                            |
| Password validation        | "Password must be at least 8 characters" / "Passwords do not match"             | Client-side, ok to be specific                     |

## Validation Rules

| Field            | Rule                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| Identifier       | Email valid hoặc phone VN (`0[35789]...` 10 số hoặc `+84[35789]...`) |
| OTP              | Exactly 6 digits                                                     |
| New password     | ≥ 8 ký tự                                                            |
| Confirm password | Phải khớp new password                                               |

## Acceptance Criteria

- [ ] **AC-01**: Click "Forgot password?" trên LoginForm chuyển sang forgot-password flow (không còn `alert()`).
- [ ] **AC-02**: Nhập email/phone hợp lệ → nhận OTP thành công.
- [ ] **AC-03**: Nhập identifier không tồn tại → vẫn hiển thị success message (anti-enumeration), không tiết lộ account có tồn tại.
- [ ] **AC-04**: OTP 6 số auto-submit, invalid OTP hiển thị error.
- [ ] **AC-05**: Resend OTP hoạt động sau countdown 60s.
- [ ] **AC-06**: Nhập mật khẩu mới + confirm → reset thành công → chuyển về Login.
- [ ] **AC-07**: Password mismatch hoặc < 8 ký tự → validation error trước khi gọi API.
- [ ] **AC-08**: Reset token hết hạn → error message + option "Start over".
- [ ] **AC-09**: "Back to login" hoạt động ở mọi step, reset state sạch.
- [ ] **AC-10**: Toàn bộ flow không dùng `useEffect` cho derived state hoặc event handling.

## Open Questions & Decisions Needed

| #    | Question                                                                                                | Impact                         | Recommendation                                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Q-01 | Giữ forgot-password trong `AuthPanel` state machine (thêm mode) hay tạo route `/forgot-password` riêng? | Routing, UX, code organization | **Recommend: thêm mode vào `AuthPanel`** — consistent với pattern login/register hiện tại, không cần thêm route, transition mượt hơn. |
| Q-02 | Sau reset thành công, có nên pre-fill identifier vào ô login để user chỉ cần nhập password?             | UX convenience                 | **Recommend: Có** — giảm friction, user không cần nhập lại email/phone.                                                               |
| Q-03 | Heading/title cho mỗi step nên dùng tiếng Việt hay tiếng Anh? LoginForm hiện đang dùng English labels.  | UI consistency                 | **Recommend: English** — match LoginForm/RegisterForm pattern hiện tại.                                                               |

## Assumptions

- Backend `AuthService.ResetPassword` đã deploy và hoạt động. Nếu chưa → feature chỉ có thể test khi backend sẵn sàng.
- `SendOTP` với purpose `"reset_password"` không yêu cầu authentication (user chưa login).
- Backend trả error message đủ rõ để hiển thị trực tiếp cho user (hoặc UI cần map error codes → user-friendly messages).
