import { describe, expect, it } from "vitest";

import {
  generateMultiavatarSvg,
  generateRandomSeed,
  svgToDataUri,
} from "@/features/auth/model/use-multiavatar";

describe("multiavatar helper", () => {
  it("generates a valid SVG string from a seed", () => {
    const svg = generateMultiavatarSvg("Nguyen An");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("xmlns");
  });

  it("handles empty or whitespace strings with a safe fallback", () => {
    const svgEmpty = generateMultiavatarSvg("");
    const svgSpace = generateMultiavatarSvg("   ");
    expect(svgEmpty).toContain("<svg");
    expect(svgSpace).toContain("<svg");
  });

  it("generates different avatars for different seeds", () => {
    const svgA = generateMultiavatarSvg("User A");
    const svgB = generateMultiavatarSvg("User B");
    expect(svgA).not.toEqual(svgB);
  });

  it("generates identical avatars for identical seeds (deterministic)", () => {
    const svg1 = generateMultiavatarSvg("Consistent User");
    const svg2 = generateMultiavatarSvg("Consistent User");
    expect(svg1).toBe(svg2);
  });

  it("converts SVG string to a safe data URI", () => {
    const svg = generateMultiavatarSvg("Test");
    const dataUri = svgToDataUri(svg);
    expect(dataUri.startsWith("data:image/svg+xml;utf8,")).toBe(true);
  });

  it("generates non-empty random seeds", () => {
    const seed1 = generateRandomSeed();
    const seed2 = generateRandomSeed();
    expect(seed1).toBeTruthy();
    expect(seed2).toBeTruthy();
    expect(seed1).not.toBe(seed2);
  });
});
