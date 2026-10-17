import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const CWD = process.cwd();
const SRC_DIR = path.join(CWD, "src");

function printHeader(title) {
  process.stdout.write(`\n🔍 [SKILL-AUDIT] ${title}...\n`);
}

function getAllSourceFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        getAllSourceFiles(full, out);
      }
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(path.relative(CWD, full).replace(/\\/g, "/"));
    }
  }
  return out;
}

const allSourceFiles = getAllSourceFiles(SRC_DIR);
let hasErrors = false;

// 1. Zero-useEffect Check (Skill: vercel-react-best-practices)
function auditNoUseEffect() {
  printHeader("Checking 100% Zero-useEffect Policy");
  const violations = [];

  for (const file of allSourceFiles) {
    const content = fs.readFileSync(path.join(CWD, file), "utf-8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        return;
      }
      if (
        /\buseEffect\s*[(<]/.test(line) ||
        /\bimport\s+[^'"]*?\buseEffect\b[^'"]*?from/.test(line)
      ) {
        violations.push(`${file}:${idx + 1}: ${trimmed}`);
      }
    });
  }

  if (violations.length > 0) {
    hasErrors = true;
    process.stderr.write(
      `❌ [FAIL] useEffect is forbidden by skill vercel-react-best-practices.\n` +
        `Found ${violations.length} violation(s):\n` +
        violations.map((v) => `  - ${v}`).join("\n") +
        `\n👉 Use React 19 alternatives: useSyncExternalStore, ref callbacks, event handlers, or derived state.\n\n`,
    );
  } else {
    process.stdout.write(
      `✅ [PASS] Zero useEffect detected across ${allSourceFiles.length} source files.\n`,
    );
  }
}

