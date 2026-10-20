# Test Scenarios: ReactionBar UI & Reaction Count Handling

## Mục lục
1. [Tổng quan](#1-tổng-quan)
2. [Chi tiết kịch bản kiểm thử](#2-chi-tiết-kịch-bản-kiểm-thử)
   - [Kịch bản 1: Tăng số lượt like lạc quan và duy trì khi backend không trả counter](#kịch-bản-1-tăng-số-lượt-like-lạc-quan-và-duy-trì-khi-backend-không-trả-counter)
   - [Kịch bản 2: Giảm số lượt like khi bỏ thích và giữ đúng số lượng](#kịch-bản-2-giảm-số-lượt-like-khi-bỏ-thích-và-giữ-đúng-số-lượng)
   - [Kịch bản 3: Thả tim bài viết chưa có like hiển thị số 1 không biến mất](#kịch-bản-3-thả-tim-bài-viết-chưa-có-like-hiển-thị-số-1-không-biến-mất)
   - [Kịch bản 4: Ẩn số like khi bài viết về 0 sau khi bỏ thích](#kịch-bản-4-ẩn-số-like-khi-bài-viết-về-0-sau-khi-bỏ-thích)
   - [Kịch bản 5: Rollback trạng thái và số lượng khi server action thất bại](#kịch-bản-5-rollback-trạng-thái-và-số-lượng-khi-server-action-thất-bại)
   - [Kịch bản 6: Tương tác Repost độc lập không dính stale closure](#kịch-bản-6-tương-tác-repost-độc-lập-không-dính-stale-closure)

---

## 1. Tổng quan
Kiểm thử hành vi hiển thị và đồng bộ trạng thái số lượt reaction/like trên thanh công cụ tương tác (`ReactionBar`):
- Tránh lỗi UI số like bị biến mất ngay sau khi thả tim do backend ConnectRPC gRPC trả `reaction_count = 0` (mặc định protobuf).
- Đảm bảo cơ chế cập nhật lạc quan (optimistic update) tăng/giảm chính xác và rollback tin cậy khi có lỗi mạng/xác thực.
- Đảm bảo hiển thị đúng chuẩn Threads/Instagram: bài viết 0 like không hiển thị số, có like hiển thị số tương ứng bên cạnh icon tim đỏ.

---

## 2. Chi tiết kịch bản kiểm thử

### Kịch bản 1: Tăng số lượt like lạc quan và duy trì khi backend không trả counter
- **Mục tiêu**: Khi người dùng nhấn thích bài viết có sẵn 41 lượt thích:
  - Số hiển thị lập tức tăng thành 42, icon tim chuyển sang màu đỏ.
  - Khi server trả về `success: true` và `reactionCount: 0` (do backend chưa map counter), UI vẫn giữ nguyên số 42, không bị reset về 0 làm biến mất số cạnh tim.

### Kịch bản 2: Giảm số lượt like khi bỏ thích và giữ đúng số lượng
- **Mục tiêu**: Khi người dùng bỏ thích bài viết đang có 42 lượt thích:
  - Số hiển thị lập tức giảm về 41, icon tim chuyển về viền xám neutral.
  - Khi server xác nhận thành công, số 41 vẫn được giữ nguyên.

### Kịch bản 3: Thả tim bài viết chưa có like hiển thị số 1 không biến mất
- **Mục tiêu**: Bài viết ban đầu có 0 lượt thích (không hiện số):
  - Nhấn thả tim -> hiển thị icon tim đỏ và số "1".
  - Sau khi server phản hồi, số "1" vẫn hiển thị ổn định bên cạnh icon.

### Kịch bản 4: Ẩn số like khi bài viết về 0 sau khi bỏ thích
- **Mục tiêu**: Bài viết ban đầu có 1 lượt thích duy nhất từ chính user:
  - Nhấn bỏ thích -> số 1 biến mất, chỉ còn icon tim viền neutral (không hiển thị số 0).

### Kịch bản 5: Rollback trạng thái và số lượng khi server action thất bại
- **Mục tiêu**: Nếu yêu cầu mạng thất bại hoặc token hết hạn (`success: false`):
  - Khôi phục chính xác trạng thái ban đầu (`prevCurrent` và `prevCount`).

### Kịch bản 6: Tương tác Repost độc lập không dính stale closure
- **Mục tiêu**: Nhấn Repost cập nhật trạng thái màu xanh lá và số 1, nhấn lại giảm về 0 an toàn.
