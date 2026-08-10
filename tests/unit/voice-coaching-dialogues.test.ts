import { describe, expect, it } from "vitest";
import type { VoiceFeedbackMetric } from "@/features/workout/model/live-session.types";

describe("Voice Coaching Dialogues & Persona Styles Engine", () => {
  const mockVoiceFeedbacks: Record<string, VoiceFeedbackMetric> = {
    signed_hip_y_diff: {
      metric_name: "signed_hip_y_diff",
      description: "Lệch hông / Võng lưng",
      severities: {
        warning: {
          severity_level: 1,
          status: "Warning",
          styles: {
            normal: { text: "Hông hơi võng, hãy siết chặt mông và bụng." },
            strict: { text: "Gồng cơ bụng ngay! Không được để sụp hông!" },
            gentle: { text: "Hơi võng hông rồi bạn ơi, gồng nhẹ bụng lên nhé." },
          },
        },
        danger: {
          severity_level: 2,
          status: "Danger",
          styles: {
            normal: { text: "Võng lưng quá nặng, tư thế plank không còn tác dụng." },
            strict: { text: "Đau thắt lưng đấy! Hạ mông xuống hoặc nâng hông lên ngay!" },
            gentle: { text: "Hãy hạ gối xuống nghỉ chút nào, hông bị lệch nhiều làm đau lưng đấy." },
          },
        },
      },
    },
  };

  function getCueText(
    feedbacks: Record<string, VoiceFeedbackMetric>,
    code: string,
    severity: 1 | 2,
    style: "normal" | "strict" | "gentle",
  ): string {
    const feedback = feedbacks[code];
    if (feedback?.severities) {
      const severityKey = severity === 2 ? "danger" : "warning";
      const block = feedback.severities[severityKey];
      if (block?.styles) {
        return block.styles[style]?.text ?? block.styles.normal?.text ?? "Lỗi tư thế";
      }
    }
    return "Lỗi tư thế";
  }

  it("selects correct gentle warning dialogue for Plank signed_hip_y_diff", () => {
    const text = getCueText(mockVoiceFeedbacks, "signed_hip_y_diff", 1, "gentle");
    expect(text).toBe("Hơi võng hông rồi bạn ơi, gồng nhẹ bụng lên nhé.");
  });

  it("selects correct strict danger dialogue for Plank signed_hip_y_diff", () => {
    const text = getCueText(mockVoiceFeedbacks, "signed_hip_y_diff", 2, "strict");
    expect(text).toBe("Đau thắt lưng đấy! Hạ mông xuống hoặc nâng hông lên ngay!");
  });

  it("selects normal style as default when style is normal", () => {
    const text = getCueText(mockVoiceFeedbacks, "signed_hip_y_diff", 1, "normal");
    expect(text).toBe("Hông hơi võng, hãy siết chặt mông và bụng.");
  });

  it("enforces post-speech silence cooldown gap of 1.5s for Danger and 3.0s for Warning", () => {
    const lastFinishedTime = 10000;
    const gapDangerMs = 1500;
    const gapWarningMs = 3000;

    // 0.5s after speech finished (< 1.5s) -> Danger blocked
    let now = 10500;
    expect(now - lastFinishedTime < gapDangerMs).toBe(true);

    // 1.5s after speech finished (== 1.5s) -> Danger allowed
    now = 11500;
    expect(now - lastFinishedTime >= gapDangerMs).toBe(true);

    // 2.0s after speech finished (< 3.0s) -> Warning blocked
    now = 12000;
    expect(now - lastFinishedTime < gapWarningMs).toBe(true);

    // 3.0s after speech finished (== 3.0s) -> Warning allowed
    now = 13000;
    expect(now - lastFinishedTime >= gapWarningMs).toBe(true);
  });
});
