# Feature Specification: Phone Number & Gmail Authentication (FitAI Web)

**Feature ID**: `FEAT-AUTH-01`  
**Status**: DRAFT (Pending Human Review)  
**Related Documents**: [DESIGN.md](file:///e:/LEARN/a/fitai-web/DESIGN.md), [ux-flow-spec.md](file:///e:/LEARN/a/fitai-web/docs/ux-flow-spec.md), [auth_service_pb.ts](file:///e:/LEARN/a/fitai-web/src/shared/api/gen/contracts/generic/auth/v1/service/auth_service_pb.ts)

---

## 1. Executive Summary & Value

### 1.1 Problem Statement

Giao diện đăng nhập hiện tại ([/login](file:///e:/LEARN/a/fitai-web/src/app/%28public%29/login/page.tsx)) chỉ hỗ trợ 2 nút Social OAuth (Google, Facebook) thông qua popup, chưa hỗ trợ người dùng đăng nhập bằng **Số điện thoại** hoặc **Email/Gmail trực tiếp** (với OTP hoặc Mật khẩu). Trong khi đó, tại thị trường Việt Nam:

1. Phần lớn người dùng phòng gym chuộng đăng nhập tức thì bằng **Số điện thoại** nhận mã OTP SMS qua điện thoại.
2. Nhiều người dùng không muốn liên kết tài khoản mạng xã hội hoặc gặp lỗi khi trình duyệt mobile chặn popup OAuth.

### 1.2 Desired Outcome

- Cho phép người dùng đăng nhập/đăng ký liền mạch trên cùng một giao diện `/login` bằng:
  1. **Google OAuth 1-Click** (Popup / Redirect fallback).
  2. **Số điện thoại Việt Nam (+84 / 0x...) hoặc Email** thông qua mã **OTP** (Passwordless Authentication).
  3. **Mật khẩu truyền thống** (Password fallback cho tài khoản đã thiết lập).
- Đồng bộ 100% với hợp đồng gRPC backend `AuthService` (`Login`, `SendOTP`, `VerifyOTP`, `LoginWithOAuth`).
- Thiết kế chuẩn token hệ thống [DESIGN.md](file:///e:/LEARN/a/fitai-web/DESIGN.md), sẵn sàng cho quy trình kiểm thử và review qua Google Stitch CLI.

---

## 2. Actors & Entry Points

- **Primary Actor**: Khách vãng lai, người dùng mới đăng ký hoặc hội viên quay lại.
- **Entry Point**: Route công khai `/login`.
- **Exit Points**:
  - Người dùng mới / hồ sơ chưa hoàn thiện (< 80%): Điều hướng sang `/onboarding`.
  - Người dùng đã hoàn thiện hồ sơ: Điều hướng sang `/home`.

---

## 3. Scope & Non-Goals

### In-Scope (Phase 1)

- **UI Form Đa phương thức (Unified Login Panel)**:
  - Nút Social Google nổi bật ở trên cùng.
  - Phân cách `"hoặc tiếp tục với"`.
  - Input nhận diện thông minh (`identifier`): Tự động phát hiện là **Số điện thoại** hay **Email/Gmail**.
  - Luồng xác thực mã **OTP 6 số** (giao diện 6 ô pin, đếm ngược cooldown 60s, nút gửi lại).
  - Tùy chọn chuyển sang "Đăng nhập bằng mật khẩu".
- **Backend Wire Integration**:
  - ConnectRPC Server Actions gọi trực tiếp `AuthService.Login`, `AuthService.SendOTP`, `AuthService.VerifyOTP`.
  - Thiết lập session cookies (`fitai_access_token`, `fitai_refresh_token`) an toàn (`httpOnly`, `secure`, `sameSite: "lax"`).
- **Trạng thái & Edge Cases**:
  - Đầy đủ 3 trạng thái: `Loading` (skeleton/spinner), `Error` (thông báo lỗi chi tiết, đếm ngược khoá khi sai OTP 3 lần), `Empty`/Idle.
- **Visual Design & Stitch Verification**:
  - Tuân thủ palette Dark Theme + Emerald của `DESIGN.md`.
  - Snapshot test & review qua Google Stitch CLI (`stitch capture` -> `stitch review`).

### Out-of-Scope (Non-Goals)

- Đăng nhập sinh trắc học WebAuthn/Passkeys (dành cho phase sau).
- Tính năng đăng ký tổ chức Brand/Gym Partner (`RegisterBrand` thuộc về portal đối tác riêng).
- Tự triển khai SMS Gateway tại Frontend (toàn bộ SMS/Email OTP do backend Go xử lý).

---

## 4. User Scenarios & Workflows

### Scenario 1: Đăng nhập nhanh bằng Số điện thoại hoặc Email qua OTP (Chính)

1. **Given**: Người dùng mở trang `/login`. Ô input tự động được focus sẵn (`autoFocus`).
2. **When**: Người dùng nhập số điện thoại hoặc email.
   - **Pre-check (Kiểm tra trước)**: Hệ thống kiểm tra format tức thì khi gõ:
     - SĐT Việt Nam: Đầu số 03, 05, 07, 08, 09 (10 số) hoặc format quốc tế `+84...`.
     - Email: Cú pháp chuẩn `...@...`.
     - Nút "Tiếp tục" chỉ sáng màu Emerald khi dữ liệu hợp lệ. Nếu sai định dạng, hiển thị lỗi nhẹ ngay tại field, không gửi request thừa lên backend.
3. **When**: Người dùng bấm **"Tiếp tục"** (hoặc nhấn phím `Enter`).
4. **Then**:
   - Frontend chuẩn hóa format E.164 (`+84...`) nếu là SĐT.
   - Gọi Server Action `sendOtpAction({ identifier, purpose: "login" })`.
   - UI chuyển sang bước nhập OTP với trải nghiệm tối ưu:
     - **Auto-focus**: Con trỏ tự động nhảy vào ô OTP số 1.
     - **Hiển thị định danh che mờ**: "Mã 6 số đã gửi tới `+84 912 ••• 678`" kèm nút nhỏ **"Đổi số / Sửa"** nếu lỡ nhập sai.
     - **Tiện ích mở nhanh ứng dụng (Smart Shortcuts)**:
       - _Nếu là Gmail (`@gmail.com`)_: Hiển thị nút **"Mở Gmail"** (mở `https://mail.google.com` trong tab mới).
       - _Nếu là Outlook (`@outlook.com`, `@hotmail.com`)_: Hiển thị nút **"Mở Outlook"**.
       - _Dòng ghi chú nhỏ_: "Kiểm tra cả hòm thư Spam nếu chưa thấy mã".
       - _Nếu là SĐT trên di động (Android Chrome / iOS Safari)_: Kích hoạt **WebOTP API** (`navigator.credentials.get`) để nhận diện SMS 1-chạm tự động điền mã không cần mở app Tin nhắn.
     - **Trải nghiệm gõ phím OTP (6 Pin Inputs)**:
       - Tự động nhảy ô tiếp theo khi gõ 1 số.
       - Tự động lùi về ô trước khi bấm Backspace.
       - Hỗ trợ **Paste** chuỗi 6 số từ clipboard (tự tách và điền vào 6 ô).
       - Khi điền đủ 6 số: Tự động kích hoạt submit verify ngay lập tức mà không bắt bấm nút thêm.
     - **Đồng hồ đếm ngược**: 60 giây trước khi mở nút "Gửi lại mã OTP".
5. **When**: Mã OTP được gửi đi kiểm tra.
6. **Then**:
   - Gọi `verifyOtpAction({ otpToken, code })`.
   - Nếu hợp lệ: Lưu session cookie, kiểm tra `ProfileService.GetProfile` $\rightarrow$ chuyển hướng `/home` hoặc `/onboarding`.
   - Nếu sai mã: Rung nhẹ 6 ô OTP, viền chuyển màu đỏ, thông báo: "Mã xác thực không chính xác. Bạn còn X lần thử".
   - Nếu sai 3 lần liên tiếp: Khoá nhập trong 15 phút, hiển thị đồng hồ đếm ngược (theo [ux-flow-spec.md](file:///e:/LEARN/a/fitai-web/docs/ux-flow-spec.md#L30)).

### Scenario 2: Đăng ký tài khoản mới kèm Cá nhân hóa Avatar (Registration Flow)

1. **Given**: Người dùng chọn tab/nút **"Đăng ký tài khoản"**.
2. **When**: Người dùng nhập Số điện thoại hoặc Email $\rightarrow$ Nhận và nhập mã OTP 6 số để xác thực danh tính (`purpose: "register"`).
3. **Then**: Form mở sang màn hình **"Thiết lập hồ sơ cá nhân"**:
   - **Avatar Canvas tương tác (`96x96px`)**:
     - **Sinh Avatar tự động theo tên (`@multiavatar/multiavatar`)**: Ngay khi người dùng gõ vào ô "Họ và tên", khung avatar SVG tự động cập nhật hình ảnh hoạt hình độc bản theo từng ký tự gõ vào theo thời gian thực (Zero latency, vector sắc nét).
     - **Nút "🎲 Đổi kiểu khác" (Shuffle Dice)**: Cho phép bấm ngẫu nhiên để thử các phong cách avatar Multiavatar thú vị khác nhau.
     - **Nút "📸 Tải ảnh lên" (Upload Custom Image)**: Cho phép kéo thả hoặc chọn ảnh thật từ máy/điện thoại (JPG/PNG/WebP, max 5MB), hiển thị xem trước tròn tại chỗ.
     - **Thanh avatar gợi ý nhanh (Presets)**: 4 avatar mẫu được sinh sẵn để người dùng click chọn ngay trong 1 chạm.
   - **Các trường thông tin bắt buộc** (theo hợp đồng backend `RegisterRequest`):
     - `fullName`: Họ và tên (tối thiểu 2 ký tự).
     - `password`: Mật khẩu (tối thiểu 8 ký tự, có mắt ẩn/hiện mật khẩu).
     - `gender`: Giới tính (`Nam`, `Nữ`, `Khác`).
     - `dateOfBirth`: Ngày sinh (Bộ chọn ngày hỗ trợ tính tuổi $\ge 14$).
4. **When**: Người dùng bấm **"Hoàn tất đăng ký"**.
5. **Then**:
   - Client gọi Server Action `registerAction({ identifier, password, fullName, gender, dateOfBirth, avatarUrl })`.
   - Backend tạo tài khoản, sinh session JWT và set HTTP-only cookie.
   - Tự động điều hướng người dùng sang `/onboarding` để hoàn thiện khảo sát thể trạng & mục tiêu tập luyện.

### Scenario 3: Đăng nhập bằng Gmail (Google OAuth 1-Click)

1. **Given**: Người dùng bấm nút **"Tiếp tục với Google"**.
2. **When**: Cửa sổ Popup Google OAuth mở ra $\rightarrow$ người dùng chọn tài khoản Google.
3. **Then**:
   - Backend trao đổi OAuth code lấy JWT.
   - Popup gửi `postMessage({ type: "OAUTH_COMPLETE", dest: "..." })` về trang chính.
   - Trang chính tự động đóng popup và điều hướng người dùng mà không cần reload toàn trang.

### Scenario 4: Đăng nhập bằng Mật khẩu (Password Fallback)

1. **Given**: Người dùng đã có tài khoản và mật khẩu trước đó.
2. **When**: Trên màn hình nhập `identifier`, người dùng bấm nút **"Đăng nhập với mật khẩu"**.
3. **Then**:
   - Form hiển thị thêm ô nhập Password kèm nút ẩn/hiện mật khẩu.
   - Khi submit: Gọi `loginAction({ identifier, password })`.
   - Có liên kết "Quên mật khẩu?" để kích hoạt luồng đặt lại mật khẩu qua OTP (`purpose: "reset_password"`).

---

## 5. Functional Requirements (FR)

| ID        | Yêu cầu nghiệp vụ & Giao diện                                                                                                                         | Backend RPC Seam                                  |
| :-------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| **FR-01** | Input thông minh tự động nhận diện Email (chứa `@`) hoặc Số điện thoại. Pre-validation inline tại client.                                             | Client-side validation                            |
| **FR-02** | Tab Switcher mượt mà giữa **Đăng nhập** và **Đăng ký**.                                                                                               | Client Component State                            |
| **FR-03** | Gửi yêu cầu mã OTP SMS/Email kèm `purpose: "login"` hoặc `"register"`. Nhận về `otp_token` và `expires_in_seconds`.                                   | `AuthService.SendOTP`                             |
| **FR-04** | Bộ nhập OTP 6 chữ số chuyên dụng: auto-focus, auto-advance, backspace navigation, paste clipboard, auto-submit khi đủ 6 ký tự.                        | Client Component                                  |
| **FR-05** | Tiện ích thông minh theo định danh: Nút "Mở Gmail / Outlook" cho Email, nút "Sửa số" và WebOTP API cho Số điện thoại.                                 | Client Utility                                    |
| **FR-06** | **Tích hợp `@multiavatar/multiavatar`**: Tự động sinh avatar vector SVG real-time khi gõ tên, nút xúc xắc Randomize kiểu dáng, thanh 4 avatar preset. | `@multiavatar/multiavatar`                        |
| **FR-07** | **Tải ảnh Avatar cá nhân**: Cho phép chọn file ảnh từ máy (preview ngay lập tức, kiểm tra dung lượng $\le 5\text{MB}$).                               | Client File Input                                 |
| **FR-08** | Form Đăng ký tài khoản đầy đủ: Họ tên, Mật khẩu, Giới tính, Ngày sinh, Avatar.                                                                        | `AuthService.Register`                            |
| **FR-09** | Bộ đếm ngược Resend OTP (mặc định 60 giây). Vô hiệu hóa nút gửi lại cho tới khi hết giờ.                                                              | Client State / Hook                               |
| **FR-10** | Xác thực OTP với `otp_token` đã lưu in-memory. Nhận session token và set HTTP-only cookie.                                                            | `AuthService.VerifyOTP`                           |
| **FR-11** | Cơ chế chống brute-force OTP: Quá 3 lần sai $\rightarrow$ khoá 15 phút kèm countdown đếm ngược.                                                       | Client Lockout state + Backend error code         |
| **FR-12** | Đăng nhập trực tiếp bằng Identifier + Password.                                                                                                       | `AuthService.Login`                               |
| **FR-13** | Tiếp tục duy trì và tối ưu nút đăng nhập Google OAuth 1-Click hiện có.                                                                                | `AuthService.GetOAuthLoginURL` & `LoginWithOAuth` |
| **FR-14** | Xử lý điều hướng thông minh sau đăng nhập: Kiểm tra `completionRate` của profile để đưa vào `/home` hay `/onboarding`.                                | `ProfileService.GetProfile`                       |

---

## 6. Stitch & UI Verification Plan

1. **Giai đoạn Thiết kế (Stitch Design Mapping)**:
   - Sử dụng các token có sẵn trong [DESIGN.md](file:///e:/LEARN/a/fitai-web/DESIGN.md):
     - Background: `var(--color-bg-base)` / `var(--color-bg-surface)`
     - Accent: Emerald `#10b981` (`var(--color-primary)`)
     - Input fields: `var(--color-border)`, focus ring `var(--color-primary)`
     - OTP inputs: 6 khối số riêng biệt có kích thước đồng nhất `48x56px`, bo góc `var(--radius-md)`.
2. **Giai đoạn Kiểm thử & Đánh giá (Stitch Review Loop)**:
   - Khởi động dev server: `pnpm dev`.
   - Chạy lệnh capture màn hình đăng nhập:
     ```bash
     stitch capture browser --url="http://localhost:3000/login" -o .stitch/captured-dom.html --json
     ```
   - Chạy lệnh review tự động với `DESIGN.md`:
     ```bash
     stitch review
     ```
   - Xác nhận không có vi phạm token màu sắc, typography hoặc layout contrast.

---

## 7. Open Questions & Technical Deliberations (Rule 14)

### Câu hỏi 1: Luồng người dùng mới (New User) với Số điện thoại

- **Lựa chọn A (Khuyến nghị)**: Đăng nhập và Đăng ký gộp làm một (Unified Auth). Người dùng nhập SĐT $\rightarrow$ nếu chưa có tài khoản, backend tự tạo tài khoản mới với trạng thái `INCOMPLETE` và gửi OTP. Sau khi verify, chuyển thẳng sang `/onboarding`.
- **Lựa chọn B**: Tách rời 2 tab "Đăng nhập" và "Đăng ký". Bắt người dùng mới phải chủ động chọn tab "Đăng ký".
- **Đánh giá**: Lựa chọn A mang lại trải nghiệm mượt mà hơn nhiều cho ứng dụng thể hình di động.

### Câu hỏi 2: Quản lý phiên OTP (`otpToken`)

- **Lựa chọn A (Khuyến nghị)**: Lưu `otpToken` trong Client State (React state trong component form OTP). Không lưu vào localStorage để tránh rò rỉ token.
- **Lựa chọn B**: Lưu `otpToken` vào một HTTP-only cookie tạm thời (`fitai_otp_session`) có TTL 5 phút.
- **Đánh giá**: Lựa chọn A đơn giản, an toàn và tự hủy khi người dùng tắt hoặc refresh trình duyệt.

---

## 8. Verification & Acceptance Criteria

1. **Unit Tests (Vitest)**:
   - Test validator định dạng SĐT (+84 và 0x...) và Email.
   - Test OTP input logic (paste chuỗi 6 số, backspace, xóa ký tự).
   - Test Server Actions mapping đúng response của ConnectRPC `AuthService`.
2. **Architecture & Skills Guards**:
   - `pnpm audit:skills`: 0 `useEffect` sai mục đích, 0 arbitrary hex colors, tuân thủ React 19.
   - `pnpm audit:comments`: 0 comment dài dòng/vi phạm quy chuẩn.
   - `pnpm lint` & `pnpm typecheck`: 0 cảnh báo.
3. **End-to-End Test (Playwright)**:
   - Kịch bản đăng nhập thành công với test credentials.
   - Kịch bản nhập sai OTP 3 lần và hiển thị khoá countdown.
