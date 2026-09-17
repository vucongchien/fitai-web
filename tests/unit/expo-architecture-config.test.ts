import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Expo Mobile Architecture Configuration", () => {
  const rootDir = path.resolve(__dirname, "../..");
  const mobileDir = path.join(rootDir, "mobile");

  it("configures pnpm-workspace.yaml to include mobile sub-package", () => {
    const workspaceYamlPath = path.join(rootDir, "pnpm-workspace.yaml");
    expect(fs.existsSync(workspaceYamlPath)).toBe(true);

    const content = fs.readFileSync(workspaceYamlPath, "utf-8");
    expect(content).toContain("packages:");
    expect(content).toMatch(/-\s*["']\.["']/);
    expect(content).toMatch(/-\s*["']mobile["']/);
  });

  it("configures mobile/package.json with Expo SDK 52 and Expo Router v4", () => {
    const pkgPath = path.join(mobileDir, "package.json");
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    expect(pkg.name).toBe("@fitai/mobile");
    expect(pkg.main).toBe("expo-router/entry");
    expect(pkg.dependencies).toBeDefined();

    // Check essential dependencies
    expect(pkg.dependencies.expo).toBeDefined();
    expect(pkg.dependencies["expo-router"]).toBeDefined();
    expect(pkg.dependencies["expo-haptics"]).toBeDefined();
    expect(pkg.dependencies["expo-keep-awake"]).toBeDefined();
    expect(pkg.dependencies["expo-secure-store"]).toBeDefined();
    expect(pkg.dependencies["react-native"]).toBeDefined();
    expect(pkg.dependencies["@connectrpc/connect"]).toBeDefined();
  });

  it("configures mobile/app.json with valid Expo manifest", () => {
    const appJsonPath = path.join(mobileDir, "app.json");
    expect(fs.existsSync(appJsonPath)).toBe(true);

    const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf-8"));
    expect(appJson.expo).toBeDefined();
    expect(appJson.expo.name).toBe("FITAI");
    expect(appJson.expo.slug).toBe("fitai");
    expect(appJson.expo.scheme).toBe("fitai");
    expect(appJson.expo.orientation).toBe("portrait");
    expect(appJson.expo.newArchEnabled).toBe(true);
    expect(appJson.expo.plugins).toContain("expo-router");
    expect(appJson.expo.ios?.bundleIdentifier).toBe("com.fitai.app");
    expect(appJson.expo.android?.package).toBe("com.fitai.app");
  });

  it("configures mobile/tsconfig.json with React Native compiler options and path aliases", () => {
    const tsconfigPath = path.join(mobileDir, "tsconfig.json");
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
    expect(tsconfig.compilerOptions?.jsx).toBe("react-native");
    expect(tsconfig.compilerOptions?.paths).toBeDefined();
    expect(tsconfig.compilerOptions.paths["@/*"]).toBeDefined();
    expect(tsconfig.compilerOptions.paths["@shared-domain/*"]).toBeDefined();
  });

  it("configures mobile/metro.config.js with monorepo watchFolders and alias mappings", () => {
    const metroConfigPath = path.join(mobileDir, "metro.config.js");
    expect(fs.existsSync(metroConfigPath)).toBe(true);

    const content = fs.readFileSync(metroConfigPath, "utf-8");
    expect(content).toContain("watchFolders");
    expect(content).toContain("workspaceRoot");
    expect(content).toContain("nodeModulesPaths");
    expect(content).toContain("extraNodeModules");
    expect(content).toContain("@shared-domain");
  });

  it("exports nativeHaptics adapter with fallback-safe execution", async () => {
    const { nativeHaptics } = await import("../../mobile/src/shared/lib/haptics");

    expect(nativeHaptics).toBeDefined();
    expect(typeof nativeHaptics.repSuccess).toBe("function");
    expect(typeof nativeHaptics.setComplete).toBe("function");
    expect(typeof nativeHaptics.formWarning).toBe("function");
    expect(typeof nativeHaptics.formDanger).toBe("function");
    expect(typeof nativeHaptics.isSupported).toBe("function");

    // In node/test environment without native expo-haptics binary, methods return false safely
    const repResult = await nativeHaptics.repSuccess();
    expect(typeof repResult).toBe("boolean");

    const setResult = await nativeHaptics.setComplete();
    expect(typeof setResult).toBe("boolean");

    const warnResult = await nativeHaptics.formWarning();
    expect(typeof warnResult).toBe("boolean");

    const dangerResult = await nativeHaptics.formDanger();
    expect(typeof dangerResult).toBe("boolean");
  });

  it("exports nativeKeepAwake adapter with fallback-safe execution", async () => {
    const { nativeKeepAwake } = await import("../../mobile/src/shared/lib/keep-awake");

    expect(nativeKeepAwake).toBeDefined();
    expect(typeof nativeKeepAwake.activate).toBe("function");
    expect(typeof nativeKeepAwake.deactivate).toBe("function");
    expect(typeof nativeKeepAwake.isSupported).toBe("function");

    // In node/test environment without native expo-keep-awake binary, methods return false safely
    const activateResult = await nativeKeepAwake.activate();
    expect(typeof activateResult).toBe("boolean");

    const deactivateResult = await nativeKeepAwake.deactivate();
    expect(typeof deactivateResult).toBe("boolean");
  });
});
