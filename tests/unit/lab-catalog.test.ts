import { describe, expect, it } from "vitest";

import { LAB_GLOSSARY_FAQS, LAB_GLOSSARY_TERMS } from "@/features/lab/model/glossary-data";
import { KNOWLEDGE_GUIDES } from "@/features/lab/model/guides-data";
import { LAB_EXERCISES_META } from "@/features/lab/model/lab-catalog";
import { LANDING_FAQS } from "@/features/lab/model/landing-faqs";
import { loadAllLabExercises } from "@/features/lab/server/load-lab-catalog";
import {
  buildDefinedTermSetJsonLd,
  buildExerciseHowToJsonLd,
  buildFaqPageJsonLd,
  buildTechArticleJsonLd,
} from "@/shared/seo/structured-data";

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

  it("exposes five architecture guides with TechArticle schema and FAQs", () => {
    expect(KNOWLEDGE_GUIDES).toHaveLength(5);
    for (const guide of KNOWLEDGE_GUIDES) {
      expect(guide.summaryPoints.length).toBeGreaterThan(0);
      expect(guide.faqs.length).toBeGreaterThanOrEqual(3);
      expect(buildTechArticleJsonLd(guide)["@type"]).toBe("TechArticle");
    }
  });

  it("exposes glossary DefinedTermSet and landing FAQs", () => {
    expect(LAB_GLOSSARY_TERMS.length).toBeGreaterThanOrEqual(10);
    expect(LAB_GLOSSARY_FAQS.length).toBeGreaterThanOrEqual(3);
    expect(LANDING_FAQS.length).toBeGreaterThanOrEqual(4);

    const termSet = buildDefinedTermSetJsonLd(LAB_GLOSSARY_TERMS);
    expect(termSet["@type"]).toBe("DefinedTermSet");
    expect(buildFaqPageJsonLd(LANDING_FAQS)["@type"]).toBe("FAQPage");
  });
});
