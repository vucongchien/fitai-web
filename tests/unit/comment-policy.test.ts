import { describe, expect, it } from "vitest";

import { checkCommentViolations, isIgnoredPath } from "../../scripts/audit-comments.mjs";

describe("Comment Policy & CI Auditor (AGENTS.md Rule 5)", () => {
  it("rejects multi-line block comments with 3+ lines (like the one flagged by user)", () => {
    const codeWithVerboseComment = `
/**
 * Headless Circular Progress Logic
 * Pure mathematical computation for circular progress rings and gauges.
 * Usable across Web (SVG) and React Native / Expo (react-native-svg or custom gauge).
 */
export const DEFAULT_RADIUS = 52;
`;

    const violations = checkCommentViolations(
      codeWithVerboseComment,
      "src/use-circular-progress.ts",
    );
    expect(violations.length).toBe(1);
    expect(violations[0].lineCount).toBe(5);
    expect(violations[0].reason).toContain("Block comment spans 5 lines");
    expect(violations[0].content).toContain("Headless Circular Progress Logic");
  });

  it("rejects 3 or more consecutive single-line comments", () => {
    const codeWithConsecutiveComments = `
// Step 1: Initialize the auth state
// Step 2: Request token from backend
// Step 3: Save token to secure storage
export async function login() {}
`;

    const violations = checkCommentViolations(codeWithConsecutiveComments, "src/auth.ts");
    expect(violations.length).toBe(1);
    expect(violations[0].lineCount).toBe(3);
    expect(violations[0].reason).toContain("Consecutive single-line comments span 3 lines");
  });

  it("rejects block comments that exceed 100 characters even if fewer than 3 lines", () => {
    const longSingleLineBlock = `
/* This is an excessively long and unnecessarily verbose block comment that goes on and on explaining what the code is obviously doing */
export const x = 1;
`;
    const violations = checkCommentViolations(longSingleLineBlock, "src/long.ts");
    expect(violations.length).toBe(1);
    expect(violations[0].reason).toContain("Block comment is too long");
  });

  it("passes clean code with no comments", () => {
    const cleanCode = `
export function add(a: number, b: number): number {
  return a + b;
}
`;
    const violations = checkCommentViolations(cleanCode, "src/math.ts");
    expect(violations.length).toBe(0);
  });

  it("allows short single-line comments and compiler directives", () => {
    const codeWithShortComments = `
// Single-flight promise
let promise: Promise<void> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const val: any = null;

/* eslint-disable no-console */
console.log(val);
`;
    const violations = checkCommentViolations(codeWithShortComments, "src/short.ts");
    expect(violations.length).toBe(0);
  });

  it("ignores generated files and non-code assets", () => {
    expect(isIgnoredPath("src/shared/api/gen/openapiv2.ts")).toBe(true);
    expect(isIgnoredPath("node_modules/pkg/index.js")).toBe(true);
    expect(isIgnoredPath(".next/static/bundle.js")).toBe(true);
    expect(isIgnoredPath("src/types.d.ts")).toBe(true);
    expect(isIgnoredPath("tests/unit/some.test.ts")).toBe(true);
    expect(isIgnoredPath("src/component.tsx")).toBe(false);
    expect(isIgnoredPath("src/features/workout/domain/motion-engine.ts")).toBe(false);
  });
});