// 2. React 19 Standards (Skill: vercel-composition-patterns)
function auditReact19Standards() {
  printHeader("Checking React 19 Standards (no forwardRef, prefer use() over useContext)");
  const forwardRefViolations = [];
  const useContextViolations = [];
  const legacyApiViolations = [];

  for (const file of allSourceFiles) {
    const content = fs.readFileSync(path.join(CWD, file), "utf-8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        return;
      }
      if (
        /\bforwardRef\s*[(<]/.test(line) ||
        /\bimport\s+[^'"]*?\bforwardRef\b[^'"]*?from/.test(line)
      ) {
        forwardRefViolations.push(`${file}:${idx + 1}: ${trimmed}`);
      }
      if (
        /\buseContext\s*\(/.test(line) ||
        /\bimport\s+[^'"]*?\buseContext\b[^'"]*?from/.test(line)
      ) {
        useContextViolations.push(`${file}:${idx + 1}: ${trimmed}`);
      }
      if (/\.defaultProps\s*=/.test(line) || /ReactDOM\.(render|hydrate)\s*\(/.test(line)) {
        legacyApiViolations.push(`${file}:${idx + 1}: ${trimmed}`);
      }
    });
  }

  if (forwardRefViolations.length > 0) {
    hasErrors = true;
    process.stderr.write(
      `❌ [FAIL] forwardRef is deprecated in React 19 (ref is now a standard prop).\n` +
        `Found ${forwardRefViolations.length} violation(s):\n` +
        forwardRefViolations.map((v) => `  - ${v}`).join("\n") +
        `\n👉 Pass 'ref' directly as a prop in component parameters.\n\n`,
    );
  } else {
    process.stdout.write(`✅ [PASS] Zero forwardRef calls detected.\n`);
  }

  if (useContextViolations.length > 0) {
    hasErrors = true;
    process.stderr.write(
      `❌ [FAIL] useContext detected. Skill vercel-composition-patterns mandates hook use(Context) for React 19.\n` +
        `Found ${useContextViolations.length} violation(s):\n` +
        useContextViolations.map((v) => `  - ${v}`).join("\n") +
        `\n👉 Replace 'useContext(MyContext)' with 'use(MyContext)'.\n\n`,
    );
  } else {
    process.stdout.write(`✅ [PASS] Zero legacy useContext calls detected.\n`);
  }

  if (legacyApiViolations.length > 0) {
    hasErrors = true;
    process.stderr.write(
      `❌ [FAIL] Legacy React APIs detected (defaultProps, ReactDOM.render/hydrate).\n` +
        `Found ${legacyApiViolations.length} violation(s):\n` +
        legacyApiViolations.map((v) => `  - ${v}`).join("\n") +
        `\n👉 Use ES6 default parameters and modern React 19 root APIs.\n\n`,
    );
  } else {
    process.stdout.write(`✅ [PASS] Zero legacy React 18 APIs detected.\n`);
  }
}

// 3. RSC Boundary & Root Layout (Skill: next-best-practices)
function auditRscBoundaries() {
  printHeader("Checking Next.js RSC Boundary Hygiene");
  const rootLayoutPath = path.join(SRC_DIR, "app", "layout.tsx");
  if (fs.existsSync(rootLayoutPath)) {
    const content = fs.readFileSync(rootLayoutPath, "utf-8");
    if (/^["']use client["']/m.test(content)) {
      hasErrors = true;
      process.stderr.write(
        `❌ [FAIL] src/app/layout.tsx MUST NOT have 'use client'. Root layout must be a Server Component for streaming & metadata.\n\n`,
      );
    } else {
      process.stdout.write(
        `✅ [PASS] Root layout (src/app/layout.tsx) is a clean Server Component.\n`,
      );
    }
  }
}

// 4. Barrel Imports Bloat Prevention (Skill: vercel-react-best-practices)
function auditBarrelImports() {
  printHeader("Checking Barrel Imports (bundle-barrel-imports)");
  const barrelViolations = [];

  for (const file of allSourceFiles) {
    const content = fs.readFileSync(path.join(CWD, file), "utf-8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        return;
      }
      // Flag direct imports targeting /index
      if (/from\s+["'][^"']*\/index(\.[a-z]+)?["']/.test(trimmed)) {
        barrelViolations.push(`${file}:${idx + 1}: ${trimmed}`);
      }
    });
  }

  if (barrelViolations.length > 0) {
    hasErrors = true;
    process.stderr.write(
      `❌ [FAIL] Direct /index barrel imports detected. Skill vercel-react-best-practices forbids barrel imports to prevent bundle bloat.\n` +
        `Found ${barrelViolations.length} violation(s):\n` +
        barrelViolations.map((v) => `  - ${v}`).join("\n") +
        `\n👉 Import directly from the specific module file instead of the barrel index.\n\n`,
    );
  } else {
    process.stdout.write(`✅ [PASS] Zero /index barrel imports detected.\n`);
  }
}

// 5. Package Import Optimization Config (Skill: vercel-react-best-practices -> bundle-barrel-imports)
function auditNextConfigOptimizations() {
  printHeader("Checking Next.js optimizePackageImports Configuration");
  const nextConfigPath = path.join(CWD, "next.config.ts");
  if (!fs.existsSync(nextConfigPath)) {
    return;
  }

  const content = fs.readFileSync(nextConfigPath, "utf-8");
  if (!content.includes("optimizePackageImports") || !content.includes("lucide-react")) {
    hasErrors = true;
    process.stderr.write(
      `❌ [FAIL] next.config.ts is missing 'optimizePackageImports: ["lucide-react", ...]'.\n` +
        `Skill vercel-react-best-practices requires optimizing barrel packages (like lucide-react) to prevent cold start delays.\n\n`,
    );
  } else {
    process.stdout.write(
      `✅ [PASS] next.config.ts has optimizePackageImports enabled for lucide-react.\n`,
    );
  }
}

// 6. Zero Native <img> Tag Policy (Skill: next-best-practices -> image.md)
function auditNoNativeImg() {
  printHeader("Checking Zero Native <img> Policy (Enforcing next/image)");
  const imgViolations = [];

  for (const file of allSourceFiles.filter((f) => f.endsWith(".tsx"))) {
    const content = fs.readFileSync(path.join(CWD, file), "utf-8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        return;
      }
      if (/<img\s+/.test(trimmed)) {
        imgViolations.push(`${file}:${idx + 1}: ${trimmed}`);
      }
    });
  }

  if (imgViolations.length > 0) {
    hasErrors = true;
    process.stderr.write(
      `❌ [FAIL] Native <img> tags detected. Skill next-best-practices mandates using 'next/image' for automatic optimization & LCP prevention.\n` +
        `Found ${imgViolations.length} violation(s):\n` +
        imgViolations.map((v) => `  - ${v}`).join("\n") +
        `\n👉 Replace <img> with <Image ... /> from 'next/image'.\n\n`,
    );
  } else {
    process.stdout.write(`✅ [PASS] 100% next/image adoption (Zero native <img> tags).\n`);
  }
}

