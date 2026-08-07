/**
 * Copies the onnxruntime-web WASM runtime into public/ort/.
 *
 * Without this, ort resolves its .wasm from a CDN at a version that may not match
 * the installed package, and the app cannot run the pose model offline. The
 * jsep.* pair is the WebGPU build; the plain pair is the WASM fallback. We do not
 * ship the asyncify or jspi variants — nothing in the app opts into them.
 *
 * public/ort/ is gitignored: it is a build artefact of node_modules.
 */
import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(import.meta.dirname, "..");
const from = join(root, "node_modules", "onnxruntime-web", "dist");
const to = join(root, "public", "ort");

const WANTED = [
  "ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.jsep.wasm",
  "ort-wasm-simd-threaded.jsep.mjs",
];

const available = new Set(await readdir(from));
const missing = WANTED.filter((name) => !available.has(name));
if (missing.length > 0) {
  console.error(`[copy-ort-assets] missing from onnxruntime-web/dist: ${missing.join(", ")}`);
  process.exit(1);
}

await mkdir(to, { recursive: true });
await Promise.all(WANTED.map((name) => copyFile(join(from, name), join(to, name))));
console.log(`[copy-ort-assets] copied ${WANTED.length} files to public/ort/`);
