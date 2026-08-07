# Web Workers & Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move ONNX pose inference and the session clock off the main thread into Dedicated Workers, and add a Service Worker that receives FCM push so notifications arrive when the tab is closed.

**Architecture:** Three independent tracks. (A) `OnnxMotionEngine` currently runs `normaliseFrame` → `session.run` → `decodeSimcc` inside a `requestAnimationFrame` loop on the main thread; it is replaced by `WorkerMotionEngine`, a drop-in `MotionEngine` that grabs frames as `ImageBitmap` on the main thread and transfers them to `inference.worker.ts`, which owns the ORT session, the pose maths and the set accumulator. The `MotionEngine` interface, the event union, `pose-metrics.ts` and `set-telemetry.ts` are unchanged — only `stopSet()` becomes async. (B) `useTicker` swaps `window.setInterval` for a worker-driven tick so rest countdowns keep running when the tab is backgrounded; every consumer already derives from `Date.now()`, so no maths changes. (C) A hand-written `public/sw.js` handles `push`/`notificationclick` with no `fetch` handler, the Firebase Messaging SDK mints an FCM registration token against it, and a Server Action forwards that token to the existing `NotificationService.RegisterDeviceToken` RPC.

**Tech Stack:** Next.js 16.3 App Router (React 19), TypeScript 7, `onnxruntime-web` 1.27, `firebase` (new dependency, Task 7), Vitest + `@testing-library/react` (jsdom), Playwright, `oxlint`/`oxfmt`, pnpm.

## Global Constraints

- Package manager is **pnpm**. Commands: `pnpm run dev`, `pnpm run build`, `pnpm run lint` (oxlint), `pnpm run typecheck` (`tsc --noEmit`), `pnpm test` (`vitest run`), `pnpm test:e2e` (playwright).
- **Never run bare `pnpm format`.** It rewrites ~200 files repo-wide and buries the real diff. Format only what you touched: `pnpm exec oxfmt path/to/file.ts`.
- **Stage only the files your task names.** Never `git add -A`, never `git commit -a`.
- Commit messages MUST start with `[AI]`. Never commit, push, merge, rebase, or reset on `main`, `master`, `staging`, `development`, or `dev` without explicit user approval. All work happens on branch `feat/web-workers-and-push`.
- Always `await` `params` and `searchParams` in Next.js route files.
- Use `oxlint`/`oxfmt`, never ESLint/Prettier.
- **Do not enable COOP/COEP.** Cross-origin isolation would unlock WASM threads but break every S3 image, media asset and cross-origin embed in the app. `ort.env.wasm.numThreads` is pinned to `1` for this reason. Revisit only with measurements.
- The generated contracts under `src/shared/api/gen` are the wire authority and **must not be edited manually**.
- Only one new runtime dependency is permitted: `firebase` (Task 7). Everything else is built from what is already installed.
- Constraint-02 (`PRODUCT.md`): inference stays on-device. Neither worker may send pixels anywhere. Only joint coordinates cross a boundary, and only to the main thread.
- Audio (`use-audio-coach.ts`) is **explicitly out of scope**. Do not touch it.
- Do not fix the hardcoded `formScore: 85` / `validFrameRatio: 0.9` in `use-live-workout-effects.ts:180-190`. Real telemetry wiring is a separate effort; this plan only makes the data reachable.

## Known State Before Starting

Read these before Task 1 — the plan assumes them:

- `src/features/workout/domain/motion-engine.ts` — the `MotionEngine` interface, `MotionEngineEvent` union, `SetTelemetry`, `EMPTY_TELEMETRY`, `ManualMotionEngine`.
- `src/features/workout/domain/onnx-motion-engine.ts` — 320 lines, the thing being replaced.
- `src/features/workout/domain/pose-metrics.ts` and `set-telemetry.ts` — pure, DOM-free, already unit tested. **Both are imported by the worker unchanged.**
- `stopSet()` currently has **no production caller**. `use-motion-engine.ts:134` is the only wrapper; `use-live-workout-effects.ts` never calls it. Making it async is therefore safe.
- `useTicker` has exactly one caller: `use-live-session.ts:303`.
- `NotificationService.RegisterDeviceToken` exists in `src/shared/api/gen/contracts/generic/notification/v1/service/notification_service_pb.ts` and is already allowlisted in `src/shared/api/bff/allowed-services.ts`.
- Existing test touching this area: `tests/unit/pose-metrics.test.ts`. Nothing tests `onnx-motion-engine.ts`.

---

## Task 0: Branch setup

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b feat/web-workers-and-push
git status
```

Expected: `On branch feat/web-workers-and-push`, working tree clean.

---

# Track A — ONNX Inference Worker

## Task 1: Extract the letterbox maths so both samplers share it

`FrameSampler` needs a twin that works on an `OffscreenCanvas` inside the worker. Only the geometry is worth sharing; the drawing differs because the 2D context types differ.

**Files:**
- Modify: `src/features/workout/domain/frame-sampler.ts`
- Test: `tests/unit/frame-sampler.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `letterboxLayout(sourceWidth, sourceHeight, destWidth, destHeight): LetterboxLayout` where `LetterboxLayout = { scale: number; padX: number; padY: number; drawWidth: number; drawHeight: number }`. Task 2's `BitmapSampler` uses it.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/frame-sampler.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { letterboxLayout, toSourceCoords } from "@/features/workout/domain/frame-sampler";

