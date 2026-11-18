# Partner Portal & Subdomain Routing Test Plan

## Mục lục

1. [Subdomain Detection & Rewrite (`tests/unit/subdomain-routing.test.ts`)](#1-subdomain-detection--rewrite)
2. [Brand Partner Registration (`tests/unit/partner-brand-service.test.ts`)](#2-brand-partner-registration)
3. [Manual E2E Verification](#3-manual-e2e-verification)

---

## 1. Subdomain Detection & Rewrite

- **Case 1.1:** Nhận diện đúng `admin.chien.id.vn` và `admin.localhost:3000` thành `"admin"`.
- **Case 1.2:** Nhận diện đúng `partner.chien.id.vn` và `partner.localhost:3000` thành `"partner"`.
- **Case 1.3:** Domain chính (`chien.id.vn`, `www.chien.id.vn`, `localhost:3000`) trả về `"main"`.
- **Case 1.4:** Rewrite `/` trên `admin.*` $\rightarrow$ `/admin`, `/brands` $\rightarrow$ `/admin/brands`, không nhân đôi `/admin/admin/*`.
- **Case 1.5:** Rewrite `/` trên `partner.*` $\rightarrow$ `/partner`, `/dashboard` $\rightarrow$ `/partner/dashboard`, không nhân đôi `/partner/partner/*`.
- **Case 1.6:** Không rewrite các route dùng chung (`/login`, `/api/*`, `/rpc/*`, `/_next/*`, static assets).

## 2. Brand Partner Registration

- **Case 2.1:** Validate Zod từ chối dữ liệu thiếu/quá ngắn trước khi gọi RPC.
- **Case 2.2:** Chặn và trả lỗi rõ ràng khi chưa có `accessToken`.
- **Case 2.3:** Gọi `AuthService.registerBrand` đúng schema `RegisterBrandRequest` và trả `{ ok: true, message }`.
- **Case 2.4:** Trả `{ ok: false, error }` khi backend trả `success: false` hoặc throw `ConnectError`.

## 3. Manual E2E Verification

- Truy cập `http://partner.localhost:3000` khi chưa đăng nhập $\rightarrow$ hiển thị Landing Page Partner + nút đăng nhập.
- Đăng nhập tài khoản `user` $\rightarrow$ gửi form đăng ký Brand Partner $\rightarrow$ xác nhận hiển thị ở `http://admin.localhost:3000/brands`.
- Admin bấm **Approve** $\rightarrow$ tài khoản có role `brand` truy cập được `http://partner.localhost:3000/dashboard`.
