import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
      "server-only": fileURLToPath(new URL("tests/mocks/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Auto-generated protobuf files – never hand-written
        "src/shared/api/gen/**",
        // Server-only infrastructure (Firebase, OTel, push) – no browser runtime
        "src/shared/observability/**",
        "src/shared/push/**",
        // Web Workers – run in Worker context, not jsdom
        "src/**/*.worker.ts",
        // Workout model files that require native browser APIs (camera, audio, AI engines)
        "src/features/workout/model/audio-coach.ts",
        "src/features/workout/model/camera-stream.ts",
        "src/features/workout/model/workout-effects.ts",
        "src/features/workout/model/set-telemetry.ts",
        "src/features/workout/model/*-engine.ts",
        "src/features/workout/model/adhoc-workout.ts",
        // Adhoc workout UI builder – complex interactive flow, covered by e2e
        "src/features/workout/ui/*.tsx",
        // Next.js built-ins & framework files
        "src/**/*.d.ts",
        "src/instrumentation.ts",
        "src/app/**/(loading|error|not-found).{ts,tsx}",
        // Demo/fixture data – not production logic
        "src/shared/lib/demo-data.ts",
        // Server actions & route handlers – tested via e2e or dedicated unit with mocks
        "src/**/server/**",
        "src/app/api/**",
      ],
      thresholds: {
        // Baseline for the testable surface (UI + domain logic) after excluding
        // Workers, proto-gen, server infra, and browser-native-API files.
        // Increase incrementally as more tests are added.
        lines: 30,
        functions: 28,
        branches: 28,
        statements: 30,
      },
    },
  },
});
