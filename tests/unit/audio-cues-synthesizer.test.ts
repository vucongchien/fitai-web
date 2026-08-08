import { beforeEach, describe, expect, it, vi } from "vitest";


import { playSyntheticCueTone, speakText } from "@/features/workout/domain/audio-cues";

describe("audio Cues Web Audio & SpeechSynthesizer Fallback", () => {
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

  it("safely executes text to speech without crashing in mock browser environment", () => {
    expect(() => {
      speakText("Bắt đầu bài tập squat");
    }).not.toThrow();
  });
});
