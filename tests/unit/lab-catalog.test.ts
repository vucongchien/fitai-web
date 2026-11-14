import { describe, expect, it } from "vitest";

import { KNOWLEDGE_GUIDES } from "@/features/lab/model/guides-data";
import { LAB_EXERCISES_META } from "@/features/lab/model/lab-catalog";
import { loadAllLabExercises } from "@/features/lab/server/load-lab-catalog";
import { buildExerciseHowToJsonLd, buildFaqPageJsonLd } from "@/shared/seo/structured-data";

describe("public movement lab and knowledge guides", () => {
  it("loads all 12 exercise rule specifications without missing fields", async () => {
    const exercises = await loadAllLabExercises();
    expect(exercises).toHaveLength(LAB_EXERCISES_META.length);

    for (const exercise of exercises) {
      expect(exercise.phases.length).toBeGreaterThan(0);
      expect(exercise.formRules.length).toBeGreaterThan(0);
      expect(exercise.faqs.length).toBeGreaterThanOrEqual(3);

      const howTo = buildExerciseHowToJsonLd(exercise);
      expect(howTo["@type"]).toBe("HowTo");

      const faqLd = buildFaqPageJsonLd(exercise.faqs);
      expect(faqLd["@type"]).toBe("FAQPage");
    }
  });

  it("exposes three architecture guides with FAQs and summary points", () => {
    expect(KNOWLEDGE_GUIDES).toHaveLength(3);
    for (const guide of KNOWLEDGE_GUIDES) {
      expect(guide.summaryPoints.length).toBeGreaterThan(0);
      expect(guide.faqs.length).toBeGreaterThanOrEqual(3);
    }
  });
});
