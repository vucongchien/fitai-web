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

const available = await readdir(from);
const filesToCopy = available.filter(
  (name) => name.endsWith(".wasm") || name.endsWith(".mjs") || name.endsWith(".js"),
);

if (filesToCopy.length === 0) {
  console.error("[copy-ort-assets] No runtime assets found in onnxruntime-web/dist");
  process.exit(1);
}

await mkdir(to, { recursive: true });
await Promise.all(filesToCopy.map((name) => copyFile(join(from, name), join(to, name))));
console.log(`[copy-ort-assets] copied ${filesToCopy.length} files to public/ort/`);

