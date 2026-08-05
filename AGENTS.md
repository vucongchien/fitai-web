<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Guidelines & Rules

## 1. Package Manager & Environment

- **Package Manager**: Dự án sử dụng phiên bản `pnpm` được pin trong trường `packageManager` của `package.json`. Không dùng `npm` hay `bun` để cài đặt dependencies để tránh xung đột file lock (`pnpm-lock.yaml`).
- **OS Environment**: Windows (hỗ trợ WSL2 / Docker).

## 2. Code Quality & System Design

- **Tư duy luồng dữ liệu (Data Flow)**: Thiết kế rõ ràng từ Client -> Server Component / Action -> Database / Service. Xác định bottleneck và điểm dễ đứt gãy.
- **Xử lý trạng thái đầy đủ**: Mọi UI/Module phải xử lý đủ 3 trạng thái: `Loading`, `Error`, và `Empty`.
- **Logging & Debuggability**: Các module core cần có log rõ ràng để dễ truy vết sự cố.

## 3. Testing & Verification

- Viết unit test cho các chức năng cụ thể.
- Tạo file `.md` trong thư mục test chứa mục lục và mô tả chi tiết kịch bản test.

## 4. Code Cleanup & Dead Code Removal

- **Quy tắc Xóa Code Thừa Kiên Quyết**: Khi refactor hoặc review code, nếu phát hiện file, route, component hoặc logic dư thừa/trùng lặp (dead code), **luôn ưu tiên xóa tận gốc (hard delete)** thay vì giữ lại các giải pháp tạm thời như `redirect`, shim, hay comment ẩn.
- **Quy trình Xóa**:
  1. Dùng `grep` kiểm tra toàn bộ codebase để xác nhận không còn nơi nào import/gọi tới code thừa đó.
  2. Xóa hẳn file/thư mục.
  3. Xóa cache (ví dụ `.next`) và chạy `pnpm typecheck` + `pnpm test` + `pnpm build` để xác nhận hệ thống hoạt động sạch sẽ 100%.

