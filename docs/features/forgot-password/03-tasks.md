# Forgot Password — Tasks

> References: [01-spec.md](./01-spec.md) · [02-design.md](./02-design.md) · [ADR-0001](./adr/ADR-0001-authpanel-mode.md)

## Phase 1: Server Actions

- [x] **T-01** [FR-03]: Extend `sendOtpAction` purpose type to include `"reset_password"` → `src/features/auth/server/auth-actions.ts`
- [x] **T-02** [FR-06]: Create `resetPasswordAction(resetToken, newPassword, confirmPassword)` → `src/features/auth/server/auth-actions.ts`
  - Validate `newPassword.length >= 8`, `newPassword === confirmPassword` server-side
  - Call `AuthService.ResetPassword` via `createServerTransport()` (no auth token)
  - Return `AuthActionResult<{ success: boolean; message: string }>`

## Phase 2: State Machine Hook

- [x] **T-03** [FR-01, FR-09]: Create `useForgotPasswordFlow` hook → `src/features/auth/model/use-forgot-password-flow.ts`
  - 4-step state: `IDENTIFIER → VERIFY_OTP → NEW_PASSWORD → SUCCESS`
  - Anti-enumeration: `handleSendOtp` always transitions to VERIFY_OTP (swallow "not found" errors)
  - Zero `useEffect` — all transitions in event handlers
  - Expose `identifier` for pre-fill on success

## Phase 3: UI Components

- [x] **T-04** [FR-01, FR-02, FR-04, FR-07, FR-08, FR-09, FR-10]: Create `ForgotPasswordForm` → `src/features/auth/ui/forgot-password-form.tsx`
  - Step IDENTIFIER: input + validate + "Send verification code" button
  - Step VERIFY_OTP: reuse `OtpInputGroup`, masked identifier badge, email shortcut
  - Step NEW_PASSWORD: 2 password fields with Eye/EyeOff toggles, validation
  - Step SUCCESS: checkmark + message + auto-redirect countdown
  - Reuse `.auth-*` CSS classes throughout
- [x] **T-05** [FR-01]: Update `AuthPanel` → `src/features/auth/ui/auth-panel.tsx`
  - Extend `AuthMode` to `"login" | "register" | "forgot-password"`
  - Render `ForgotPasswordForm` when mode === `"forgot-password"`
  - Pass `onResetSuccess(identifier)` to pre-fill login
- [x] **T-06** [FR-01]: Update `LoginForm` → `src/features/auth/ui/login-form.tsx`
  - Replace `alert()` stub with `onForgotPassword` callback
  - Accept optional `defaultIdentifier` prop for pre-fill after reset

## Phase 4: Styling

- [x] **T-07**: Add success state CSS → `src/app/globals.css`
  - `.auth-success-screen` container
  - `.auth-success-icon` checkmark circle
  - `.auth-success-countdown` text

## Verification

- [x] **V-01** [AC-01]: Click "Forgot password?" navigates to forgot-password flow
- [x] **V-02** [AC-02]: Send OTP with valid email/phone succeeds
- [x] **V-03** [AC-03]: Send OTP with non-existent identifier shows same success (anti-enumeration)
- [x] **V-04** [AC-04]: OTP auto-submit works, invalid OTP shows error
- [x] **V-05** [AC-05]: Resend OTP works after countdown
- [x] **V-06** [AC-06]: Reset password succeeds and redirects to login
- [x] **V-07** [AC-07]: Password validation (min 8, mismatch) blocks submit
- [x] **V-08** [AC-08]: Expired resetToken shows error + "Start over"
- [x] **V-09** [AC-09]: "Back to login" works from every step
- [x] **V-10** [AC-10]: No `useEffect` for derived state or events
- [x] **V-11**: Pre-fill identifier in login after successful reset
- [x] **V-12**: `pnpm typecheck` passes
