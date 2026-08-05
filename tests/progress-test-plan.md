# Progress Tracking Test Plan & Documentation

Tài liệu kịch bản kiểm thử cho module **Progress & Personal Growth Tracking** (Bento Grid & Roadmap Progress Banner).

## Mục Lục Test

- [1. Unit Tests](#1-unit-tests)
- [2. Component Tests](#2-component-tests)
- [3. UI States Coverage](#3-ui-states-coverage)
- [4. Commands](#4-commands)

---

## 1. Unit Tests

File: `tests/unit/progress-aggregator.test.ts`

| Function / Scenario | Kịch bản kiểm thử | Trạng thái |
| :--- | :--- | :--- |
| `calculateAdherencePercentage` | Tính toán chính xác phần trăm tuân thủ lộ trình (ví dụ 9/12 = 75%). Tránh chia cho 0. | Passed |
| `formatVolumeKg` | Định dạng hiển thị khối lượng tập luyện (ví dụ `850 kg`, `3.5t`). | Passed |
| `getTopPersonalRecords` | Lọc và sắp xếp top kỷ lục cá nhân (PRs) theo ngày đạt được mới nhất. | Passed |

---

## 2. Component Tests

File: `tests/component/progress-bento-grid.test.tsx`

| Component | Kịch bản kiểm thử | Trạng thái |
| :--- | :--- | :--- |
| `ProgressBentoGrid` (Loading) | Hiển thị Skeleton UI khi `isLoading=true`. | Passed |
| `ProgressBentoGrid` (Error) | Hiển thị thông báo lỗi và nút "Thử lại" khi `isError=true`. | Passed |
| `ProgressBentoGrid` (Empty) | Hiển thị Empty state khuyến khích người dùng hoàn thành bài tập đầu tiên khi chưa có dữ liệu (`totalWorkoutsCompleted=0`). | Passed |
| `ProgressBentoGrid` (Success) | Hiển thị đầy đủ Bento cards: **Consistency Streak**, **Weekly Activity Heatmap**, và **Personal Records**. | Passed |

---

## 3. UI States Coverage

Theo tiêu chuẩn `DESIGN.md` và `PRODUCT.md` của FITAI Web:
- **Loading State**: Trình diễn bằng Skeleton Bento Grid (Mist surface, không shimmer chói mắt).
- **Error State**: Trình diễn bằng thẻ Coral Tint kèm nút "Thử lại".
- **Empty State**: Thẻ khuyến khích tích cực ("Start your progress journey"), không gây áp lực xấu (no shame-based pressure).
- **Typography & Numbers**: Tất cả các chỉ số (streak, volume, PRs, adherence %) sử dụng phông chữ Mono `tabular-nums`.

---

## 4. Commands

Lệnh chạy kiểm thử:
```powershell
pnpm.cmd test tests/unit/progress-aggregator.test.ts tests/component/progress-bento-grid.test.tsx
```
