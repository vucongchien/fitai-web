# Hướng dẫn Kiểm thử & Danh mục Test Suite (Test Catalog)

Tài liệu này chứa mục lục và mô tả chi tiết các kịch bản kiểm thử trong dự án FITAI Frontend, giúp nhà phát triển dễ dàng tìm kiếm và chạy test.

---

## 1. Danh mục Test Suite (Test Index)

Hệ thống kiểm thử sử dụng **Vitest** làm test runner chính kết hợp với **React Testing Library (RTL)** cho việc kiểm thử UI component.

### 1.1. Unit Tests (Kiểm thử đơn vị logic / Mappers / Actions)
*   [`tests/unit/profile/profile-mapper.test.ts`](file:///e:/LEARN/a/forange/tests/unit/profile/profile-mapper.test.ts): Kiểm tra ánh xạ dữ liệu từ gRPC ProfileProto sang UI ProfileViewModel, xử lý các trường hợp dữ liệu rỗng và fallbacks.
*   [`tests/unit/profile/profile-actions.test.ts`](file:///e:/LEARN/a/forange/tests/unit/profile/profile-actions.test.ts): Kiểm tra server actions cập nhật thông tin cá nhân và chuẩn hóa enum.
*   [`tests/unit/exercise-grpc-repository.test.ts`](file:///e:/LEARN/a/forange/tests/unit/exercise-grpc-repository.test.ts): Mock ConnectRPC client của `ExerciseService` để kiểm tra việc truy vấn danh mục bài tập và tìm kiếm.
*   [`tests/unit/onboarding-grpc-actions.test.ts`](file:///e:/LEARN/a/forange/tests/unit/onboarding-grpc-actions.test.ts): Kiểm tra server actions lưu thông tin onboarding, chuẩn hóa enum thiết bị, mục tiêu và cơ chế xử lý khi sập kết nối gRPC.
*   [`tests/unit/onboarding-schema.test.ts`](file:///e:/LEARN/a/forange/tests/unit/onboarding-schema.test.ts): Kiểm tra Zod schema validation đầu vào cho form onboarding (chặn thiết bị không chuẩn).
*   [`tests/unit/progress-aggregator.test.ts`](file:///e:/LEARN/a/forange/tests/unit/progress-aggregator.test.ts): Kiểm tra logic tính toán tiến trình tập luyện (volume, streak, PRs) sử dụng dữ liệu cục bộ.
*   [`tests/unit/meal-detail-mapper.test.ts`](file:///e:/LEARN/a/forange/tests/unit/meal-detail-mapper.test.ts): Kiểm tra mappers trang chi tiết bữa ăn và tính toán calo từ dữ liệu test fixtures.

### 1.2. Component/UI Tests (Kiểm thử giao diện)
*   [`tests/component/meal-timeline.test.tsx`](file:///e:/LEARN/a/forange/tests/component/meal-timeline.test.tsx): Kiểm tra việc render timeline dinh dưỡng với 4 buổi ăn (Breakfast, Lunch, Dinner, Snack) từ dữ liệu test fixtures.
*   [`tests/unit/profile/profile-components.test.tsx`](file:///e:/LEARN/a/forange/tests/unit/profile/profile-components.test.tsx): Kiểm tra render các thẻ hiển thị chỉ số cơ thể và form chỉnh sửa thông tin cá nhân.
*   [`tests/component/meal-detail-view.test.tsx`](file:///e:/LEARN/a/forange/tests/component/meal-detail-view.test.tsx): Kiểm tra giao diện hiển thị chi tiết bữa ăn và log món ăn tùy chỉnh.

---

## 2. Kịch bản & Cách thức Kiểm thử ConnectRPC (gRPC Mocking)

Do ConnectRPC sử dụng transport HTTP/2, các unit test được cấu hình mock client Connect để kiểm tra các hành vi offline/online mà không cần chạy gRPC server backend.

### Cú pháp Mock ConnectRPC Client mẫu:
```typescript
import { create } from "@bufbuild/protobuf";
import { vi } from "vitest";
import { SaveHealthProfileResponseSchema } from "@/shared/api/gen/contracts/supporting/profile/v1/message/profile_messages_pb";

// 1. Tạo vi.fn mock cho phương thức gRPC
const mockSaveHealthProfile = vi.fn();

// 2. Mock module @connectrpc/connect
vi.mock("@connectrpc/connect", () => ({
  createClient: () => ({
    saveHealthProfile: mockSaveHealthProfile,
  }),
}));

// 3. Sử dụng trong test case
it("handles success flow", async () => {
  mockSaveHealthProfile.mockResolvedValue(
    create(SaveHealthProfileResponseSchema, {
      userId: "usr-123",
      aiCoachActivated: true,
    })
  );
  
  const result = await yourAction();
  expect(result.success).toBe(true);
});
```

---

## 3. Lệnh Chạy Kiểm Thử

### Chạy toàn bộ Test Suite:
```bash
pnpm test
```

### Chạy riêng một file test cụ thể:
```bash
pnpm vitest run tests/unit/profile/profile-mapper.test.ts
```

### Chạy kiểm tra TypeScript typecheck:
```bash
pnpm typecheck
```