describe("letterboxLayout", () => {
  it("pads on the x axis when the source is taller than the target", () => {
    // 480x640 source into a 192x256 box: both axes scale by 0.4, no padding.
    const layout = letterboxLayout(480, 640, 192, 256);
    expect(layout.scale).toBeCloseTo(0.4);
    expect(layout.padX).toBeCloseTo(0);
    expect(layout.padY).toBeCloseTo(0);
  });

  it("pads on the y axis when the source is wider than the target", () => {
    // 640x480 into 192x256: scale is limited by width (0.3), so 256-144=112 of
    // vertical padding, split evenly.
    const layout = letterboxLayout(640, 480, 192, 256);
    expect(layout.scale).toBeCloseTo(0.3);
    expect(layout.drawWidth).toBeCloseTo(192);
    expect(layout.drawHeight).toBeCloseTo(144);
    expect(layout.padX).toBeCloseTo(0);
    expect(layout.padY).toBeCloseTo(56);
  });

  it("round-trips a point through toSourceCoords", () => {
    const layout = letterboxLayout(640, 480, 192, 256);
    // A point at the centre of the drawn region maps back to the source centre.
    const centre = toSourceCoords(96, 56 + 72, layout);
    expect(centre.x).toBeCloseTo(320);
    expect(centre.y).toBeCloseTo(240);
  });

  it("returns a zero scale for an empty source rather than NaN", () => {
    const layout = letterboxLayout(0, 0, 192, 256);
    expect(layout.scale).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/frame-sampler.test.ts`
Expected: FAIL — `letterboxLayout` is not exported from `frame-sampler.ts`.

- [ ] **Step 3: Add `letterboxLayout` and refactor `FrameSampler` to use it**

In `src/features/workout/domain/frame-sampler.ts`, add above `FrameSampler`:

```ts
export type LetterboxLayout = {
  scale: number;
  padX: number;
  padY: number;
  drawWidth: number;
  drawHeight: number;
};

/**
 * Aspect-preserving fit of a source frame into a destination box, centred.
 * Shared by FrameSampler (main thread, <video>) and BitmapSampler (worker,
 * ImageBitmap) so a keypoint decoded in the worker maps back to source pixels
 * with exactly the same maths on both sides.
 */
export function letterboxLayout(
  sourceWidth: number,
  sourceHeight: number,
  destWidth: number,
  destHeight: number,
): LetterboxLayout {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { drawHeight: 0, drawWidth: 0, padX: 0, padY: 0, scale: 0 };
  }
  const scale = Math.min(destWidth / sourceWidth, destHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  return {
    drawHeight,
    drawWidth,
    padX: (destWidth - drawWidth) / 2,
    padY: (destHeight - drawHeight) / 2,
    scale,
  };
}
```

Then replace the geometry block inside `FrameSampler.grab()`. The existing lines

```ts
    const scale = Math.min(this.width / sourceWidth, this.height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const padX = (this.width - drawWidth) / 2;
    const padY = (this.height - drawHeight) / 2;
```

become:

```ts
    const { drawHeight, drawWidth, padX, padY, scale } = letterboxLayout(
      sourceWidth,
      sourceHeight,
      this.width,
      this.height,
    );
```

The rest of `grab()` is untouched.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run tests/unit/frame-sampler.test.ts tests/unit/pose-metrics.test.ts`
Expected: PASS, 4 new tests plus the existing pose-metrics suite still green.

- [ ] **Step 5: Typecheck, lint, format**

```bash
pnpm run typecheck
pnpm exec oxlint src/features/workout/domain/frame-sampler.ts tests/unit/frame-sampler.test.ts
pnpm exec oxfmt src/features/workout/domain/frame-sampler.ts tests/unit/frame-sampler.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add src/features/workout/domain/frame-sampler.ts tests/unit/frame-sampler.test.ts
git commit -m "[AI] refactor: extract letterboxLayout so worker and main thread share frame geometry"
```

---

## Task 2: Move the ONNX decode maths into a DOM-free module

`normaliseFrame`, `decodeSimcc`, `decodeHeatmap` and `MODEL_IO` are pure but currently live in `onnx-motion-engine.ts`, which imports DOM types. The worker needs them without dragging in `HTMLVideoElement`.

**Files:**
- Create: `src/features/workout/domain/onnx-decode.ts`
- Modify: `src/features/workout/domain/onnx-motion-engine.ts` (re-export only, so the file keeps compiling until Task 5 deletes it)
- Test: `tests/unit/onnx-decode.test.ts` (create)

**Interfaces:**
- Consumes: `LetterboxedFrame` from `frame-sampler.ts`.
- Produces: `MODEL_IO`, `normaliseFrame(frame: LetterboxedFrame): Float32Array`, `decodeSimcc(simccX, simccY, keypointCount, splitRatio?)`, `decodeHeatmap(heatmap, keypointCount, mapWidth, mapHeight, strideX, strideY)`. All consumed by Task 3's worker. `decodeSimcc`/`decodeHeatmap` both return `Array<{ x: number; y: number; score: number }>`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/onnx-decode.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { decodeHeatmap, decodeSimcc, MODEL_IO, normaliseFrame } from "@/features/workout/domain/onnx-decode";

describe("decodeSimcc", () => {
  it("picks the argmax bin on each axis and divides by the split ratio", () => {
    // One joint, 4 x-bins and 4 y-bins. Peak at x-bin 2, y-bin 1.
    const simccX = new Float32Array([0.1, 0.2, 0.9, 0.3]);
    const simccY = new Float32Array([0.1, 0.8, 0.2, 0.1]);
    const [joint] = decodeSimcc(simccX, simccY, 1, 2);
    expect(joint).toBeDefined();
    expect(joint!.x).toBeCloseTo(1); // bin 2 / splitRatio 2
    expect(joint!.y).toBeCloseTo(0.5); // bin 1 / splitRatio 2
    // Score is the weaker of the two axes, clamped to 0..1.
    expect(joint!.score).toBeCloseTo(0.8);
  });

  it("clamps a negative peak to a zero score", () => {
    const simccX = new Float32Array([-3, -5]);
    const simccY = new Float32Array([-1, -2]);
    const [joint] = decodeSimcc(simccX, simccY, 1, 2);
    expect(joint!.score).toBe(0);
  });
});

describe("decodeHeatmap", () => {
  it("maps the argmax index to x/y through the stride", () => {
    // One joint on a 3x2 map, peak at index 4 => x=1, y=1.
    const heatmap = new Float32Array([0, 0, 0, 0, 0.7, 0]);
    const [joint] = decodeHeatmap(heatmap, 1, 3, 2, 4, 8);
    expect(joint!.x).toBe(4);
    expect(joint!.y).toBe(8);
    expect(joint!.score).toBeCloseTo(0.7);
  });
});

describe("normaliseFrame", () => {
  it("produces a planar CHW tensor with ImageNet normalisation applied", () => {
    // A single mid-grey pixel.
    const data = new Uint8ClampedArray([128, 128, 128, 255]);
    const tensor = normaliseFrame({
      data: { data, height: 1, width: 1 } as ImageData,
      padX: 0,
      padY: 0,
      scale: 1,
      sourceHeight: 1,
      sourceWidth: 1,
    });
    expect(tensor).toHaveLength(3);
    expect(tensor[0]).toBeCloseTo((128 - MODEL_IO.mean[0]) / MODEL_IO.std[0]);
    expect(tensor[1]).toBeCloseTo((128 - MODEL_IO.mean[1]) / MODEL_IO.std[1]);
    expect(tensor[2]).toBeCloseTo((128 - MODEL_IO.mean[2]) / MODEL_IO.std[2]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/onnx-decode.test.ts`
Expected: FAIL — cannot resolve `@/features/workout/domain/onnx-decode`.

- [ ] **Step 3: Create `onnx-decode.ts`**

Create `src/features/workout/domain/onnx-decode.ts`. Move the following **verbatim** out of `onnx-motion-engine.ts`: the `MODEL_IO` const (including its `TODO(model)` comment block), `normaliseFrame`, `decodeSimcc`, `decodeHeatmap`. Prepend this header and the one import they need:

```ts
/**
 * Pure ONNX I/O maths — tensor packing and keypoint decoding.
 *
 * DOM-free on purpose: this module is imported by inference.worker.ts, which has
 * no `document`. Everything here is a function from typed arrays to typed
 * arrays, which is also why it is directly unit testable (tests/unit/onnx-decode.test.ts).
 *
 * TODO(model): two of the three seams from the original engine live here now —
 * MODEL_IO's tensor names/sizes, and the choice between decodeSimcc and
 * decodeHeatmap. The third (using the detector box to crop before the pose pass)
 * belongs to inference.worker.ts, which owns the sessions.
 */

import type { LetterboxedFrame } from "@/features/workout/domain/frame-sampler";
```

- [ ] **Step 4: Re-export from `onnx-motion-engine.ts`**

In `src/features/workout/domain/onnx-motion-engine.ts`, delete the four moved declarations and replace them with a re-export near the top of the file, after the existing imports:

```ts
import {
  decodeHeatmap,
  decodeSimcc,
  MODEL_IO,
  normaliseFrame,
} from "@/features/workout/domain/onnx-decode";

export { decodeHeatmap, decodeSimcc, MODEL_IO, normaliseFrame };
```

This file is deleted in Task 5; the re-export only keeps the tree compiling in between.

- [ ] **Step 5: Run tests and typecheck**

```bash
pnpm exec vitest run tests/unit/onnx-decode.test.ts
pnpm run typecheck
```

Expected: 5 tests PASS, typecheck clean.

- [ ] **Step 6: Lint, format, commit**

```bash
pnpm exec oxlint src/features/workout/domain/onnx-decode.ts src/features/workout/domain/onnx-motion-engine.ts tests/unit/onnx-decode.test.ts
pnpm exec oxfmt src/features/workout/domain/onnx-decode.ts src/features/workout/domain/onnx-motion-engine.ts tests/unit/onnx-decode.test.ts
git add src/features/workout/domain/onnx-decode.ts src/features/workout/domain/onnx-motion-engine.ts tests/unit/onnx-decode.test.ts
git commit -m "[AI] refactor: move ONNX tensor and keypoint decoding into a DOM-free module"
```

---

## Task 3: Host the ORT WASM assets locally

By default `onnxruntime-web` fetches its `.wasm`/`.mjs` runtime from a CDN, which mismatches the installed version and fails offline. Serve them from `public/ort/` instead.

**Files:**
- Create: `scripts/copy-ort-assets.mjs`
- Modify: `package.json` (scripts), `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: `/ort/ort-wasm-simd-threaded.wasm`, `/ort/ort-wasm-simd-threaded.mjs`, `/ort/ort-wasm-simd-threaded.jsep.wasm`, `/ort/ort-wasm-simd-threaded.jsep.mjs` served as static assets. Task 4's worker sets `ort.env.wasm.wasmPaths = "/ort/"`.

- [ ] **Step 1: Write the copy script**

Create `scripts/copy-ort-assets.mjs`:

```js
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

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
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
```

- [ ] **Step 2: Run it to verify it succeeds**

Run: `node scripts/copy-ort-assets.mjs`
Expected: `[copy-ort-assets] copied 4 files to public/ort/`

- [ ] **Step 3: Verify the files landed**

Run: `ls public/ort`
Expected: the four filenames listed above, with the two `.wasm` files in the tens of megabytes.

- [ ] **Step 4: Wire it into the build and dev scripts**

In `package.json`, replace the `dev` and `build` script entries and add `ort:copy`:

```json
    "dev": "node scripts/copy-ort-assets.mjs && next dev",
    "build": "node scripts/copy-ort-assets.mjs && next build",
    "ort:copy": "node scripts/copy-ort-assets.mjs",
```

- [ ] **Step 5: Gitignore the generated directory**

Append to `.gitignore`:

```
# onnxruntime-web runtime, generated by scripts/copy-ort-assets.mjs
/public/ort/
```

- [ ] **Step 6: Verify the dev server still boots**

Run: `pnpm run dev`
Expected: the copy line prints, then Next.js reports `Ready`. Stop the server with Ctrl+C.

- [ ] **Step 7: Commit**

```bash
git add scripts/copy-ort-assets.mjs package.json .gitignore
git commit -m "[AI] build: serve onnxruntime-web wasm runtime from public/ort"
```

---

## Task 4: The inference worker

The worker owns the ORT sessions, the pose maths and the set accumulator. It receives `ImageBitmap`s and emits the existing `MotionEngineEvent` union, so nothing upstream learns a new vocabulary.

**Files:**
- Create: `src/features/workout/model/inference-protocol.ts`
- Create: `src/features/workout/model/inference.worker.ts`
- Create: `src/features/workout/domain/bitmap-sampler.ts`
- Test: `tests/unit/inference-protocol.test.ts` (create)

**Interfaces:**
- Consumes: `letterboxLayout`, `LetterboxedFrame`, `toSourceCoords` (Task 1); `MODEL_IO`, `normaliseFrame`, `decodeSimcc`, `decodeHeatmap` (Task 2); `/ort/` assets (Task 3); `pose-metrics.ts` and `set-telemetry.ts` unchanged.
- Produces: the `InferenceRequest` / `InferenceResponse` unions and `isInferenceResponse(value): value is InferenceResponse`. Task 5's `WorkerMotionEngine` is the only consumer.

- [ ] **Step 1: Write the failing test**

The worker itself needs a real browser, so the unit test covers the protocol guard — the one piece that runs on both sides and must not silently accept a malformed message.

Create `tests/unit/inference-protocol.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { isInferenceResponse } from "@/features/workout/model/inference-protocol";

describe("isInferenceResponse", () => {
  it("accepts every response variant the worker sends", () => {
    expect(isInferenceResponse({ type: "ready" })).toBe(true);
    expect(isInferenceResponse({ message: "no webgpu", type: "init-failed" })).toBe(true);
    expect(isInferenceResponse({ event: { pose: null, type: "pose" }, type: "event" })).toBe(true);
    expect(isInferenceResponse({ type: "frame-done" })).toBe(true);
  });

  it("rejects anything that is not a tagged response object", () => {
    expect(isInferenceResponse(null)).toBe(false);
    expect(isInferenceResponse("ready")).toBe(false);
    expect(isInferenceResponse({})).toBe(false);
    expect(isInferenceResponse({ type: "something-else" })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/inference-protocol.test.ts`
Expected: FAIL — cannot resolve `@/features/workout/model/inference-protocol`.

- [ ] **Step 3: Write the protocol module**

Create `src/features/workout/model/inference-protocol.ts`:

```ts
/**
 * The wire between WorkerMotionEngine (main thread) and inference.worker.ts.
 *
 * Design notes:
 * - Responses carry the existing MotionEngineEvent union rather than a new one,
 *   so the UI layer is unaware a worker exists.
 * - `frame-done` is the backpressure signal. The main thread keeps exactly one
 *   frame in flight: it does not grab another until the worker acknowledges the
 *   previous one. Without this a slow device queues frames until it dies.
 * - ImageBitmap is transferable, so a frame costs no copy.
 */

import type { MotionEngineEvent, SetTelemetry } from "@/features/workout/domain/motion-engine";
import type { MotionSpec } from "@/features/workout/model/live-session.types";

/** What the worker is doing with incoming frames. */
export type InferenceMode = "idle" | "calibration" | "set";

export type InferenceRequest =
  /** Load the models. `wasmPaths` is where the ORT runtime lives (Task 3). */
  | { type: "init"; spec: MotionSpec; wasmPaths: string }
  | { type: "mode"; mode: InferenceMode }
  | { type: "frame"; bitmap: ImageBitmap }
  /** Stop tracking and reply with a `telemetry` response. */
  | { type: "stop-set" }
  | { type: "dispose" };

export type InferenceResponse =
  | { type: "ready" }
  | { type: "init-failed"; message: string }
  | { type: "event"; event: MotionEngineEvent }
  | { type: "frame-done" }
  | { type: "telemetry"; telemetry: SetTelemetry };

const RESPONSE_TYPES = new Set(["ready", "init-failed", "event", "frame-done", "telemetry"]);

/** Guards `onmessage`, which is typed `any` and reachable from any origin. */
export function isInferenceResponse(value: unknown): value is InferenceResponse {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === "string" && RESPONSE_TYPES.has(type);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/unit/inference-protocol.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write the bitmap sampler**

Create `src/features/workout/domain/bitmap-sampler.ts`:

```ts
/**
 * FrameSampler's twin for the worker side.
 *
 * FrameSampler pulls from an <video> through a DOM canvas; this pulls from a
 * transferred ImageBitmap through an OffscreenCanvas. Both use letterboxLayout,
 * so a keypoint decoded here maps back to source pixels with toSourceCoords
 * exactly as it did on the main thread.
 *
 * The expensive part — getImageData, which forces a GPU readback — happens here
 * rather than on the main thread. That is the whole point of the move.
 */

import {
  type LetterboxedFrame,
  letterboxLayout,
} from "@/features/workout/domain/frame-sampler";

export class BitmapSampler {
  private canvas: OffscreenCanvas;
  private context: OffscreenCanvasRenderingContext2D | null;

  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {
    this.canvas = new OffscreenCanvas(width, height);
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
  }

  /** Closes `bitmap` before returning — the caller must not reuse it. */
  grab(bitmap: ImageBitmap): LetterboxedFrame | null {
    const context = this.context;
    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;
    if (!context || sourceWidth === 0 || sourceHeight === 0) {
      bitmap.close();
      return null;
    }

    const { drawHeight, drawWidth, padX, padY, scale } = letterboxLayout(
      sourceWidth,
      sourceHeight,
      this.width,
      this.height,
    );

    context.fillStyle = "#000";
    context.fillRect(0, 0, this.width, this.height);
    context.drawImage(bitmap, padX, padY, drawWidth, drawHeight);
    bitmap.close();

    return {
      data: context.getImageData(0, 0, this.width, this.height),
      padX,
      padY,
      scale,
      sourceHeight,
      sourceWidth,
    };
  }

  dispose(): void {
    this.context = null;
  }
}
```

- [ ] **Step 6: Write the worker**

Create `src/features/workout/model/inference.worker.ts`. This is the body of `OnnxMotionEngine` with the rAF loop removed — the main thread drives the cadence now, one frame at a time.

```ts
/// <reference lib="webworker" />

/**
 * Pose inference, off the main thread.
 *
 * Everything that used to run inside OnnxMotionEngine's requestAnimationFrame
 * loop lives here: model loading, tensor packing, ORT inference, keypoint
 * decoding, rule evaluation and set accumulation. The main thread now only
 * grabs an ImageBitmap and posts it; the UI thread never touches a pixel.
 *
 * There is no rAF loop in here on purpose. The main thread sends one frame,
 * waits for `frame-done`, then sends the next (see inference-protocol.ts). That
 * bounds the queue at one frame on any device, however slow.
 *
 * Constraint-02: pixels never leave this worker. Only keypoints are posted back.
 */

import { BitmapSampler } from "@/features/workout/domain/bitmap-sampler";
import { meanBrightness, toSourceCoords } from "@/features/workout/domain/frame-sampler";
import type { LetterboxedFrame } from "@/features/workout/domain/frame-sampler";
import type { MotionEngineEvent } from "@/features/workout/domain/motion-engine";
import {
  decodeHeatmap,
  decodeSimcc,
  MODEL_IO,
  normaliseFrame,
} from "@/features/workout/domain/onnx-decode";
import {
  angleOfJoints,
  calibrationDistance,
  calibrationHint,
  calibrationLighting,
  evaluateRules,
  isPoseUsable,
  KEYPOINT_NAMES,
  type Keypoint,
  type Pose,
  romPercent,
} from "@/features/workout/domain/pose-metrics";
import {
  type Accumulator,
  feedCounter,
  freshAccumulator,
  summarise,
} from "@/features/workout/domain/set-telemetry";
import type {
  InferenceMode,
  InferenceRequest,
  InferenceResponse,
} from "@/features/workout/model/inference-protocol";
import type { MotionSpec } from "@/features/workout/model/live-session.types";

type OrtModule = typeof import("onnxruntime-web");
type OrtSession = Awaited<ReturnType<OrtModule["InferenceSession"]["create"]>>;

/** Models are tens of MB — cache them so a set never waits on a re-download. */
const MODEL_CACHE = "fitai-motion-models-v1";

/** ~2s of darkness at 30fps hands the set to manual logging (ux-flow-spec §5.3). */
const DARK_FRAME_LIMIT = 60;

const scope = self as unknown as DedicatedWorkerGlobalScope;

let ort: OrtModule | null = null;
let poseSession: OrtSession | null = null;
let detectorSession: OrtSession | null = null;
let sampler: BitmapSampler | null = null;
let spec: MotionSpec | null = null;
let mode: InferenceMode = "idle";
let accumulator: Accumulator = freshAccumulator();
let darkFrames = 0;

function post(response: InferenceResponse): void {
  scope.postMessage(response);
}

function emit(event: MotionEngineEvent): void {
  post({ event, type: "event" });
}

async function fetchModel(url: string): Promise<ArrayBuffer> {
  if (typeof caches !== "undefined") {
    try {
      const cache = await caches.open(MODEL_CACHE);
      const hit = await cache.match(url);
      if (hit) return await hit.arrayBuffer();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Model fetch failed: ${response.status}`);
      await cache.put(url, response.clone());
      return await response.arrayBuffer();
    } catch {
      // Fall through to a plain fetch (private mode, quota, opaque response).
    }
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Model fetch failed: ${response.status}`);
  return await response.arrayBuffer();
}

/** WebGPU when the device offers it, WASM otherwise. */
function executionProviders(): string[] {
  return "gpu" in navigator ? ["webgpu", "wasm"] : ["wasm"];
}

async function init(next: MotionSpec, wasmPaths: string): Promise<void> {
  spec = next;
  ort = await import("onnxruntime-web");
  ort.env.wasm.wasmPaths = wasmPaths;
  // Single-threaded: the app does not set COOP/COEP, so SharedArrayBuffer — and
  // therefore WASM threading — is unavailable. Asking for more threads than the
  // environment allows makes ORT warn on every session create.
  ort.env.wasm.numThreads = 1;

  const options = { executionProviders: executionProviders() };
  const [poseModel, detectorModel] = await Promise.all([
    fetchModel(next.onnxSkeletonUrl),
    fetchModel(next.onnxDetectorUrl).catch(() => null),
  ]);

  poseSession = await ort.InferenceSession.create(poseModel, options);
  // The detector is optional: without it the pose model runs on the whole frame,
  // which is fine while the athlete fills most of it (Assumption-01).
  //
  // TODO(model): once the detector export is published, run it here and crop to
  // its box before the pose pass. The session is loaded and released already; the
  // only missing piece is the box → crop wiring in inferPose.
  if (detectorModel) {
    detectorSession = await ort.InferenceSession.create(detectorModel, options).catch(() => null);
  }
  sampler = new BitmapSampler(MODEL_IO.inputWidth, MODEL_IO.inputHeight);
}

async function inferPose(frame: LetterboxedFrame): Promise<Pose | null> {
  if (!ort || !poseSession) return null;

  const input = normaliseFrame(frame);
  const tensor = new ort.Tensor("float32", input, [
    1,
    3,
    MODEL_IO.inputHeight,
    MODEL_IO.inputWidth,
  ]);
  const output = await poseSession.run({ [MODEL_IO.poseInputName]: tensor });

  const [xName, yName] = MODEL_IO.poseOutputNames;
  const simccX = xName ? output[xName] : undefined;
  const simccY = yName ? output[yName] : undefined;

  let decoded: Array<{ x: number; y: number; score: number }>;
  if (simccX && simccY) {
    decoded = decodeSimcc(
      simccX.data as Float32Array,
      simccY.data as Float32Array,
      KEYPOINT_NAMES.length,
    );
  } else {
    // Heatmap export: [1, K, H, W].
    const single = Object.values(output)[0];
    if (!single) return null;
    const dims = single.dims;
    const mapHeight = Number(dims[2] ?? 64);
    const mapWidth = Number(dims[3] ?? 48);
    decoded = decodeHeatmap(
      single.data as Float32Array,
      KEYPOINT_NAMES.length,
      mapWidth,
      mapHeight,
      MODEL_IO.inputWidth / mapWidth,
      MODEL_IO.inputHeight / mapHeight,
    );
  }

  const keypoints: Keypoint[] = decoded.map((point) => {
    const mapped = toSourceCoords(point.x, point.y, frame);
    return { score: point.score, x: mapped.x, y: mapped.y };
  });
  const score = keypoints.reduce((total, point) => total + point.score, 0) / keypoints.length;
  return { keypoints, score };
}

async function runCalibration(frame: LetterboxedFrame): Promise<void> {
  const lighting = calibrationLighting(meanBrightness(frame.data));
  const pose = lighting === "ok" ? await inferPose(frame).catch(() => null) : null;
  const distance = pose ? calibrationDistance(pose, frame.sourceHeight) : ("unknown" as const);
  emit({ pose, type: "pose" });
  emit({
    distance,
    hint: calibrationHint(distance, lighting),
    lighting,
    ready: lighting === "ok" && distance === "ok",
    type: "calibration",
  });
}

async function runSetFrame(frame: LetterboxedFrame): Promise<void> {
  if (!spec) return;
  accumulator.totalFrames += 1;

  if (calibrationLighting(meanBrightness(frame.data)) === "low") {
    darkFrames += 1;
    if (darkFrames > DARK_FRAME_LIMIT) {
      mode = "idle";
      emit({ reason: "low-light", type: "fallback" });
    }
    return;
  }

  darkFrames = 0;
  const pose = await inferPose(frame).catch(() => null);
  emit({ pose, type: "pose" });
  if (!pose || !isPoseUsable(pose)) return;

  accumulator.validFrames += 1;

  for (const code of evaluateRules(spec.rules, pose)) {
    accumulator.errorCodes.push(code);
    accumulator.pendingErrors.add(code);
    const rule = spec.rules.find((entry) => entry.code === code);
    if (rule) {
      emit({ code, message: rule.message, severity: rule.severity, type: "form-error" });
    }
  }

  const angle = angleOfJoints(pose, spec.romRange.joints);
  if (angle !== null) {
    const tick = feedCounter(accumulator, romPercent(angle, spec.romRange));
    if (tick) emit(tick);
  }
}

function dispose(): void {
  mode = "idle";
  sampler?.dispose();
  sampler = null;
  void poseSession?.release?.();
  void detectorSession?.release?.();
  poseSession = null;
  detectorSession = null;
}

scope.onmessage = async (message: MessageEvent<InferenceRequest>) => {
  const request = message.data;
  switch (request.type) {
    case "init":
      try {
        await init(request.spec, request.wasmPaths);
        post({ type: "ready" });
      } catch (cause) {
        post({
          message: cause instanceof Error ? cause.message : "Pose model unavailable",
          type: "init-failed",
        });
      }
      return;

    case "mode":
      mode = request.mode;
      if (request.mode === "set") {
        accumulator = freshAccumulator();
        darkFrames = 0;
      }
      return;

    case "frame": {
      const frame = sampler?.grab(request.bitmap) ?? null;
      if (frame) {
        if (mode === "calibration") await runCalibration(frame);
        else if (mode === "set") await runSetFrame(frame);
      } else {
        // grab() already closed the bitmap; nothing to release here.
        request.bitmap.close?.();
      }
      // Always acknowledge, including on the error paths above — the main thread
      // is blocked on this and would otherwise stop sending frames entirely.
      post({ type: "frame-done" });
      return;
    }

    case "stop-set":
      mode = "idle";
      post({ telemetry: summarise(accumulator), type: "telemetry" });
      return;

    case "dispose":
      dispose();
      return;
  }
};
```

- [ ] **Step 7: Typecheck**

Run: `pnpm run typecheck`
Expected: clean. If `OffscreenCanvas` or `DedicatedWorkerGlobalScope` are unresolved, add `"webworker"` to `compilerOptions.lib` in `tsconfig.json` alongside the existing entries — do not remove `"dom"`.

- [ ] **Step 8: Lint, format, commit**

```bash
pnpm exec oxlint src/features/workout/model/inference-protocol.ts src/features/workout/model/inference.worker.ts src/features/workout/domain/bitmap-sampler.ts tests/unit/inference-protocol.test.ts
pnpm exec oxfmt src/features/workout/model/inference-protocol.ts src/features/workout/model/inference.worker.ts src/features/workout/domain/bitmap-sampler.ts tests/unit/inference-protocol.test.ts
git add src/features/workout/model/inference-protocol.ts src/features/workout/model/inference.worker.ts src/features/workout/domain/bitmap-sampler.ts tests/unit/inference-protocol.test.ts
git commit -m "[AI] feat: add ONNX inference worker with one-frame-in-flight protocol"
```

---

## Task 5: `WorkerMotionEngine` — swap it in and delete the old engine

**Files:**
- Create: `src/features/workout/domain/worker-motion-engine.ts`
- Delete: `src/features/workout/domain/onnx-motion-engine.ts`
- Modify: `src/features/workout/domain/motion-engine.ts` (`stopSet` becomes async)
- Modify: `src/features/workout/domain/simulated-motion-engine.ts` (`stopSet` becomes async)
- Modify: `src/features/workout/domain/resolve-motion-engine.ts`
- Modify: `src/features/workout/model/use-motion-engine.ts` (`stopSet` becomes async)

**Interfaces:**
- Consumes: `InferenceRequest`/`InferenceResponse`/`isInferenceResponse` (Task 4), `FrameSampler`'s host video element, `MotionEngine` (modified below).
- Produces: `class WorkerMotionEngine implements MotionEngine` with `readonly kind = "onnx"`. `resolveMotionEngine` returns it in place of `OnnxMotionEngine`; no UI file changes.

- [ ] **Step 1: Make `stopSet` async in the interface**

In `src/features/workout/domain/motion-engine.ts`, change the interface member:

```ts
  /** Stop tracking and return what the set produced. */
  stopSet(): Promise<SetTelemetry>;
```

and `ManualMotionEngine`:

```ts
  async stopSet(): Promise<SetTelemetry> {
    return EMPTY_TELEMETRY;
  }
```

Add a note above the interface member:

```ts
  /**
   * Async because the ONNX engine's accumulator lives in a worker — the answer
   * is one postMessage round trip away.
   */
```

- [ ] **Step 2: Make `SimulatedMotionEngine.stopSet` async**

In `src/features/workout/domain/simulated-motion-engine.ts`, change its `stopSet(): SetTelemetry {` signature to `async stopSet(): Promise<SetTelemetry> {`. The body is unchanged.

- [ ] **Step 3: Run typecheck to see what breaks**

Run: `pnpm run typecheck`
Expected: errors in `onnx-motion-engine.ts` (deleted in Step 5) and `use-motion-engine.ts:134`. Nothing else — `stopSet` has no other caller.

- [ ] **Step 4: Write `WorkerMotionEngine`**

Create `src/features/workout/domain/worker-motion-engine.ts`:

```ts
/**
 * The main-thread half of pose tracking.
 *
 * Replaces OnnxMotionEngine, whose inference ran inside a requestAnimationFrame
 * loop and blocked the UI thread for the duration of every frame. This class does
 * only two cheap things per frame — createImageBitmap (async, GPU-side) and
 * postMessage of a transferable — and lets inference.worker.ts do the rest.
 *
 * Backpressure: exactly one frame is in flight. `pending` gates the rAF loop, so
 * a device that infers at 8fps sends 8 frames a second rather than queueing 60.
 *
 * The engine falls back by rejecting `prepare()`. useMotionEngine already catches
 * that and resolves a manual engine instead, so a device without OffscreenCanvas
 * or Worker support degrades to hand logging rather than a blank screen.
 */

import {
  EMPTY_TELEMETRY,
  type MotionEngine,
  type MotionEngineContext,
  type MotionEventHandler,
  type SetTelemetry,
} from "@/features/workout/domain/motion-engine";
import {
  type InferenceRequest,
  isInferenceResponse,
} from "@/features/workout/model/inference-protocol";

/** Where scripts/copy-ort-assets.mjs puts the ORT runtime. */
const WASM_PATHS = "/ort/";

export function supportsInferenceWorker(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap === "function"
  );
}

export class WorkerMotionEngine implements MotionEngine {
  readonly kind = "onnx" as const;

  private worker: Worker | null = null;
  private video: HTMLVideoElement | null = null;
  private onEvent: MotionEventHandler | null = null;

  private rafId: number | null = null;
  /** True while the worker still owes us a `frame-done`. */
  private pending = false;
  private telemetryResolve: ((telemetry: SetTelemetry) => void) | null = null;

  async prepare(context: MotionEngineContext): Promise<void> {
    if (!context.video) throw new Error("WorkerMotionEngine needs a video element");
    if (!context.spec) throw new Error("WorkerMotionEngine needs a motion specification");
    if (!supportsInferenceWorker()) throw new Error("This browser cannot run pose tracking");

    this.video = context.video;
    const worker = new Worker(
      new URL("@/features/workout/model/inference.worker.ts", import.meta.url),
      { name: "fitai-inference", type: "module" },
    );
    this.worker = worker;

    await new Promise<void>((resolve, reject) => {
      const settle = (error?: string) => {
        worker.removeEventListener("message", onMessage);
        worker.removeEventListener("error", onError);
        if (error) {
          // prepare() rejects here and the caller never gets a handle to this
          // engine, so nothing would ever call dispose() — tear the worker down
          // now or a failed model load leaks a thread per attempt.
          worker.terminate();
          this.worker = null;
          reject(new Error(error));
        } else {
          resolve();
        }
      };
      const onMessage = (message: MessageEvent) => {
        if (!isInferenceResponse(message.data)) return;
        if (message.data.type === "ready") settle();
        if (message.data.type === "init-failed") settle(message.data.message);
      };
      const onError = () => settle("Pose worker failed to start");

      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", onError);
      this.send({ spec: context.spec!, type: "init", wasmPaths: WASM_PATHS });
    });

    // Only now attach the long-lived listener, so the init handshake above is
    // not competing with it for the `ready` message.
    worker.addEventListener("message", this.handleMessage);
  }

  startCalibration(onEvent: MotionEventHandler): void {
    this.onEvent = onEvent;
    this.send({ mode: "calibration", type: "mode" });
    this.startLoop();
  }

  stopCalibration(): void {
    this.stopLoop();
    this.send({ mode: "idle", type: "mode" });
  }

  startSet(onEvent: MotionEventHandler): void {
    this.onEvent = onEvent;
    this.send({ mode: "set", type: "mode" });
    this.startLoop();
  }

  async stopSet(): Promise<SetTelemetry> {
    this.stopLoop();
    if (!this.worker) return EMPTY_TELEMETRY;
    return await new Promise<SetTelemetry>((resolve) => {
      this.telemetryResolve = resolve;
      this.send({ type: "stop-set" });
      // A worker that has died would hang the set review forever.
      window.setTimeout(() => {
        if (this.telemetryResolve) {
          this.telemetryResolve = null;
          resolve(EMPTY_TELEMETRY);
        }
      }, 2000);
    });
  }

  dispose(): void {
    this.stopLoop();
    this.send({ type: "dispose" });
    this.worker?.removeEventListener("message", this.handleMessage);
    this.worker?.terminate();
    this.worker = null;
    this.video = null;
    this.onEvent = null;
    this.telemetryResolve = null;
  }

  private handleMessage = (message: MessageEvent): void => {
    if (!isInferenceResponse(message.data)) return;
    const response = message.data;
    switch (response.type) {
      case "event":
        this.onEvent?.(response.event);
        break;
      case "frame-done":
        this.pending = false;
        break;
      case "telemetry":
        this.telemetryResolve?.(response.telemetry);
        this.telemetryResolve = null;
        break;
      default:
        break;
    }
  };

  private send(request: InferenceRequest): void {
    if (request.type === "frame") this.worker?.postMessage(request, [request.bitmap]);
    else this.worker?.postMessage(request);
  }

  private startLoop(): void {
    this.stopLoop();
    this.pending = false;
    const loop = () => {
      const video = this.video;
      if (!this.pending && video && video.videoWidth > 0 && video.videoHeight > 0) {
        this.pending = true;
        createImageBitmap(video).then(
          (bitmap) => this.send({ bitmap, type: "frame" }),
          () => {
            this.pending = false;
          },
        );
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pending = false;
  }
}
```

- [ ] **Step 5: Point `resolveMotionEngine` at it and delete the old engine**

In `src/features/workout/domain/resolve-motion-engine.ts`, replace the `OnnxMotionEngine` import with:

```ts
import { WorkerMotionEngine } from "@/features/workout/domain/worker-motion-engine";
```

and the return:

```ts
  if (await isReachable(spec.onnxSkeletonUrl)) return new WorkerMotionEngine();
```

Update the doc comment's first branch to read `models reachable → WorkerMotionEngine (mmpose inference in a worker)`.

Then delete the replaced file:

```bash
git rm src/features/workout/domain/onnx-motion-engine.ts
```

- [ ] **Step 6: Make the `use-motion-engine` wrapper async**

In `src/features/workout/model/use-motion-engine.ts`, replace the `stopSet` callback:

```ts
  const stopSet = useCallback(async (): Promise<SetTelemetry> => {
    return (await engineRef.current?.stopSet()) ?? EMPTY_TELEMETRY;
  }, []);
```

- [ ] **Step 7: Verify the whole suite**

```bash
pnpm run typecheck
pnpm test
pnpm run lint
```

Expected: typecheck clean, all Vitest suites pass, lint clean. If typecheck complains that `onnx-motion-engine` is still imported somewhere, run `grep -rn "onnx-motion-engine" src tests` and fix the caller.

- [ ] **Step 8: Verify in the browser**

```bash
pnpm run dev
```

Open a live workout route with an AI-supported exercise. In DevTools:
- **Sources → Threads** shows a `fitai-inference` worker.
- **Network** shows `/ort/ort-wasm-simd-threaded*` requests, not CDN ones.
- **Performance**, recorded for 5s during calibration: the main thread has no long tasks from inference; the worker thread does the work.
- **Application → Cache Storage** contains `fitai-motion-models-v1` after the first load.

Locally the models are absent, so `resolveMotionEngine` returns `SimulatedMotionEngine` and the worker never starts. To exercise the real path, drop a `.onnx` file at `public/models/rtmpose-17kp.onnx` (the URL `get-mock-live-session.ts:264` points at) first. If no model file is available, record that this step could not be verified rather than claiming it passed.

- [ ] **Step 9: Format and commit**

```bash
pnpm exec oxfmt src/features/workout/domain/worker-motion-engine.ts src/features/workout/domain/motion-engine.ts src/features/workout/domain/simulated-motion-engine.ts src/features/workout/domain/resolve-motion-engine.ts src/features/workout/model/use-motion-engine.ts
git add src/features/workout/domain/worker-motion-engine.ts src/features/workout/domain/motion-engine.ts src/features/workout/domain/simulated-motion-engine.ts src/features/workout/domain/resolve-motion-engine.ts src/features/workout/model/use-motion-engine.ts src/features/workout/domain/onnx-motion-engine.ts
git commit -m "[AI] feat: run pose inference in a worker, replacing the main-thread ONNX engine"
```

---

# Track B — Timer Worker

## Task 6: Move the session tick into a worker

`useTicker` derives everything from `Date.now()`, so it never drifts. The problem is frequency: a backgrounded tab throttles `setInterval` to roughly once a minute, so a rest countdown that ends while the screen is off does not reach zero until the user looks again. A worker timer is not throttled the same way.

**Files:**
- Create: `src/features/workout/model/timer.worker.ts`
- Modify: `src/features/workout/model/use-session-timer.ts`
- Test: `tests/unit/use-session-timer.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `useTicker(active: boolean, intervalMs?: number): number` — signature unchanged, so `use-live-session.ts:303` needs no edit. `secondsLeft`, `elapsedSeconds`, `formatClock`, `formatCountdown` are untouched.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/use-session-timer.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  elapsedSeconds,
  formatCountdown,
  secondsLeft,
  useTicker,
} from "@/features/workout/model/use-session-timer";

describe("useTicker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a timestamp immediately, before any tick arrives", () => {
    const { result } = renderHook(() => useTicker(true));
    expect(typeof result.current).toBe("number");
    expect(result.current).toBeGreaterThan(0);
  });

  it("advances while active", () => {
    const { result } = renderHook(() => useTicker(true, 500));
    const first = result.current;
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current).toBeGreaterThanOrEqual(first);
  });

  it("does not tick while inactive", () => {
    const { result } = renderHook(() => useTicker(false, 500));
    const first = result.current;
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(first);
  });
});

describe("time helpers are unchanged by the worker move", () => {
  it("secondsLeft never goes negative", () => {
    expect(secondsLeft(1000, 5000)).toBe(0);
    expect(secondsLeft(null, 5000)).toBe(0);
    expect(secondsLeft(5000, 1000)).toBe(4);
  });

  it("elapsedSeconds floors and clamps", () => {
    expect(elapsedSeconds(1000, 4900)).toBe(3);
    expect(elapsedSeconds(5000, 1000)).toBe(0);
  });

  it("formatCountdown pads both fields", () => {
    expect(formatCountdown(65)).toBe("01:05");
    expect(formatCountdown(0)).toBe("00:00");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/use-session-timer.test.ts`
Expected: FAIL — jsdom has no `Worker`, so the hook throws once Step 3's implementation lands. Right now the "does not tick while inactive" and helper tests pass while the others may not; record whichever fail. The point of running it first is to confirm the suite exercises the hook at all.

- [ ] **Step 3: Write the timer worker**

Create `src/features/workout/model/timer.worker.ts`:

```ts
/// <reference lib="webworker" />

/**
 * A tick source that survives a backgrounded tab.
 *
 * useTicker's maths is already drift-proof — every consumer derives from
 * Date.now(), not from a tick count. What a main-thread setInterval cannot do is
 * keep *firing* once the tab is hidden or the phone screen goes off: browsers
 * throttle it to roughly once a minute, so a rest countdown finishes late and the
 * "rest over" transition waits for the user to look at the screen.
 *
 * Timers inside a Dedicated Worker are not throttled the same way, so this posts
 * a bare tick and the hook re-reads the clock on the main thread.
 */

const scope = self as unknown as DedicatedWorkerGlobalScope;

let timer: ReturnType<typeof setInterval> | null = null;

export type TimerRequest = { type: "start"; intervalMs: number } | { type: "stop" };

scope.onmessage = (message: MessageEvent<TimerRequest>) => {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  if (message.data.type === "start") {
    timer = setInterval(() => scope.postMessage({ type: "tick" }), message.data.intervalMs);
  }
};
```

- [ ] **Step 4: Rewrite `useTicker` on top of it**

In `src/features/workout/model/use-session-timer.ts`, replace the `useTicker` function (keep every other export exactly as it is):

```ts
/**
 * One ticking clock for the whole session.
 *
 * Everything time-based (set countdown, rest countdown, elapsed session time,
 * the BR-WL-01 duration thresholds) is derived from timestamps and this tick, so
 * nothing drifts when the tab is throttled or the phone sleeps.
 *
 * The tick comes from a Dedicated Worker so it keeps firing while the tab is
 * backgrounded — a main-thread setInterval is throttled to ~1/minute there, which
 * makes a rest countdown finish late. Falls back to setInterval where Worker is
 * unavailable (jsdom under test, very old browsers).
 */
export function useTicker(active: boolean, intervalMs = 500): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());

    if (typeof Worker === "undefined") {
      const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
      return () => window.clearInterval(timer);
    }

    const worker = new Worker(new URL("./timer.worker.ts", import.meta.url), {
      name: "fitai-session-timer",
      type: "module",
    });
    worker.onmessage = () => setNow(Date.now());
    worker.postMessage({ intervalMs, type: "start" });

    return () => {
      worker.postMessage({ type: "stop" });
      worker.terminate();
    };
  }, [active, intervalMs]);

  return now;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm exec vitest run tests/unit/use-session-timer.test.ts`
Expected: PASS, 6 tests. jsdom has no `Worker`, so the fallback branch is what the tests exercise — which is exactly the branch that must not regress.

- [ ] **Step 6: Verify the worker branch in a real browser**

```bash
pnpm run dev
```

Open a live workout, start a rest period, then switch to another tab for 30 seconds and come back. The countdown must show the correct remaining time *and* have transitioned out of rest if it expired. In **Sources → Threads** a `fitai-session-timer` worker is listed while the session is running and disappears when you leave the route.

- [ ] **Step 7: Full suite, lint, format, commit**

```bash
pnpm run typecheck
pnpm test
pnpm exec oxlint src/features/workout/model/timer.worker.ts src/features/workout/model/use-session-timer.ts tests/unit/use-session-timer.test.ts
pnpm exec oxfmt src/features/workout/model/timer.worker.ts src/features/workout/model/use-session-timer.ts tests/unit/use-session-timer.test.ts
git add src/features/workout/model/timer.worker.ts src/features/workout/model/use-session-timer.ts tests/unit/use-session-timer.test.ts
git commit -m "[AI] fix: drive the session tick from a worker so backgrounded rest timers keep running"
```

---

# Track C — Service Worker & FCM Push

## Task 7: Service worker, manifest, and push subscription

The backend already sends through FCM and `NotificationService.RegisterDeviceToken` is in the contract. What is missing on the web side is the Service Worker that can receive a push at all, the PWA manifest that lets iOS grant permission, and the code that mints and registers a token.

**Files:**
- Create: `public/sw.js`
- Create: `public/manifest.webmanifest`
- Create: `src/shared/push/firebase-app.ts`
- Create: `src/shared/push/use-push-registration.ts`
- Create: `src/shared/push/push-actions.ts`
- Create: `src/shared/push/enable-push-button.tsx`
- Modify: `src/app/layout.tsx` (manifest link)
- Modify: `.env.example`
- Test: `tests/unit/push-support.test.ts` (create)

**Interfaces:**
- Consumes: `createServerTransport` from `@/shared/api/server/transport`, `NotificationService` from the generated contracts.
- Produces: `pushSupport(): PushSupport` where `PushSupport = { supported: boolean; reason: string | null }`; `usePushRegistration(): { status: "idle" | "asking" | "granted" | "denied" | "unsupported"; enable: () => Promise<void> }`; `registerDeviceToken(token: string): Promise<boolean>` (Server Action).

- [ ] **Step 1: Install the dependency**

```bash
pnpm add firebase
```

Then confirm the lockfile changed and nothing else did:

```bash
git diff --stat package.json pnpm-lock.yaml
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/push-support.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

import { pushSupport } from "@/shared/push/use-push-registration";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pushSupport", () => {
  it("reports unsupported when the browser has no service worker", () => {
    // jsdom has no navigator.serviceWorker and no PushManager.
    const result = pushSupport();
    expect(result.supported).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it("reports supported when service worker, PushManager and Notification all exist", () => {
    vi.stubGlobal("PushManager", class {});
    vi.stubGlobal("Notification", { permission: "default" });
    vi.stubGlobal("navigator", { serviceWorker: {} });
    expect(pushSupport()).toEqual({ reason: null, supported: true });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/push-support.test.ts`
Expected: FAIL — cannot resolve `@/shared/push/use-push-registration`.

- [ ] **Step 4: Write the service worker**

Create `public/sw.js`:

```js
/**
 * FITAI service worker.
 *
 * Deliberately has NO `fetch` handler. Its only job is receiving push while the
 * tab is closed, which is the one thing a page cannot do for itself. Adding a
 * fetch handler here would put a caching layer between the app and every request
 * — stale assets after a deploy, swallowed RPCs — for no benefit, since the app
 * is online-first (PRODUCT.md: "Workout logging is online-first").
 *
 * Asset and model caching is done from the page via the Cache Storage API
 * directly (see inference.worker.ts), which needs no service worker at all.
 *
 * FCM delivers through the standard Web Push protocol, so the payload arrives on
 * a plain `push` event. We do not import the Firebase SW SDK: it would register a
 * second push handler and every notification would appear twice.
 */

self.addEventListener("install", () => {
  // Take over immediately rather than waiting for every old tab to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { notification: { body: event.data.text() } };
  }

  // FCM puts display fields under `notification` and custom fields under `data`.
  const notification = payload.notification ?? {};
  const data = payload.data ?? {};
  const title = notification.title ?? data.title ?? "FITAI";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: notification.body ?? data.body ?? "",
      data: { url: data.url ?? "/notifications" },
      icon: "/icons/icon-192.png",
      tag: data.tag ?? "fitai",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/notifications";

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
      // Focus an existing tab rather than opening a duplicate.
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
```

- [ ] **Step 5: Write the manifest**

Create `public/manifest.webmanifest`:

```json
{
  "name": "FITAI",
  "short_name": "FITAI",
  "description": "Adaptive four-week training roadmaps that adjust to how your sessions actually go.",
  "start_url": "/home",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Note: `public/icons/` does not exist yet. Create the three PNGs from the existing brand mark, or — if no source asset is available — create the directory with placeholder 192/512 PNGs and flag in the commit body that final icons are outstanding. A manifest pointing at missing icons makes iOS refuse the install prompt, which blocks push on iOS entirely.

- [ ] **Step 6: Link the manifest**

In `src/app/layout.tsx`, add to the exported `metadata` object:

```ts
  manifest: "/manifest.webmanifest",
```

If the file has no `metadata` export, add the link inside the existing `<head>` instead. Do not restructure the layout.

- [ ] **Step 7: Add the env vars**

Append to `.env.example`:

```
# Firebase Web app config, from Firebase console → Project settings → Your apps.
# All NEXT_PUBLIC_ because the Messaging SDK runs in the browser; these are not secrets.
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
# Cloud Messaging → Web Push certificates → key pair.
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

Add the same keys with real values to `.env.local` if the Firebase project details are available; if not, leave `.env.local` alone and note that push cannot be verified end-to-end yet.

- [ ] **Step 8: Write the Firebase app initialiser**

Create `src/shared/push/firebase-app.ts`:

```ts
"use client";

import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

/**
 * Lazily initialised Firebase app, for Cloud Messaging only.
 *
 * Nothing else in FITAI uses Firebase — auth and data go through the ConnectRPC
 * BFF. Keep it that way: this module exists so the FCM registration token can be
 * minted, and the token is then handed to our own backend.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export function isFirebaseConfigured(): boolean {
  return Object.values(config).every((value) => typeof value === "string" && value.length > 0);
}

function app(): FirebaseApp {
  return getApps()[0] ?? initializeApp(config);
}

/** Null when the browser cannot do FCM (Safari without install, private mode). */
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (!isFirebaseConfigured()) return null;
  if (!(await isSupported())) return null;
  return getMessaging(app());
}
```

- [ ] **Step 9: Write the Server Action**

Create `src/shared/push/push-actions.ts`:

```ts
"use server";

import { createClient } from "@connectrpc/connect";
import { cookies } from "next/headers";

import { NotificationService } from "@/shared/api/gen/contracts/generic/notification/v1/service/notification_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";

/**
 * Hands an FCM registration token to the backend so the Go notification service
 * can push to this browser.
 *
 * Runs server-side because that is where the access token cookie is readable —
 * the same shape as workout-actions.ts.
 */
export async function registerDeviceToken(deviceToken: string): Promise<boolean> {
  if (!deviceToken) return false;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fitai_access_token")?.value;
  if (!accessToken) return false;

  try {
    const client = createClient(NotificationService, createServerTransport(accessToken));
    const response = await client.registerDeviceToken({
      deviceToken,
      deviceType: "WEB",
      // TODO: the backend derives the user from the bearer token; this field is
      // required by the contract. Matches the `userId: "TODO"` seam already in
      // workout-actions.ts — resolve both together when a /me lookup exists.
      userId: "",
    });
    return response.success;
  } catch {
    // A failed registration must never block the UI: the user simply does not
    // get push until the next attempt.
    return false;
  }
}
```

- [ ] **Step 10: Write the registration hook**

Create `src/shared/push/use-push-registration.ts`:

```ts
"use client";

import { getToken } from "firebase/messaging";
import { useCallback, useEffect, useState } from "react";

import { getMessagingIfSupported } from "@/shared/push/firebase-app";
import { registerDeviceToken } from "@/shared/push/push-actions";

export type PushSupport = { supported: boolean; reason: string | null };

/**
 * Why push is or is not possible here. Split out from the hook so it is testable
 * without React and so the UI can explain the "add to home screen first" case,
 * which is the only way iOS Safari grants notification permission.
 */
export function pushSupport(): PushSupport {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return { reason: "This browser does not support background notifications.", supported: false };
  }
  if (typeof PushManager === "undefined") {
    return { reason: "This browser does not support push messages.", supported: false };
  }
  if (typeof Notification === "undefined") {
    return { reason: "This browser does not support notifications.", supported: false };
  }
  return { reason: null, supported: true };
}

export type PushStatus = "idle" | "asking" | "granted" | "denied" | "unsupported";

export function usePushRegistration() {
  const [status, setStatus] = useState<PushStatus>("idle");

  useEffect(() => {
    if (!pushSupport().supported) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") setStatus("granted");
    if (Notification.permission === "denied") setStatus("denied");
  }, []);

  const enable = useCallback(async () => {
    if (!pushSupport().supported) {
      setStatus("unsupported");
      return;
    }
    setStatus("asking");

    // Must be called from a user gesture — browsers reject a bare prompt.
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }

    const messaging = await getMessagingIfSupported();
    if (!messaging) {
      setStatus("unsupported");
      return;
    }

    // Register our own SW and hand it to FCM, rather than letting the SDK look
    // for /firebase-messaging-sw.js. One service worker, one push handler.
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    }).catch(() => null);

    if (!token) {
      setStatus("denied");
      return;
    }

    await registerDeviceToken(token);
    setStatus("granted");
  }, []);

  return { enable, status };
}
```

- [ ] **Step 11: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/unit/push-support.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 12: Write the opt-in button**

Create `src/shared/push/enable-push-button.tsx`:

```tsx
"use client";

import { usePushRegistration } from "@/shared/push/use-push-registration";

/**
 * The user gesture that push permission requires. Never auto-prompt: an unasked
 * permission dialog is the fastest way to a permanent "denied", which cannot be
 * undone from the page.
 */
export function EnablePushButton() {
  const { enable, status } = usePushRegistration();

  if (status === "granted") return null;
  if (status === "unsupported") {
    return (
      <p className="push-optin__note">
        Add FITAI to your home screen to get session reminders.
      </p>
    );
  }
  if (status === "denied") {
    return (
      <p className="push-optin__note">
        Notifications are blocked. Enable them for this site in your browser settings.
      </p>
    );
  }

  return (
    <button
      className="button button--secondary"
      disabled={status === "asking"}
      onClick={() => void enable()}
      type="button"
    >
      {status === "asking" ? "Enabling…" : "Turn on reminders"}
    </button>
  );
}
```

Then render it on the notifications page. In `src/app/(focused)/notifications/page.tsx`, import it and place it directly under the `<h1 className="page-hero__title">Notifications</h1>` line. Match the surrounding markup style — that file uses hand-written CSS classes from `globals.css`, so add a `.push-optin__note` rule near the `.notification-list` block in `src/app/globals.css` using the existing muted-text token rather than a literal colour.

- [ ] **Step 13: Verify in the browser**

```bash
pnpm run build && pnpm run start
```

Service workers need a secure context; `localhost` counts. Then:
- **Application → Manifest** shows FITAI with no icon errors.
- Click "Turn on reminders" → permission prompt appears → **Application → Service Workers** lists `/sw.js` as activated and running.
- Send a test message from Firebase console → Cloud Messaging → "Send test message", pasting the token (log it temporarily in `usePushRegistration` if needed, then remove the log). The notification appears with the tab closed, and clicking it opens `/notifications`.

If Firebase project credentials are not available, stop after the manifest and service-worker registration checks and state plainly that end-to-end push delivery is unverified.

- [ ] **Step 14: Full suite, lint, format, commit**

```bash
pnpm run typecheck
pnpm test
pnpm run lint
pnpm exec oxfmt src/shared/push src/app/\(focused\)/notifications/page.tsx tests/unit/push-support.test.ts
git add public/sw.js public/manifest.webmanifest public/icons src/shared/push src/app/layout.tsx "src/app/(focused)/notifications/page.tsx" src/app/globals.css .env.example package.json pnpm-lock.yaml tests/unit/push-support.test.ts
git commit -m "[AI] feat: add service worker and FCM push registration"
```

---

## Task 8: Final verification

- [ ] **Step 1: Clean build from scratch**

```bash
rm -rf .next
pnpm run build
```

Expected: build succeeds. Both workers appear as separate chunks in the build output.

- [ ] **Step 2: Full check**

```bash
pnpm run typecheck && pnpm test && pnpm run lint && pnpm run test:e2e
```

Expected: all green. `tests/e2e/live-workout-layout.spec.ts` and `core-flow.spec.ts` cover the live route, so a regression from the engine swap surfaces here.

- [ ] **Step 3: Confirm no stray references**

```bash
grep -rn "onnx-motion-engine" src tests
grep -rn "window.setInterval" src/features/workout
```

Expected: no results for the first. The second returns only the ducking ramp in `use-audio-coach.ts`, which is out of scope.

- [ ] **Step 4: Review the diff and report**

```bash
git log --oneline main..HEAD
git diff main...HEAD --stat
```

Present the diff to the user for approval before any push. Per the repo's git rules: request approval, then push to `feat/web-workers-and-push` only, never to `main`.

---

## Open Items For The User

These are outside the plan's control and must be resolved before the affected task can be fully verified:

1. **Firebase project credentials** — Task 7 Steps 7 and 13 need the web app config and a VAPID key from the Firebase console.
2. **PWA icons** — Task 7 Step 5 needs 192px, 512px and 512px-maskable PNGs. Without them iOS will not offer "Add to Home Screen", and iOS grants push permission only to installed PWAs.
3. **`userId` on `RegisterDeviceToken`** — the contract requires it but the codebase has no user-id resolution (`workout-actions.ts` carries the same `userId: "TODO"` seam). Confirm with the backend whether the bearer token is authoritative and the field can be empty.
4. **A real `.onnx` export** — Task 5 Step 8 can only exercise the simulated engine until a model file exists at the URL `get-mock-live-session.ts` points at. The three `TODO(model)` seams in `onnx-decode.ts` also stay unresolved until then.
