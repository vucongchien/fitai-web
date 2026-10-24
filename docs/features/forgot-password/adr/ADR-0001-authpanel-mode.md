# ADR-0001: Forgot Password as AuthPanel Mode

## Status: Accepted

## Context

Feature forgot password cần một UI flow 3 bước. Có 2 lựa chọn:

1. Tạo route `/forgot-password` riêng
2. Thêm mode `"forgot-password"` vào `AuthPanel` state machine hiện tại

## Decision

**Thêm mode `"forgot-password"` vào `AuthPanel`.**

## Rationale

- `AuthPanel` đã là state machine toggle giữa `"login"` và `"register"`. Thêm 1 mode nữa là extension tự nhiên.
- Không cần thêm route, không cần update proxy whitelist, không cần thêm page component.
- Transition giữa login ↔ forgot-password mượt mà, cùng layout.
- Pattern này đã proven với login/register toggle.

## Consequences

- `AuthMode` type mở rộng: `"login" | "register" | "forgot-password"`.
- `ForgotPasswordForm` nhận callback `onBackToLogin` và `onResetSuccess(identifier)`.
- Pre-fill identifier vào login form sau reset thành công.
