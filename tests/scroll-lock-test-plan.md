# Kịch bản Kiểm thử Scroll Lock (`tests/scroll-lock-test-plan.md`)

Tài liệu này tổng hợp mục lục và chi tiết các kịch bản kiểm thử (Unit Tests) cho module `useScrollLock` và cơ chế chống Scroll Bleed / Background Scroll.

---

## 📋 Mục lục Test Suites

1. [useScrollLock Unit Tests (`tests/unit/use-scroll-lock.test.ts`)](#1-usescrolllock-unit-tests)

---

## 1. useScrollLock Unit Tests

- **File**: `tests/unit/use-scroll-lock.test.ts`
- **Mục tiêu**: Kiểm tra tính năng khóa cuộn `body` khi mở modal, tự động hoàn trả style khi đóng modal, quản lý khóa theo số lượng tham chiếu (Reference Counting) cho trường hợp modal lồng nhau (stacked modals), và an toàn với môi trường SSR.

### Kịch bản chi tiết:

1. **Khởi tạo và trạng thái cơ bản**:
   - [x] Không can thiệp vào `document.body.style.overflow` khi `enabled = false`.
   - [x] Gán `document.body.style.overflow = "hidden"` khi `enabled = true`.
   - [x] Khôi phục chính xác style ban đầu của `body` khi unmount hoặc khi `enabled` chuyển từ `true` sang `false`.

2. **Xử lý modal lồng nhau (Stacked Modals / Reference Counting)**:
   - [x] Khi mở liên tiếp 2 modal (`Modal 1` mở trước, sau đó `Modal 2` mở đè lên), `body` vẫn bị khóa `overflow = "hidden"`.
   - [x] Khi đóng `Modal 2` (modal con), `body` vẫn tiếp tục bị khóa vì `Modal 1` vẫn đang mở.
   - [x] Khi đóng tiếp `Modal 1`, `body` mới hoàn trả lại style ban đầu.

3. **An toàn vòng đời (Lifecycle & Idempotency)**:
   - [x] Xử lý an toàn khi gọi `releaseScrollLock` vượt quá số lần mở (không âm `lockCount`).
   - [x] Không gây lỗi khi chạy trong môi trường không có DOM (SSR / Node.js).
