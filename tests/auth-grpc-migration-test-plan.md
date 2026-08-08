# Kế hoạch Kiểm thử Xác thực gRPC & Phiên làm việc (Auth & Session Test Plan)

Tài liệu này mô tả chi tiết mục lục, kịch bản kiểm thử (Test Scenarios), ma trận ca kiểm thử (Test Cases) và phương pháp xác minh cho hệ thống Xác thực & Đăng nhập (Identity & Authentication) chuyển đổi từ mock sang gRPC backend thật (`contracts.generic.auth.v1.service.AuthService`).

---

## 1. Mục tiêu Kiểm thử (Test Objectives)

1. **Bảo mật & Toàn vẹn Phiên (Session Integrity)**:
   - Toàn bộ Access Token & Refresh Token phải được bảo vệ trong HTTP-Only, Secure, SameSite=Lax Cookies.
   - CSRF State phải được kiểm tra nghiêm ngặt trong luồng OAuth (Google / Facebook).
2. **Khả năng Phục hồi & Tự động Làm mới Token (Resilience & Auto-Refresh)**:
   - Khi Access Token hết hạn (401 Unauthenticated), BFF proxy tự động dùng Refresh Token gọi `AuthService.RefreshToken` để lấy token mới và retry request ban đầu.
   - Cơ chế Single-flight / Mutex đảm bảo khi 10 RPC gọi đồng thời bị 401 thì chỉ phát đi **duy nhất 1 lệnh Refresh Token**.
3. **Đăng xuất & Thu hồi Phiên (Logout & Session Revocation)**:
   - Endpoint `/api/auth/logout` thu hồi Refresh Token trên gRPC backend (`AuthService.Logout`) và dọn dẹp sạch toàn bộ cookie.
4. **Cô lập Môi trường (Environment Isolation)**:
   - Tuyệt đối chặn các route dev-login trên môi trường Production (`NODE_ENV === 'production'`).

---

## 2. Mục lục Ca Kiểm thử (Test Scenarios Index)

### 2.1. Khởi tạo OAuth (`/api/auth/oauth/[provider]`)
- **TC-AUTH-01**: Yêu cầu với provider không hợp lệ (`twitter`, `github`) $\rightarrow$ Redirect về `/login?error=invalid_provider`.
- **TC-AUTH-02**: Gọi gRPC `AuthService.GetOAuthLoginURL` thành công $\rightarrow$ 307 Redirect tới URL đăng nhập Google/Facebook + Set cookie `fitai_oauth_state`.
- **TC-AUTH-03**: Nhận cờ `popup=1` $\rightarrow$ Set cookie `fitai_oauth_popup=1` và 307 Redirect.
- **TC-AUTH-04**: Khi gRPC server gặp lỗi/timeout $\rightarrow$ Trả về popup error / redirect `/login?error=callback_failed`.

### 2.2. Xử lý Callback OAuth (`/auth/callback/[provider]`)
- **TC-AUTH-05**: Thiếu query `code` hoặc `state` $\rightarrow$ Redirect `/login?error=missing_code`.
- **TC-AUTH-06**: `state` không khớp với cookie `fitai_oauth_state` $\rightarrow$ Redirect `/login?error=invalid_state`.
- **TC-AUTH-07**: Trao đổi `code` qua gRPC `AuthService.LoginWithOAuth` $\rightarrow$ Nhận `accessToken`, `refreshToken`, `userId`.
- **TC-AUTH-08**: Lưu đầy đủ 3 cookies (`fitai_access_token`, `fitai_refresh_token`, `fitai_user_id`) và xóa cookie tạm `fitai_oauth_state`.
- **TC-AUTH-09**: Điều hướng dựa trên `ProfileService.GetProfile`:
  - Completion Rate $< 80\%$ $\rightarrow$ Điều hướng tới `/onboarding`.
  - Completion Rate $\ge 80\%$ và chưa có roadmap $\rightarrow$ Điều hướng tới `/planning`.
  - Completion Rate $\ge 80\%$ và đã có roadmap $\rightarrow$ Điều hướng tới `/home`.
- **TC-AUTH-10**: Xử lý phản hồi dạng Popup HTML `postMessage({ type: "OAUTH_COMPLETE", dest })`.

### 2.3. Đăng xuất & Thu hồi Phiên (`/api/auth/logout`)
- **TC-AUTH-11**: Gọi `POST /api/auth/logout` có cookie `fitai_refresh_token` $\rightarrow$ Gọi gRPC `AuthService.Logout({ refreshToken })`.
- **TC-AUTH-12**: Xóa sạch toàn bộ cookie xác thực (`fitai_access_token`, `fitai_refresh_token`, `fitai_user_id`, `fitai_oauth_state`, `fitai_oauth_popup`).
- **TC-AUTH-13**: Hỗ trợ cả API JSON response `{ success: true }` lẫn Browser Navigation 302 Redirect về `/login`.
- **TC-AUTH-14**: Xử lý gracefully khi gRPC backend lỗi hoặc không có refresh token (vẫn xóa sạch cookies an toàn).

### 2.4. BFF Proxy & Single-flight Auto Refresh (`/rpc/[...path]`)
- **TC-AUTH-15**: Gắn Header `Authorization: Bearer <accessToken>` từ HTTP-Only Cookie khi chuyển tiếp tới gRPC backend.
- **TC-AUTH-16**: Nhận lỗi 401 $\rightarrow$ Gọi gRPC `AuthService.RefreshToken({ refreshToken })` $\rightarrow$ Cập nhật Cookies và retry request thành công.
- **TC-AUTH-17**: **Single-flight Concurrency**: 5 request song song bị 401 $\rightarrow$ Chỉ có 1 cuộc gọi `AuthService.RefreshToken`, 5 request đều nhận token mới và hoàn thành.
- **TC-AUTH-18**: Khi Refresh Token cũng hết hạn / không hợp lệ $\rightarrow$ Trả về mã lỗi phù hợp, xóa cookie hỏng.

---

## 3. Danh sách File Kiểm thử Liên quan

| File Kiểm thử | Phạm vi |
| :--- | :--- |
| `tests/unit/oauth-bff-routes.test.ts` | Khởi tạo OAuth và Xử lý Callback gRPC |
| `tests/unit/auth-logout-route.test.ts` | Endpoint Đăng xuất và Xóa cookie |
| `tests/unit/rpc-single-flight-refresh.test.ts` | Cơ chế Auto Refresh và Single-flight Concurrency |
| `tests/unit/dev-login-route.test.ts` | Cô lập Dev Route trong môi trường Development |
| `tests/component/login-actions.test.tsx` | Trạng thái UI và Tương tác Popup Đăng nhập |
