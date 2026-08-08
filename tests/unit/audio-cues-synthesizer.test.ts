import { beforeEach, describe, expect, it, vi } from '@jest/globals';


import { playSyntheticCueTone } from "@/features/workout/domain/audio-cues";

describe("audio Cues Web Audio Synthesizer Fallback", () => {
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