// 7. Component Size Guard (Clean Code / Single Responsibility)
function auditComponentSize() {
  printHeader("Checking Component Size & Modularity (Max 400 lines guideline)");
  const oversizedFiles = [];

  for (const file of allSourceFiles.filter((f) => f.endsWith(".tsx"))) {
    const content = fs.readFileSync(path.join(CWD, file), "utf-8");
    const lineCount = content.split("\n").length;
    if (lineCount > 400) {
      oversizedFiles.push({ file, lineCount });
    }
  }

  if (oversizedFiles.length > 0) {
    oversizedFiles.sort((a, b) => b.lineCount - a.lineCount);
    process.stdout.write(
      `⚠️  [WARN] ${oversizedFiles.length} oversized UI component file(s) detected (> 400 lines):\n` +
        oversizedFiles.map((f) => `  - ${f.file} (${f.lineCount} lines)`).join("\n") +
        `\n👉 Tech Lead Recommendation: Decompose oversized files into smaller sub-components or custom hooks.\n`,
    );
  } else {
    process.stdout.write(
      `✅ [PASS] All UI components are under 400 lines (clean modularity).\n`,
    );
  }
}

// 8. Design System Drift Check (Triple Lane Tokens vs Arbitrary Hex)
function auditDesignTokens() {
  printHeader("Checking Design System Token Usage (Arbitrary Hex Warning)");
  const hexViolations = [];

  for (const file of allSourceFiles.filter((f) => f.endsWith(".tsx"))) {
    const content = fs.readFileSync(path.join(CWD, file), "utf-8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        return;
      }
      if (/(?:bg|text|border|ring|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/.test(line)) {
        hexViolations.push(`${file}:${idx + 1}`);
      }
    });
  }

  if (hexViolations.length > 0) {
    process.stdout.write(
      `⚠️  [WARN] Found ${hexViolations.length} instance(s) of arbitrary hex colors in JSX className.\n` +
        `  Samples:\n` +
        hexViolations.slice(0, 5).map((v) => `    - ${v}`).join("\n") +
        (hexViolations.length > 5 ? `\n    ... and ${hexViolations.length - 5} more.` : "") +
        `\n👉 Recommendation: Use CSS custom properties from tokens.css (e.g. var(--color-action), var(--color-text)).\n`,
    );
  } else {
    process.stdout.write(
      `✅ [PASS] 100% Design Token conformance (Zero arbitrary hex colors in JSX).\n`,
    );
  }
}

// 9. Functional Immutability & Return Values (AGENTS.md: No mutable return flags)
function auditNoMutableReturnFlags() {
  printHeader("Checking Functional Immutability (No 'let flag = false ... return flag')");
  const violations = [];

  for (const file of allSourceFiles) {
    const content = fs.readFileSync(path.join(CWD, file), "utf-8");
    const lines = content.split("\n");

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();
      if (line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) continue;

      const letMatch = line.match(/\blet\s+([a-zA-Z0-9_$]+)\s*=\s*(false|true)\s*;/);
      if (letMatch) {
        const varName = letMatch[1];
        const lookAheadMax = Math.min(lines.length, idx + 40);
        for (let j = idx + 1; j < lookAheadMax; j++) {
          const ahead = lines[j].trim();
          if (new RegExp(`\\breturn\\s+${varName}\\s*;`).test(ahead)) {
            violations.push(`${file}:${idx + 1}: '${letMatch[0]}' returned at line ${j + 1}`);
            break;
          }
        }
      }
    }
  }

  if (violations.length > 0) {
    hasErrors = true;
    process.stderr.write(
      `❌ [FAIL] Mutable return flag detected (Anti-pattern: let flag = false ... return flag).\n` +
        `Found ${violations.length} violation(s):\n` +
        violations.map((v) => `  - ${v}`).join("\n") +
        `\n👉 Enforce Functional Immutability: Return directly with 'return true' / 'return false' or early return instead of mutating a 'let' flag.\n\n`,
    );
  } else {
    process.stdout.write(
      `✅ [PASS] 100% Immutability Policy (Zero mutable return flags detected).\n`,
    );
  }
}

function main() {
  const start = Date.now();
  process.stdout.write("====================================================\n");
  process.stdout.write("🛡️  RUNNING SKILL & ARCHITECTURE AUDITOR (CI GUARD)\n");
  process.stdout.write("====================================================\n");

  auditNoUseEffect();
  auditReact19Standards();
  auditRscBoundaries();
  auditBarrelImports();
  auditNextConfigOptimizations();
  auditNoNativeImg();
  auditComponentSize();
  auditDesignTokens();
  auditNoMutableReturnFlags();

  const duration = ((Date.now() - start) / 1000).toFixed(2);
  process.stdout.write("\n----------------------------------------------------\n");
  if (hasErrors) {
    process.stderr.write(
      `❌ Skill audit FAILED (${duration}s). Fix violations before proceeding.\n\n`,
    );
    process.exit(1);
  } else {
    process.stdout.write(`🎉 All skill & architecture checks PASSED (${duration}s).\n\n`);
    process.exit(0);
  }
}

main();
