import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const CWD = process.cwd();
const VITEST_OUTPUT_FILE = path.join(CWD, ".vitest-precommit-temp.json");
const isAll = process.argv.includes("--all");

function cleanAnsi(str) {
  return str ? str.replace(/\u001B\[[0-9;]*[a-zA-Z]/g, "") : "";
}

function printHeader(title) {
  process.stdout.write(`\n[PRE-COMMIT] ${title}...\n`);
}

function printPass(title, durationMs) {
  const duration = (durationMs / 1000).toFixed(1);
  process.stdout.write(`[PASS] ${title} (${duration}s)\n`);
}

function printSkip(title, reason) {
  process.stdout.write(`[SKIP] ${title} (${reason})\n`);
}

function printFailAndExit(title, cleanErrorMessage) {
  process.stderr.write(`\n[FAIL] Pre-commit blocked at: ${title}\n`);
  process.stderr.write("--------------------------------------------------\n");
  process.stderr.write(cleanErrorMessage.trim() + "\n");
  process.stderr.write("--------------------------------------------------\n");
  process.stderr.write("Fix the error above and re-try committing.\n\n");
  process.exit(1);
}

function getChangedFiles() {
  if (isAll) return [];

  // Check staged files first (git pre-commit hook runs on staged files)
  const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], {
    shell: true,
    cwd: CWD,
    encoding: "utf-8",
  });

  let files = (staged.stdout || "")
    .split("\n")
    .map((f) => f.trim().replace(/\\/g, "/"))
    .filter(Boolean);

  // If no staged files (e.g. running `pnpm precommit` directly in terminal), check working tree
  if (files.length === 0) {
    const workingTree = spawnSync("git", ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"], {
      shell: true,
      cwd: CWD,
      encoding: "utf-8",
    });
    files = (workingTree.stdout || "")
      .split("\n")
      .map((f) => f.trim().replace(/\\/g, "/"))
      .filter(Boolean);
  }

  return files;
}

// 0. SKILLS & ARCHITECTURE AUDIT (Zero-useEffect, React 19 rules, RSC hygiene, barrel imports)
function runSkillsAudit() {
  printHeader("1/5 Running Skills & Architecture Audit");
  const start = Date.now();

  const res = spawnSync("node", ["scripts/audit-skills.mjs"], {
    shell: true,
    cwd: CWD,
    encoding: "utf-8",
  });

  if (res.status !== 0) {
    const raw = cleanAnsi((res.stderr || "") + (res.stdout || ""));
    printFailAndExit("skills-audit", raw || "Skills & Architecture audit failed.");
  }

  printPass("skills-audit", Date.now() - start);
}

// 1. LINT STEP (Runs only on changed JS/TS files)
function runLint(changedFiles) {
  printHeader("2/5 Running Lint (oxlint)");
  const start = Date.now();

  let targetArgs = ["."];
  if (!isAll) {
    const lintFiles = changedFiles.filter(
      (f) => /\.(jsx?|tsx?|mjs|cjs)$/.test(f) && fs.existsSync(path.join(CWD, f)),
    );
    if (lintFiles.length === 0) {
      printSkip("lint", "no staged JS/TS files");
      return;
    }
    if (lintFiles.join(" ").length > 3000) {
      targetArgs = ["."];
    } else {
      targetArgs = lintFiles;
    }
  }

  const res = spawnSync(
    "npx",
    ["--no-install", "oxlint", "-f", "agent", "--nextjs-plugin", "--quiet", ...targetArgs],
    {
      shell: true,
      cwd: CWD,
      encoding: "utf-8",
    },
  );

  if (res.status !== 0) {
    const raw = cleanAnsi((res.stdout || "") + (res.stderr || ""));
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("warning") && !l.includes("Finished in"));

    const errorLines = lines.length > 0 ? lines : raw.split("\n").filter(Boolean);
    const condensed = errorLines.slice(0, 25).join("\n");
    printFailAndExit("lint", condensed);
  }

  printPass("lint", Date.now() - start);
}

