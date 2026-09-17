import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, afterEach } from "vitest";

import { validateTask } from "../../.agents/skills/task-lifecycle-sdlc/scripts/validate-task.mjs";

describe("SDLC Task Validator & Status Gate", () => {
  const tempDirs: string[] = [];

  function createMockTaskDir(options: {
    status?: string;
    hasTodo?: boolean;
    todoContent?: string;
    hasIntent?: boolean;
    hasPlan?: boolean;
  }) {
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "sdlc-test-"));
    tempDirs.push(tmpBase);

    const taskDir = path.join(tmpBase, "2026-09-17-test-feature");
    fs.mkdirSync(taskDir, { recursive: true });

    if (options.hasIntent !== false) {
      const intentContent = `# Intent: Test Feature

- **Date**: 2026-09-17
- **Owner**: Test Agent
- **Status**: ${options.status || "Draft"}

## Problem
1. **Triệu chứng**: Lỗi thử nghiệm
2. **Bối cảnh**: Màn hình test
3. **Nguyên nhân gốc rễ**: Mock data
4. **Tác động**: Không ảnh hưởng

## Desired Outcome
1. **[P0 - Nghiệp vụ & Kiểm thử]**: Mục tiêu test
2. **[P1 - Giao diện & UX]**: Giao diện test
3. **[P2 - Hiệu năng & Hoàn thiện]**: Hiệu năng test

## Business & Technical References
- \`package.json\` - Cấu hình gốc

## Gaps
1. **[UI]**:
   - Hiện trạng: Chưa có
   - Kỳ vọng: Hoàn thành
   - Cần bổ sung: Component mới

## Working Assumptions
1. **[Giả định]**: Codebase TypeScript (Căn cứ: \`package.json\`)

## Open Questions
1. **[Câu hỏi]**: Tradeoff gì?
   - **A (Khuyến nghị)**: Phương án A
   - **B**: Phương án B
   - *Giả định tạm thời*: Tạm chọn A.
`;
      fs.writeFileSync(path.join(taskDir, "intent.md"), intentContent, "utf8");
    }

    if (options.hasPlan !== false) {
      const planContent = `# Plan: Test Feature (from intent.md 2026-09-17)

## Files that change
- \`src/features/test/test.ts\` (new)

## Solution
Đơn giản nhất.

## Order of work
1. Bước 1
2. Bước 2
3. Bước 3

## Risks
- Không có rủi ro lớn.

## Proof
- File test: tests/unit/sdlc-task-validator.test.ts
`;
      fs.writeFileSync(path.join(taskDir, "plan.md"), planContent, "utf8");
    }

    if (options.hasTodo !== false) {
      const defaultTodo = `# Todo: Test Feature

## Phase 1: Planning
- [x] Task planning

## Phase 2: Implementation
- [x] Step 1 implementation

## Phase 3: Verification
- [x] Run test
`;
      fs.writeFileSync(path.join(taskDir, "todo.md"), options.todoContent || defaultTodo, "utf8");
    }

    return { taskDir, tmpBase };
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup error
      }
    }
    tempDirs.length = 0;
  });

  it("fails when todo.md exists without plan.md (rule: phai co plan moi co todo.md)", () => {
    const { taskDir, tmpBase } = createMockTaskDir({ hasPlan: false, hasTodo: true });
    const result = validateTask(taskDir, tmpBase);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e: string) =>
          e.includes("Lỗi trình tự SDLC") && e.includes("Phải có plan.md mới có todo.md"),
      ),
    ).toBe(true);
  });

  it("fails when Status is In Progress but todo.md is missing", () => {
    const { taskDir, tmpBase } = createMockTaskDir({ status: "In Progress", hasTodo: false });
    const result = validateTask(taskDir, tmpBase);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes("Thiếu file bắt buộc: todo.md"))).toBe(
      true,
    );
  });

  it("fails when Status is In Progress but plan.md is missing", () => {
    const { taskDir, tmpBase } = createMockTaskDir({
      status: "In Progress",
      hasPlan: false,
      hasTodo: false,
    });
    const result = validateTask(taskDir, tmpBase);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e: string) => e.includes("Thiếu file bắt buộc: plan.md"))).toBe(
      true,
    );
  });

  it("passes for a Draft task with only intent.md (Phase 1 Checkpoint 1)", () => {
    const { taskDir, tmpBase } = createMockTaskDir({
      status: "Draft",
      hasPlan: false,
      hasTodo: false,
    });
    const result = validateTask(taskDir, tmpBase);

    expect(result.valid).toBe(true);
    expect(result.status).toBe("Draft");
  });

  it("passes for a Draft task with intent.md and plan.md (Phase 2 Planning)", () => {
    const { taskDir, tmpBase } = createMockTaskDir({
      status: "Draft",
      hasPlan: true,
      hasTodo: false,
    });
    const result = validateTask(taskDir, tmpBase);

    expect(result.valid).toBe(true);
    expect(result.status).toBe("Draft");
  });

  it("fails when Status is Completed but todo.md has unchecked items [ ]", () => {
    const pendingTodo = `# Todo: Test Feature

## Phase 1: Planning
- [x] Task planning

## Phase 2: Implementation
- [ ] Step 1 not yet completed
`;
    const { taskDir, tmpBase } = createMockTaskDir({
      status: "Completed",
      hasTodo: true,
      todoContent: pendingTodo,
    });
    const result = validateTask(taskDir, tmpBase);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e: string) => e.includes("PEN-TODO") && e.includes("mục chưa hoàn thành"),
      ),
    ).toBe(true);
  });

  it("passes when Status is In Progress even if todo.md has unchecked items [ ]", () => {
    const inProgressTodo = `# Todo: Test Feature

## Phase 1: Planning
- [x] Task planning

## Phase 2: Implementation
- [ ] Step 1 in progress
`;
    const { taskDir, tmpBase } = createMockTaskDir({
      status: "In Progress",
      hasTodo: true,
      todoContent: inProgressTodo,
    });
    const result = validateTask(taskDir, tmpBase);

    expect(result.valid).toBe(true);
    expect(result.status).toBe("In Progress");
    expect(result.todoStats.completed).toBe(1);
    expect(result.todoStats.pending).toBe(1);
  });

  it("passes when Status is Completed and all items in todo.md are checked [x]", () => {
    const completedTodo = `# Todo: Test Feature

## Phase 1: Planning
- [x] Task planning

## Phase 2: Implementation
- [x] Step 1 finished
- [x] Step 2 finished
`;
    const { taskDir, tmpBase } = createMockTaskDir({
      status: "Completed",
      hasTodo: true,
      todoContent: completedTodo,
    });
    const result = validateTask(taskDir, tmpBase);

    expect(result.valid).toBe(true);
    expect(result.status).toBe("Completed");
    expect(result.todoStats.pending).toBe(0);
    expect(result.todoStats.completed).toBe(3);
  });
});
