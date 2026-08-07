# Kịch Bản Kiểm Thử Component Log Meal & Meal Detail View

## Nội Dung Tệp
Tài liệu này chi tiết các kịch bản kiểm thử (unit & component test) cho các tính năng thuộc module Nutrition: `LogMealForm` và `MealDetailView`.

---

## Danh Sách Kịch Bản Kiểm Thử

### 1. `tests/component/log-meal-form.test.tsx`
| Mã kịch bản | Mô tả | Trạng thái kỳ vọng |
| ----------- | ----- | ------------------ |
| `LMF-01` | Mặc định hiển thị nút kích hoạt dạng gập ("Log something not on the menu") | Component ở trạng thái collapsed, không lộ các ô input |
| `LMF-02` | Mở form nhập bữa ăn khi bấm nút kích hoạt | Mở các ô input "What did you eat?" và "Calories (kcal)" |
| `LMF-03` | Mở rộng các ô chỉ số Macro (Protein, Carbs, Fat) | Thêm 3 ô nhập liệu Protein, Carbs, Fat khi người dùng yêu cầu |
| `LMF-04` | Đóng form khi người dùng bấm "Cancel" | Thu gọn form trở lại trạng thái nút kích hoạt ban đầu |
| `LMF-05` | Tùy chỉnh thông báo lỗi khi submit tên món ăn rỗng | Hiển thị thông báo lỗi tùy chỉnh (Toast & Alert text) thay vì popup mặc định của trình duyệt |

### 2. `tests/component/meal-detail-view.test.tsx`
| Mã kịch bản | Mô tả | Trạng thái kỳ vọng |
| ----------- | ----- | ------------------ |
| `MDV-01` | Hiển thị thông tin danh sách món ăn đã log ("Logged today") | Render đúng tên món, lượng calo, thời gian log và các bước công thức |
| `MDV-02` | Hiển thị các lựa chọn món gợi ý và section "Log something else" | Các block section hiển thị tiêu đề và danh sách bài bản, không vỡ layout |

---

## Hướng Dẫn Chạy Kiểm Thử

```powershell
pnpm.cmd test tests/component/log-meal-form.test.tsx
pnpm.cmd test tests/component/meal-detail-view.test.tsx
```
