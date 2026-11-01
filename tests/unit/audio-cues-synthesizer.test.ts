import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  detectLanguage,
  formatVietnameseRepCount,
  formatVietnameseSecond,
  mapCueToSpokenText,
  playSyntheticCueTone,
  speakText,
} from "@/features/workout/domain/audio-cues";

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

  describe("detectLanguage runtime heuristics", () => {
    it("detects Vietnamese for text containing Vietnamese diacritics", () => {
      expect(detectLanguage("Giữ thẳng lưng")).toBe("vi-VN");
      expect(detectLanguage("Hạ mông xuống một chút")).toBe("vi-VN");
      expect(detectLanguage("Một")).toBe("vi-VN");
      expect(detectLanguage("Đầu gối vượt quá mũi chân")).toBe("vi-VN");
    });

    it("detects Vietnamese for unaccented workout tokens", () => {
      expect(detectLanguage("dung thang lung")).toBe("vi-VN");
      expect(detectLanguage("siet bung lai")).toBe("vi-VN");
    });

    it("detects English for English sentences and cues", () => {
      expect(detectLanguage("Keep your back straight")).toBe("en-US");
      expect(detectLanguage("Rep 1 completed")).toBe("en-US");
      expect(detectLanguage("Start set 1 of Squat, target 10 reps")).toBe("en-US");
    });

    it("safely falls back to en-US for empty or invalid text", () => {
      expect(detectLanguage("")).toBe("en-US");
      expect(detectLanguage(null as unknown as string)).toBe("en-US");
    });
  });

  describe("mapCueToSpokenText BE mapping & translation", () => {
    it("maps technical error codes to natural coaching cues", () => {
      expect(mapCueToSpokenText("signed_hip_y_diff")).toBe(
        "Võng lưng hoặc chổng mông quá cao, hãy siết chặt cơ bụng",
      );
      expect(mapCueToSpokenText(">15cm: signed_hip_y_diff")).toBe(
        "Võng lưng hoặc chổng mông quá cao, hãy siết chặt cơ bụng",
      );
      expect(mapCueToSpokenText("ERR_KNEE_VALGUS")).toBe(
        "Đầu gối đang bị sụp vào trong, hãy mở đầu gối hướng theo mũi chân",
      );
      expect(mapCueToSpokenText("knee_over_toe")).toBe(
        "Đầu gối vượt quá mũi chân, hãy đẩy hông ra sau",
      );
    });

    it("translates common English cues to Vietnamese", () => {
      expect(mapCueToSpokenText("Keep back flat")).toBe("Giữ lưng thẳng");
      expect(mapCueToSpokenText("Chest up")).toBe("Ưỡn ngực lên");
      expect(mapCueToSpokenText("Rep completed")).toBe("Hoàn thành lần tập");
    });

    it("preserves natural Vietnamese text returned by BE as-is", () => {
      const beNaturalText = "Bạn đang tập rất tốt, hãy tiếp tục duy trì!";
      expect(mapCueToSpokenText(beNaturalText)).toBe(beNaturalText);
    });

    it("formats unknown technical codes into a legible message", () => {
      expect(mapCueToSpokenText("UNKNOWN_TORSO_FLICK")).toBe("Lỗi tư thế: unknown torso flick");
    });
  });

  describe("formatVietnameseRepCount", () => {
    it("formats count into natural Vietnamese numbers", () => {
      expect(formatVietnameseRepCount(1)).toBe("Một");
      expect(formatVietnameseRepCount(10)).toBe("Mười");
      expect(formatVietnameseSecond(5)).toBe("Năm");
    });
  });
});
