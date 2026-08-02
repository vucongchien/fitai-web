# Mục lục kiểm thử frontend FITAI

## Phạm vi

| Nhóm        | File                                   | Kịch bản chính                                                  |
| ----------- | -------------------------------------- | --------------------------------------------------------------- |
| Component   | `dashboard.test.tsx`                   | Render workout contract, CTA, lịch tuần và Empty state          |
| E2E desktop | `e2e/dashboard.spec.ts`                | Mở dashboard, đi vào chi tiết workout và xác nhận nội dung đích |
| E2E mobile  | `e2e/dashboard.spec.ts`                | CTA chính và bottom navigation hiển thị ở viewport 390×844      |
| Domain      | `shared/domain-progress.test.ts`       | Tính tiến độ tuần và xử lý danh sách rỗng                       |
| Application | `shared/application-dashboard.test.ts` | Query key ổn định và service port độc lập nền tảng              |
| Validation  | `shared/validation-login.test.ts`      | Input hợp lệ và lỗi validation trước RPC                        |
| API         | `shared/api-transport.test.ts`         | Base URL và token provider độc lập Next.js/browser              |

## Các trạng thái UI bắt buộc

- Loading: `src/app/loading.tsx` dùng skeleton có `aria-busy`.
- Error: `src/app/error.tsx` có retry action và thông điệp dễ hiểu.
- Empty: `DashboardEmptyState` dẫn người dùng tới onboarding.

## Lệnh chạy

```bash
pnpm test
pnpm test:e2e
```
