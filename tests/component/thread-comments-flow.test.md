# Test Scenarios: Threads Comment Flow & Detail View

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Chi tiết kịch bản kiểm thử](#2-chi-tiết-kịch-bản-kiểm-thử)
   - [Kịch bản 1: Điều hướng từ FeedCard sang Post Detail](#kịch-bản-1-điều-hướng-từ-feedcard-sang-post-detail)
   - [Kịch bản 2: Hiển thị giao diện Thread và phân cấp bình luận](#kịch-bản-2-hiển-thị-giao-diện-thread-và-phân-cấp-bình-luận)
   - [Kịch bản 3: Luồng trả lời Facebook-style (Prefill @Name)](#kịch-bản-3-luồng-trả-lời-facebook-style-prefill-name)
   - [Kịch bản 4: Gửi bình luận lồng nhau kèm parentId](#kịch-bản-4-gửi-bình-luận-lồng-nhau-kèm-parentid)
   - [Kịch bản 5: Responsive Input (Desktop Inline & Mobile Sticky)](#kịch-bản-5-responsive-input-desktop-inline--mobile-sticky)

---

## 1. Tổng quan

Kiểm chứng luồng bình luận mới theo chuẩn Threads:

- Thay thế modal bottom-sheet cũ (`CommentSheet`) bằng trang chi tiết bài viết `/community/posts/[postId]`.
- Hiển thị bài viết gốc, các bình luận cấp 1 và bình luận lồng cấp 2 kết nối bằng đường line dọc (connector line) Threads.
- Hỗ trợ điền sẵn tên `@Tên` khi nhấn vào nút trả lời của một bình luận (tương tự Facebook).
- Hỗ trợ giao diện kép: Inline trên desktop và Sticky Bottom cố định dưới đáy màn hình trên mobile.

---

## 2. Chi tiết kịch bản kiểm thử

### Kịch bản 1: Điều hướng từ FeedCard sang Post Detail

- **Mục tiêu**: Đảm bảo khi nhấn vào nút comment trên bài viết ngoài bảng tin, ứng dụng lưu tạm bài viết vào client cache và điều hướng tới route `/community/posts/[postId]`.
- **Hành vi kiểm chứng**:
  - `onCommentClick` gọi `router.push('/community/posts/' + item.id)`.
  - Cache bài viết để trang chi tiết hiển thị tức thì không bị giật lag.

### Kịch bản 2: Hiển thị giao diện Thread và phân cấp bình luận

- **Mục tiêu**: Khớp giao diện thiết kế Threads:
  - Header: nút Back (`←`), tiêu đề `Thread`, số lượt xem (`views`), nút tùy chọn (`···`).
  - Bài viết: Avatar với badge `+`, tên người đăng, verified badge, caption, action bar.
  - Bình luận: Danh sách phân cấp cha-con, hiển thị huy hiệu `· Author` cho tác giả bài viết.

### Kịch bản 3: Luồng trả lời Facebook-style (Prefill @Name)

- **Mục tiêu**: Khi người dùng nhấn nút trả lời trên bình luận của bất kỳ ai:
  - Tự động điền tiền tố `@TênNgườiĐó ` vào ô nhập.
  - Hiển thị banner ngữ cảnh "Replying to @TênNgườiĐó" kèm nút hủy `✕`.
  - Focus vào ô nhập liệu mà không cần sử dụng `useEffect`.

### Kịch bản 4: Gửi bình luận lồng nhau kèm parentId

- **Mục tiêu**: Xác thực action `addCommentAction` nhận đúng `feedItemId`, nội dung và `parentId` của bình luận cha.

### Kịch bản 5: Responsive Input (Desktop Inline & Mobile Sticky)

- **Mục tiêu**:
  - Avatar trên khung chat hiển thị chính xác avatar của tài khoản hiện tại (`currentUserAvatar`).
  - Toàn bộ khung chat (bao gồm cả ô text input và các icon Image, GIF) được bao bọc bởi một capsule container; khi active/focus thì viền đổi màu bao trọn toàn bộ khung (`focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900`).
  - Desktop: Ô nhập bình luận đặt inline ngay dưới thanh sắp xếp `↓↑ Top`.
  - Mobile: Ô nhập bình luận ghim cố định (`sticky` / `fixed bottom-0 pb-safe`) ở đáy màn hình.

### Kịch bản 6: Đảm bảo không hiển thị tích xanh xác thực

- **Mục tiêu**: Đã loại bỏ hoàn toàn biểu tượng tích xanh (`VerifiedBadge`) bên cạnh tên người dùng ở bài viết chính và trong danh sách bình luận.
