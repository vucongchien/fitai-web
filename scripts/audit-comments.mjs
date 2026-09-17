import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const CWD = process.cwd();

export function isIgnoredPath(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return (
    normalized.includes("/gen/") ||
    normalized.includes("node_modules/") ||
    normalized.includes(".next/") ||
    normalized.startsWith("tests/") ||
    normalized.includes("/tests/") ||
    normalized.endsWith(".test.ts") ||
    normalized.endsWith(".test.tsx") ||
    normalized.endsWith(".d.ts") ||
    normalized.endsWith(".json") ||
    normalized.endsWith(".md")
  );
}

export function checkCommentViolations(content, filePath = "unknown") {
  const violations = [];
  const lines = content.split("\n");

  // 1. Detect multi-line block comments (/* ... */ or /** ... */) >= 3 lines or > 80 chars
  const blockCommentRegex = /\/\*[\s\S]*?\*\//g;
  let match;
  while ((match = blockCommentRegex.exec(content)) !== null) {
    const rawComment = match[0];
    const startIndex = match.index;
    const lineNumber = content.slice(0, startIndex).split("\n").length;
    const commentLines = rawComment.split("\n");

    // Allow compiler directives / lint directives
    const trimmed = rawComment.trim();
    if (
      trimmed.startsWith("/* eslint-") ||
      trimmed.startsWith("/* istanbul ") ||
      trimmed.startsWith("/* @ts-")
    ) {
      continue;
    }

    if (commentLines.length >= 3) {
      violations.push({
        file: filePath,
        line: lineNumber,
        lineCount: commentLines.length,
        content: rawComment.trim(),
        reason: `Block comment spans ${commentLines.length} lines (max allowed is 2 lines).`,
      });
    } else if (rawComment.length > 100) {
      violations.push({
        file: filePath,
        line: lineNumber,
        lineCount: commentLines.length,
        content: rawComment.trim(),
        reason: `Block comment is too long (${rawComment.length} chars, max allowed is 100).`,
      });
    }
  }

  // 2. Detect 3+ consecutive line comments (// ...)
  let consecutiveCount = 0;
  let startLine = 0;
  let commentGroup = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isDirective =
      line.startsWith("// eslint-") ||
      line.startsWith("// @ts-") ||
      line.startsWith("// cspell:") ||
      line.startsWith("/// <reference");

    if (line.startsWith("//") && !isDirective) {
      if (consecutiveCount === 0) {
        startLine = i + 1;
        commentGroup = [];
      }
      consecutiveCount++;
      commentGroup.push(line);
    } else {
      if (consecutiveCount >= 3) {
        violations.push({
          file: filePath,
          line: startLine,
          lineCount: consecutiveCount,
          content: commentGroup.join("\n"),
          reason: `Consecutive single-line comments span ${consecutiveCount} lines (max allowed is 2 lines).`,
        });
      }
      consecutiveCount = 0;
      commentGroup = [];
    }
  }

  if (consecutiveCount >= 3) {
    violations.push({
      file: filePath,
      line: startLine,
      lineCount: consecutiveCount,
      content: commentGroup.join("\n"),
      reason: `Consecutive single-line comments span ${consecutiveCount} lines (max allowed is 2 lines).`,
    });
  }

  return violations;
}

export function getTargetFiles() {
  const args = process.argv.slice(2);
  const isStaged = args.includes("--staged");
  const isAll = args.includes("--all");

  const filesToScan = new Set();

  // Always scan all files in mobile/ (100% policy enforcement)
  function scanMobile(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== ".expo") {
          scanMobile(full);
        }
      } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
        filesToScan.add(path.relative(CWD, full).replace(/\\/g, "/"));
      }
    }
  }
  scanMobile(path.join(CWD, "mobile", "src"));
  scanMobile(path.join(CWD, "mobile", "app"));

  if (isAll) {
    // Scan all src files
    function scanSrc(dir) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== "gen") {
            scanSrc(full);
          }
        } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
          filesToScan.add(path.relative(CWD, full).replace(/\\/g, "/"));
        }
      }
    }
    scanSrc(path.join(CWD, "src"));
    return Array.from(filesToScan);
  }

  // Check git diff for changed/staged files
  const gitArgs = isStaged
    ? ["diff", "--cached", "--name-only", "--diff-filter=ACMR"]
    : ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"];

  try {
    const res = spawnSync("git", gitArgs, { encoding: "utf-8", cwd: CWD });
    if (res.stdout) {
      res.stdout
        .split("\n")
        .map((f) => f.trim().replace(/\\/g, "/"))
        .filter(
          (f) =>
            /\.(ts|tsx|js|mjs)$/.test(f) && !isIgnoredPath(f) && fs.existsSync(path.join(CWD, f)),
        )
        .forEach((f) => filesToScan.add(f));
    }
  } catch {
    // Git not available, fallback to mobile files
  }

  // In CI environment without staged changes, compare with main or HEAD~1
  if (filesToScan.size === 0 || (!isStaged && process.env.CI)) {
    try {
      const ciDiff = spawnSync("git", ["diff", "--name-only", "--diff-filter=ACMR", "HEAD~1"], {
        encoding: "utf-8",
        cwd: CWD,
      });
      if (ciDiff.stdout) {
        ciDiff.stdout
          .split("\n")
          .map((f) => f.trim().replace(/\\/g, "/"))
          .filter(
            (f) =>
              /\.(ts|tsx|js|mjs)$/.test(f) && !isIgnoredPath(f) && fs.existsSync(path.join(CWD, f)),
          )
          .forEach((f) => filesToScan.add(f));
      }
    } catch {
      // Fallback
    }
  }

  return Array.from(filesToScan);
}

export function runAudit() {
  const files = getTargetFiles();
  let totalViolations = 0;

  process.stdout.write("====================================================\n");
  process.stdout.write("🛡️  RUNNING COMMENT POLICY AUDIT (AGENTS.md Rule 5)\n");
  process.stdout.write("====================================================\n");

  for (const relPath of files) {
    if (isIgnoredPath(relPath)) continue;
    const fullPath = path.join(CWD, relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, "utf-8");
    const violations = checkCommentViolations(content, relPath);

    if (violations.length > 0) {
      totalViolations += violations.length;
      for (const v of violations) {
        process.stderr.write(
          `\n❌ [FAIL] ${v.file}:${v.line}: Comment dài hoặc thừa thãi (${v.lineCount} dòng)!\n` +
            `--------------------------------------------------\n` +
            `${v.content}\n` +
            `--------------------------------------------------\n` +
            `👉 XÓA ĐI! Code phải tự giải thích (self-documenting).\n` +
            `   Theo AGENTS.md Rule 5: "Lazy write comment in code. Write comment only when necessary if comment not explain well remove it. Short comment is best."\n` +
            `   Vui lòng xóa comment này đi hoặc rút gọn thành 1 dòng tiếng Anh ngắn gọn.\n`,
        );
      }
    }
  }

  process.stdout.write("\n----------------------------------------------------\n");
  if (totalViolations > 0) {
    process.stderr.write(
      `❌ Comment audit FAILED: Phát hiện ${totalViolations} comment vi phạm. XÓA ĐI rồi commit lại!\n\n`,
    );
    process.exit(1);
  } else {
    process.stdout.write(
      `✅ Comment audit PASSED: Đã kiểm tra ${files.length} files, không phát hiện comment dài/thừa thãi.\n\n`,
    );
    process.exit(0);
  }
}

// Direct execution
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  runAudit();
}
