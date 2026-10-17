# Detailed Implementation Plan: Phone Number & Gmail Auth with Multiavatar

**Feature ID**: `FEAT-AUTH-01`  
**Status**: APPROVED PLAN  
**Design Reference**: [02-design.md](file:///e:/LEARN/a/fitai-web/docs/features/auth-phone-google/02-design.md)  
**Style Constraints**: **NO ICONS**, **Zero-useEffect**, **ConnectRPC Wire Authority**, **Design Tokens**.

---

## 1. File Structure & Responsibilities

```
src/features/auth/
├── model/
│   ├── auth-validation.ts       # Pure validators (VN Phone, Email, Password, Masking)
│   ├── auth.types.ts            # Domain DTOs and Form State types
│   └── use-multiavatar.ts       # Hook & helper for Multiavatar SVG generation
├── server/
│   └── auth-actions.ts          # Server Actions calling ConnectRPC AuthService
├── ui/
│   ├── auth-panel.tsx           # Container with Pill Switcher: "Đăng nhập" | "Đăng ký"
│   ├── login-form.tsx           # Login Form (OTP flow, Password fallback, Google)
│   ├── register-form.tsx        # Register Form (Step 1: OTP, Step 2: Info + Avatar)
│   ├── otp-input-group.tsx      # 6-box OTP input (auto-advance, paste, countdown)
│   ├── avatar-creator.tsx       # Multiavatar preview, shuffle text button, upload
│   └── provider-marks.tsx       # Existing Google SVG mark
tests/unit/auth/
├── auth-validation.test.ts      # Unit tests for Phone & Email validation & masking
├── auth-actions.test.ts         # Unit tests for Server Actions & Error mapping
└── multiavatar.test.ts          # Unit tests for Multiavatar SVG generation
```

---

## 2. Technical Blueprint (Low-Level Details)

### 2.1 Pure Validation Functions (`src/features/auth/model/auth-validation.ts`)
- `isValidVietnamesePhone(phone: string): boolean`: Chấp nhận `03`, `05`, `07`, `08`, `09` (10 số) hoặc `+84...`.
- `normalizePhoneNumber(phone: string): string`: Chuyển đổi về chuẩn E.164 (`+84...`).
- `isValidEmail(email: string): boolean`: Kiểm tra cú pháp RFC email hợp lệ.
- `detectIdentifierType(value: string): "phone" | "email" | "invalid"`:
  - Nếu chứa `@` $\rightarrow$ kiểm tra email.
  - Nếu chỉ chứa số và dấu `+` $\rightarrow$ kiểm tra phone.
- `maskIdentifier(value: string): string`:
  - Phone: `+84 912 ••• 678`
  - Email: `an•••@gmail.com`
- `getEmailProviderUrl(email: string): string | null`:
  - `gmail.com` $\rightarrow$ `https://mail.google.com`
  - `outlook.com` / `hotmail.com` $\rightarrow$ `https://outlook.live.com`
  - `icloud.com` $\rightarrow$ `https://www.icloud.com/mail`

### 2.2 Avatar Creation Hook (`src/features/auth/model/use-multiavatar.ts`)
- Dùng thư viện `@multiavatar/multiavatar`.
- Hàm `generateMultiavatarSvg(seed: string): string`.
- Trả về SVG string an toàn, có thể bọc trong data URL hoặc `dangerouslySetInnerHTML`.

### 2.3 Server Actions (`src/features/auth/server/auth-actions.ts`)
- Chuẩn kết nối: `createClient(AuthService, createServerTransport())`.
- Ghi cookie HTTP-only an toàn với `createAuthCookieOptions()`.
- Xử lý lỗi ConnectRPC chuẩn mực: bắt `ConnectError`, ánh xạ mã lỗi thành tiếng Việt thân thiện (`UNAUTHENTICATED`, `NOT_FOUND`, `ALREADY_EXISTS`, `RESOURCE_EXHAUSTED`).

### 2.4 OTP Input Group (`src/features/auth/ui/otp-input-group.tsx`)
- Không dùng icon!
- 6 inputs, quản lý qua mảng `string[6]`.
- Phím `Backspace`: nếu ô hiện tại rỗng, focus về ô trước đó.
- Phím gõ số: điền vào ô và tự focus ô kế tiếp.
- `onPaste`: lấy 6 số từ clipboard, gán vào state và trigger `onComplete(code)`.

### 2.5 Form UI & Switcher (No Icons Policy)
- Toàn bộ hành động đều hiển thị bằng chữ (Text Links / Buttons):
  - Tab switcher: `[ Đăng nhập ]` và `[ Đăng ký ]` dạng Pill.
  - Ẩn/Hiện mật khẩu: Nhãn văn bản `Hiện` / `Ẩn`.
  - Đổi avatar: Nút text `Đổi kiểu ngẫu nhiên`.
  - Tải ảnh: Nút text `Tải ảnh từ thiết bị`.
  - Shortcut email: Nút `Mở Gmail` / `Mở Outlook`.

---

## 3. TDD Test Plan

1. **Test `auth-validation.test.ts`**:
   - `isValidVietnamesePhone`: Đúng với `0912345678`, `+84912345678`, `0387654321`; sai với `12345`, `0123456789`, `abc`.
   - `detectIdentifierType`: Phát hiện chính xác `"phone"` vs `"email"`.
   - `maskIdentifier`: Che đúng định dạng.
   - `getEmailProviderUrl`: Trả về đúng link mail provider.
2. **Test `multiavatar.test.ts`**:
   - Trả về chuỗi SVG hợp lệ chứa `<svg` và `xmlns`.
   - Hai seed khác nhau sinh ra hai SVG khác nhau.
3. **Test `auth-actions.test.ts`**:
   - `sendOtpAction`: Gọi mock client `sendOTP`, trả về `otpToken`.
   - `verifyOtpAction`: Trả về lỗi khi mã không hợp lệ, set cookie khi hợp lệ.
   - `registerAction`: Gửi đúng payload `RegisterRequest`.
