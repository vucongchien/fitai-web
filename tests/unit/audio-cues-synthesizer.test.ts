import { describe, expect, it, vi, beforeEach } from "vitest";

import { playSyntheticCueTone } from "@/features/workout/domain/audio-cues";

describe("Audio Cues Web Audio Synthesizer Fallback", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("safely executes tone generation without crashing in mock browser environment", () => {
    // In vitest jsdom environment without full Web Audio API, it catches gracefully
    expect(() => {
      playSyntheticCueTone("start");
      playSyntheticCueTone("good");
      playSyntheticCueTone("warning");
      playSyntheticCueTone("end");
    }).not.toThrow();
  });
});
