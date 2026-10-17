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

## 5. Lazy write comment in code

- **Comment**: 
  - Must be English.
  - Write comment only when necessary if comment not explain well remove it.
  - Short comment is best.

## 6. Quy chuẩn Kiến trúc React & Next.js Hiện đại (Mandatory Skills Reference)

Khi viết, sửa hoặc refactor mã nguồn UI/Fullstack, **bắt buộc tuân thủ và đối soát** với 3 bộ kỹ năng chuẩn đặt tại `.agents/skills/`:
1. **`vercel-react-best-practices`**:
   - **Tuyệt đối tránh lạm dụng `useEffect`**: Không dùng `useEffect` để tính toán derived state (tính trực tiếp trong render) hoặc xử lý hành vi người dùng (đặt trực tiếp trong event handler).
   - **Triệt tiêu Data Waterfall**: Dùng `Promise.all`, Suspense boundaries, và fetch song song thay vì cascading fetches.
2. **`vercel-composition-patterns`**:
   - **Composition over Boolean Props**: Không mở rộng component bằng cách nhồi cờ boolean; dùng compound components và composition.
   - **React 19 Conventions**: Không dùng `forwardRef` (dùng `ref` như prop chuẩn), ưu tiên hook `use()` thay cho `useContext()`.
3. **`next-best-practices`**:
   - **Tối ưu ranh giới RSC**: Mặc định là Server Component; chỉ đẩy `'use client'` xuống các component lá (leaf components) có tương tác DOM / state.
   - **Chuẩn Async APIs**: Tuân thủ chuẩn async mới trong Next.js 15+ (`cookies()`, `headers()`, `params`, `searchParams`).

## 7. Chuẩn kết nối API & Wire Authority (ConnectRPC / gRPC First)

- **Wire Authority duy nhất**: Toàn bộ dữ liệu nghiệp vụ trao đổi với backend `gym-companion` **BẮT BUỘC** sử dụng ConnectRPC client và các hợp đồng Protobuf sinh sẵn tại `src/shared/api/gen/`.
- **Nghiêm cấm tự biên tự diễn (No Raw HTTP / No Custom REST)**:
  - Tuyệt đối **KHÔNG** cài đặt hoặc sử dụng các thư viện HTTP bên ngoài (`axios`, `got`, `superagent`, `ky`...).
  - Tuyệt đối **KHÔNG** viết hàm `fetch()` trực tiếp đến backend URLs hoặc endpoint ngoài (chỉ cho phép `fetch()` để tải static assets nội bộ `.json`, `.wasm`, `.onnx` hoặc gọi internal BFF route `/api/*`).
  - Tuyệt đối **KHÔNG** tự tạo mock store, dummy in-memory state hay tự định nghĩa interface DTO bằng tay cho API responses. Mọi request/response model phải được import trực tiếp từ contract `*_pb.ts` trong `src/shared/api/gen/`.
- **Chuẩn khởi tạo Client**:
  - Tại Server Component / Server Action: Sử dụng `createClient(ServiceName, createServerTransport(accessToken))`.
  - Khi backend thay đổi schema, chạy `pnpm proto:gen` để đồng bộ hợp đồng gRPC trước khi viết code giao diện.