// 2. TEST STEP (Runs only related tests using vitest dependency graph)
function cleanVitestFailure(rawMsg) {
  if (!rawMsg) return "";
  let msg = cleanAnsi(rawMsg);

  // Remove testing-library full DOM dumps (massive token waste for LLMs)
  msg = msg.replace(/Ignored nodes:[\s\S]*?<\/body>/gi, "");
  msg = msg.replace(/<body>[\s\S]*?<\/body>/gi, "");

  const rawLines = msg.split("\n").map((l) => l.trimEnd());
  const errorLines = [];
  const locationLines = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("at ")) {
      if (
        !line.includes("node_modules") &&
        !line.includes("node:") &&
        !line.includes("@vitest") &&
        !line.includes("chunk-artifact.js") &&
        !line.includes("<anonymous>") &&
        (line.includes("tests/") ||
          line.includes("tests\\") ||
          line.includes("src/") ||
          line.includes("src\\"))
      ) {
        const cleanLoc = line
          .replace(/.*[\\/](tests[\\/].*?|src[\\/].*?)(:\d+:\d+).*/, "$1$2")
          .trim();
        const finalLoc = cleanLoc.startsWith("at ") ? cleanLoc : `at ${cleanLoc}`;
        if (!locationLines.includes(finalLoc)) {
          locationLines.push(finalLoc);
        }
      }
    } else if (trimmed) {
      errorLines.push(line);
    }
  }

  const result = [];
  result.push(...errorLines.slice(0, 10));
  if (locationLines.length > 0) {
    result.push(`  Locations: ${locationLines.slice(0, 2).join(" | ")}`);
  }
  return result.join("\n");
}

function runTest(changedFiles) {
  printHeader("3/5 Running Tests (vitest)");
  const start = Date.now();

  let testArgs = ["run", "--reporter=json", `--outputFile=${VITEST_OUTPUT_FILE}`];

  if (!isAll) {
    const testableFiles = changedFiles.filter(
      (f) => /\.(jsx?|tsx?)$/.test(f) && fs.existsSync(path.join(CWD, f)),
    );
    if (testableFiles.length === 0) {
      printSkip("test", "no code changes");
      return;
    }
    if (testableFiles.join(" ").length > 3000) {
      testArgs = ["run", "--reporter=json", `--outputFile=${VITEST_OUTPUT_FILE}`];
    } else {
      // vitest related runs only tests affected by the changed files
      testArgs = [
        "related",
        ...testableFiles,
        "--run",
        "--passWithNoTests",
        "--reporter=json",
        `--outputFile=${VITEST_OUTPUT_FILE}`,
      ];
    }
  }

  try {
    if (fs.existsSync(VITEST_OUTPUT_FILE)) {
      fs.unlinkSync(VITEST_OUTPUT_FILE);
    }
  } catch {}

  const res = spawnSync("npx", ["--no-install", "vitest", ...testArgs], {
    shell: true,
    cwd: CWD,
    encoding: "utf-8",
  });

  let formattedErrors = null;

  if (fs.existsSync(VITEST_OUTPUT_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(VITEST_OUTPUT_FILE, "utf-8"));
      const failedSuites = (data.testResults || []).filter(
        (s) =>
          s.status === "failed" || (s.assertionResults || []).some((a) => a.status === "failed"),
      );

      if (failedSuites.length > 0) {
        const out = [];
        let failCount = 0;

        for (const suite of failedSuites) {
          const relPath = path.relative(CWD, suite.name).replace(/\\/g, "/");
          const failedTests = (suite.assertionResults || []).filter((t) => t.status === "failed");
          if (failedTests.length === 0) continue;

          out.push(`FAIL: ${relPath}`);
          for (const t of failedTests) {
            failCount++;
            const testName = [...(t.ancestorTitles || []), t.title].filter(Boolean).join(" > ");
            out.push(`  - ${testName}`);
            for (const fMsg of t.failureMessages || []) {
              const cleaned = cleanVitestFailure(fMsg);
              if (cleaned) {
                out.push(
                  cleaned
                    .split("\n")
                    .map((l) => `    ${l}`)
                    .join("\n"),
                );
              }
            }
          }
        }

        out.push(
          `\nTest Summary: ${failCount} failed, ${data.numPassedTests ?? 0} passed, ${data.numTotalTests ?? 0} total`,
        );
        formattedErrors = out.join("\n");
      }
    } catch {}

    try {
      fs.unlinkSync(VITEST_OUTPUT_FILE);
    } catch {}
  }

  if (res.status !== 0) {
    if (formattedErrors) {
      printFailAndExit("test", formattedErrors);
    }

    const raw = cleanAnsi((res.stdout || "") + (res.stderr || ""));
    const fallbackLines = raw
      .split("\n")
      .filter(
        (l) =>
          !l.includes("node_modules") &&
          !l.includes("chunk-artifact.js") &&
          !l.includes("JSON report written"),
      )
      .slice(0, 25)
      .join("\n");
    printFailAndExit("test", fallbackLines || "Vitest exited with non-zero status.");
  }

  printPass("test", Date.now() - start);
}

