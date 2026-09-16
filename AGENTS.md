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

## 5. SDLC Task Lifecycle & Planning Rules

- **Phân loại Task**: Khi người dùng đưa ra yêu cầu thuộc dạng Task (tính năng mới, sửa lỗi, refactor, tích hợp hệ thống/API):
  1. Tạo thư mục task theo chuẩn: `tasks/YYYY-MM-DD-<slug>/` (ví dụ: `tasks/2026-09-16-exercise-empty-state/`).
  2. Tạo 2 file tài liệu bắt buộc theo đúng format của skill `task-lifecycle-sdlc`:
     - `intent.md`: Ghi nhận `Problem` (theo quy trình 4 bước), `Desired Outcome` (mục tiêu kỹ thuật cụ thể, không từ ngữ mơ hồ), `Business & Technical References`, và 3 mục cốt lõi: `Gaps`, `Working Assumptions`, `Open Questions` (tối đa 5 câu hỏi mở).
     - `plan.md`: Kế hoạch thực thi kỹ thuật gồm `Files that change` (kèm trạng thái `(new)`, `(modify)`, `(delete)`), `Solution` (giải pháp tối ưu duy nhất theo Simplicity First), `Order of work`, `Risks & Mitigations`, và `Proof`. Tuyệt đối không lặp lại các mục đã có trong `intent.md`.
     - *Lưu ý*: Thư mục task chỉ lưu trữ đúng 2 file này. Bảng chấm điểm và đánh giá do Subagent `sdlc-auditor` phản hồi trực tiếp cho Agent chính.
- **Định nghĩa 3 mục cốt lõi trong `intent.md`**:
  1. **Gaps (Phân tích khoảng cách sau Explore)**: Danh sách bóc tách từng khoảng cách kỹ thuật (Hiện trạng $\rightarrow$ Kỳ vọng $\rightarrow$ Cần bổ sung).
  2. **Working Assumptions (Các giả định chưa chốt)**: Liệt kê các tiền đề kỹ thuật / nghiệp vụ mà Agent tạm coi là đúng để tiếp tục lập kế hoạch (kèm kế hoạch dự phòng nếu giả định sai).
  3. **Open Questions (Tối đa 5 câu)**:
     - Dùng để lưu vết các điểm cần User review/chốt lại sau khi đọc plan.
     - Cấu trúc: `[Chủ đề] -> [Câu hỏi cụ thể] -> [Khuyến nghị mặc định & Giả định tạm thời]`.
     - Không dừng lại hỏi người dùng trong lúc lập kế hoạch; luôn chọn phương án khuyến nghị để tiếp tục.
- **Kiểm toán độc lập (Subagent `sdlc-auditor`)**:
  - Sau khi lập `plan.md`, Agent chính gọi subagent `sdlc-auditor` để đối soát mã nguồn thực tế và phản hồi kết quả đánh giá trực tiếp theo SDLC Rubric (không tạo file thừa trên ổ đĩa). Nếu REJECTED, Agent chính sửa trực tiếp `intent.md` / `plan.md` theo Action Items.
- **Giao thức Đọc File (Exact File Inspection)**:
  - Không suy đoán đường dẫn file. Trước khi lập plan hoặc kiểm toán:
    1. Đọc file cấu hình gốc: `package.json` (để xác định đúng Next.js/React và test runner `vitest`), `tsconfig.json`.
    2. File `(modify)` / `(delete)`: Phải dùng `view_file` đọc nội dung hiện tại và `grep_search` tìm toàn bộ Caller đang import nó để tránh breaking changes.
    3. File `(new)`: Phải kiểm tra thư mục cha có thực sự tồn tại trong repo (ví dụ: `src/features/...`, `src/app/...`).
    4. File trong `References`: Phải thực sự tồn tại trong repo và được đọc đối soát.
- **Bảng Điểm Trừ Vi Phạm (Strict Penalties)**:
  - Áp dụng trừ điểm khi kiểm toán:
    - **PEN-01 (-25đ)**: Phantom Path (đường dẫn không tồn tại).
    - **PEN-02 (-25đ)**: Tech Stack Mismatch (đề xuất sai lệch công nghệ so với `package.json`, ví dụ: pytest/python trong repo Next.js/Vitest).
    - **PEN-03 (-20đ)**: Lỗ hổng bảo mật (IDOR, thiếu kiểm tra sở hữu dữ liệu, bypass auth).
    - **PEN-04 (-15đ)**: Thiếu file test tương ứng cho code logic/UI mới.
    - **PEN-05 (-15đ)**: Thiếu 1 trong 3 trạng thái giao diện bắt buộc (`Loading`, `Error`, `Empty`).
    - **PEN-06 (-15đ)**: Lệnh test không khả thi trên máy hoặc kiểm thử thủ công chung chung.
- **Tiêu chuẩn phê duyệt (Approval Gate)**:
  - Task chỉ được `APPROVED` khi điểm sau khi trừ $\ge 80/100$, không có tiêu chí nào $< 10/20$, và không dính bất kỳ lỗi phạt nặng $\ge 20$đ.
- **Hook & Kiểm tra tự động**:
  - Chạy `pnpm run task:check` hoặc `node .agents/skills/task-lifecycle-sdlc/scripts/validate-task.mjs` để đối soát tự động đường dẫn file và điểm số. Lifecycle hook (`.agents/skills/task-lifecycle-sdlc/scripts/validate-task-hook.mjs`) sẽ chặn hoàn tất nếu vi phạm format hoặc dính lỗi phạt.

