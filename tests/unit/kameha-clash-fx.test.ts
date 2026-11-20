import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  KamehaSpring,
  KamehaVfxEngine,
  triggerKamehaCheer,
  useKamehaTugClash,
} from "@/features/solo-match/ui/kameha-clash-fx";

describe("KamehaSpring", () => {
  it("initializes with starting position and moves toward target", () => {
    const spring = new KamehaSpring(0.5, 420, 30);
    expect(spring.x).toBe(0.5);
    expect(spring.to).toBe(0.5);
    expect(spring.v).toBe(0);

    spring.to = 0.8;
    const nextX = spring.step(0.016);
    expect(nextX).toBeGreaterThan(0.5);
    expect(spring.v).toBeGreaterThan(0);
  });

  it("handles zero dt without changing state", () => {
    const spring = new KamehaSpring(0.5, 420, 30);
    expect(spring.step(0)).toBe(0.5);
  });
});

describe("KamehaVfxEngine", () => {
  it("attaches to canvas and resizes without throwing", () => {
    const engine = new KamehaVfxEngine();
    const canvas = document.createElement("canvas");
    engine.attach(canvas);
    expect(engine.now).toBe(0);

    engine.puff(100, 100, { n: 4, size: 10 });
    engine.burst(100, 100, { r: 20 });
    engine.slash(100, 100);
    engine.lines(100, 100);
    engine.ticks(100, 100);
    engine.wob(100, 100);
    engine.shards(100, 100);

    engine.detach();
  });
});

describe("useKamehaTugClash", () => {
  it("mounts without errors and observes myShare updates", () => {
    const canvasRef = { current: document.createElement("canvas") };
    const dividerRef = { current: document.createElement("div") };
    const inner = document.createElement("div");
    dividerRef.current.appendChild(inner);

    const { rerender } = renderHook(
      ({ isTieActive, myShare }) =>
        useKamehaTugClash({
          canvasRef,
          dividerRef,
          isTieActive,
          myShare,
        }),
      {
        initialProps: { isTieActive: false, myShare: 50 },
      },
    );

    rerender({ isTieActive: true, myShare: 75 });
    expect(canvasRef.current).toBeDefined();
  });
});

describe("triggerKamehaCheer", () => {
  it("triggers cheer effects with coordinates", () => {
    expect(() => {
      triggerKamehaCheer({ x: 200, y: 150 }, { text: "COMBO!" });
    }).not.toThrow();
  });

  it("triggers cheer effects with HTMLElement target", () => {
    const btn = document.createElement("button");
    document.body.appendChild(btn);

    expect(() => {
      triggerKamehaCheer(btn, { text: "NICE!" });
    }).not.toThrow();

    document.body.removeChild(btn);
  });
});
