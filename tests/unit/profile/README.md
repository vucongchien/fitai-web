# Tài liệu Kiểm thử Module Profile (Profile Test Suite Documentation)

## 1. Tổng quan
Thư mục test `tests/unit/profile` chứa toàn bộ các kịch bản kiểm thử đơn vị (Unit Tests) và kiểm thử thành phần (Component Integration Tests) cho module **Profile (Hồ sơ cá nhân)** của ứng dụng FITAI.

---

## 2. Mục lục Danh sách File Test

### 2.1. [`profile-mapper.test.ts`](file:///E:/LEARN/a/forange/tests/unit/profile/profile-mapper.test.ts)
Kiểm tra tính chính xác của các hàm biến đổi dữ liệu (Data Mapper Functions) từ Protobuf gRPC sang UI ViewModel.

* **Kịch bản 1: `calculateBMI`**
  * *Test case 1.1*: Khả năng tính BMI chính xác cho chiều cao (175cm) và cân nặng (68.5kg) -> Trả về `22.4` và xếp loại `Cân đối / Lý tưởng`.
  * *Test case 1.2*: Xử lý an toàn khi đầu vào thiếu chiều cao hoặc cân nặng bằng 0 -> Trả về `0` và `Chưa có thông tin`.
* **Kịch bản 2: `calculateOneRepMax`**
  * *Test case 2.1*: Tính mốc 1RM ước tính theo công thức Epley (`weight * (1 + reps/30)`).
  * *Test case 2.2*: Giữ nguyên cân nặng nếu reps = 1.
* **Kịch bản 3: `Translations`**
  * Dịch các enum Protobuf tiếng Anh (`BEGINNER`, `INTERMEDIATE`, `HYPERTROPHY`, `CHEST`, `FULL_GYM`) sang hiển thị tiếng Việt thân thiện với học viên.
* **Kịch bản 4: `mapRawDataToProfileViewModel`**
  * *Test case 4.1*: Chuyển đổi dữ liệu rỗng sang ViewModel mặc định an toàn mà không bị crash hay `undefined`.
  * *Test case 4.2*: Chuyển đổi dữ liệu Protobuf thực tế với đầy đủ thông tin cá nhân, kỷ lục PR tốt nhất và các chỉ số tập luyện.

---

### 2.2. [`profile-components.test.tsx`](file:///E:/LEARN/a/forange/tests/unit/profile/profile-components.test.tsx)
Kiểm tra khả năng render giao diện UI và các hành vi tương tác của người dùng trên trang Profile.

* **Kịch bản 1: Render thông tin cơ bản trên Hero Card & Stats**
  * Tên người dùng (`Emma Nguyen`), Level Badge (`Level 10`), Best PR (`Barbell Deadlift 140kg`).
  * 3 Stats nhỏ: Số buổi tập (`48`), Chuỗi ngày tập (`12 ngày`), Calo tiêu thụ (`12.5k`).
* **Kịch bản 2: Render 3 Thẻ Highlight Thể trạng**
  * Hiển thị Cân nặng hiện tại (`68.5 kg`), Tỉ lệ mỡ (`18.5%`), Cân nặng mục tiêu (`65.0 kg`).
* **Kịch bản 3: Tương tác mở Modal chi tiết**
  * Giả lập hành vi click của người dùng vào dòng menu *"Mục tiêu & Thể trạng chi tiết"*.
  * Xác minh Modal hiển thị chính xác các trường dữ liệu chi tiết (Chiều cao `175 cm`, BMI, mục tiêu).

---

## 3. Lệnh Chạy Kiểm Thử (Running Tests)

```bash
# Chạy toàn bộ test cho module Profile
pnpm test tests/unit/profile

# Chạy riêng test mapper
pnpm test tests/unit/profile/profile-mapper.test.ts

# Chạy riêng test UI components
pnpm test tests/unit/profile/profile-components.test.tsx
```