// 3. TYPECHECK STEP (Runs only when TypeScript files or configs change)
function runTypecheck(changedFiles) {
  printHeader("4/5 Running Type-check (tsc)");
  const start = Date.now();

  if (!isAll) {
    const hasTsChanges = changedFiles.some(
      (f) => /\.(tsx?|d\.ts)$/.test(f) || f === "tsconfig.json" || f === "package.json",
    );
    if (!hasTsChanges) {
      printSkip("type-check", "no TypeScript changes");
      return;
    }
  }

  const res = spawnSync("npx", ["--no-install", "tsc", "--noEmit", "--pretty", "false"], {
    shell: true,
    cwd: CWD,
    encoding: "utf-8",
  });

  if (res.status !== 0) {
    const raw = cleanAnsi((res.stdout || "") + (res.stderr || ""));
    const errorLines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.includes(": error TS") || l.includes("error TS"));

    const displayLines = errorLines.length > 0 ? errorLines : raw.split("\n").filter(Boolean);
    const count = displayLines.length;
    const condensed = displayLines.slice(0, 25).join("\n");
    const note = count > 25 ? `\n... and ${count - 25} more type errors.` : "";

    printFailAndExit("type-check", condensed + note);
  }

  printPass("type-check", Date.now() - start);
}

// 4. BUILD STEP (Runs only when production app files or build configs change)
function runBuild(changedFiles) {
  printHeader("5/5 Running Production Build (next build)");
  const start = Date.now();

  if (process.env.SKIP_BUILD === "1" || process.env.FAST === "1") {
    printSkip("build", "skipped via SKIP_BUILD=1");
    return;
  }

  if (!isAll) {
    const hasAppChanges = changedFiles.some((f) => {
      if (f.startsWith("src/")) return true;
      if (f.startsWith("public/")) return true;
      if (/^(next\.config|tailwind\.config|postcss\.config|package\.json)/.test(f)) return true;
      return false;
    });

    if (!hasAppChanges) {
      printSkip("build", "no production/app code changed");
      return;
    }
  }

  // 1. Copy ort assets first (required by next build)
  const ortRes = spawnSync("node", ["scripts/copy-ort-assets.mjs"], {
    shell: true,
    cwd: CWD,
    encoding: "utf-8",
  });
  if (ortRes.status !== 0) {
    printFailAndExit("build (copy-ort-assets)", (ortRes.stderr || ortRes.stdout || "").trim());
  }

  // 2. Next build
  const res = spawnSync("npx", ["--no-install", "next", "build"], {
    shell: true,
    cwd: CWD,
    encoding: "utf-8",
  });

  if (res.status !== 0) {
    const raw = cleanAnsi((res.stdout || "") + (res.stderr || ""));
    const lines = raw.split("\n");

    const filtered = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (/^[┌├│└○◐ƒ▲✓\-]/.test(trimmed)) return false;
      if (trimmed.startsWith("Route (app)")) return false;
      if (trimmed.includes("Collecting page data")) return false;
      if (trimmed.includes("Generating static pages")) return false;
      if (trimmed.includes("Finalizing page optimization")) return false;
      if (trimmed.includes("Creating an optimized production build")) return false;
      if (trimmed.includes("[copy-ort-assets]")) return false;
      return true;
    });

    const condensed = (filtered.length > 0 ? filtered : lines).slice(0, 30).join("\n");
    printFailAndExit("build", condensed);
  }

  printPass("build", Date.now() - start);
}

// MAIN PIPELINE
function main() {
  const totalStart = Date.now();
  process.stdout.write(
    "Starting pre-commit pipeline: audit-skills -> lint -> test -> type-check -> build\n",
  );

  const changedFiles = getChangedFiles();
  if (!isAll && changedFiles.length === 0) {
    process.stdout.write("[PASS] No changed files detected to check.\n\n");
    process.exit(0);
  }

  runSkillsAudit();
  runLint(changedFiles);
  runTest(changedFiles);
  runTypecheck(changedFiles);
  runBuild(changedFiles);

  const totalTime = ((Date.now() - totalStart) / 1000).toFixed(1);
  process.stdout.write(`\nAll pre-commit checks passed (${totalTime}s). Proceeding to commit.\n\n`);
  process.exit(0);
}

main();
