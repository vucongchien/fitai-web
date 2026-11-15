import { LAB_GLOSSARY_TERMS } from "@/features/lab/model/glossary-data";
import { KNOWLEDGE_GUIDES } from "@/features/lab/model/guides-data";
import { LANDING_FAQS } from "@/features/lab/model/landing-faqs";
import { loadAllLabExercises } from "@/features/lab/server/load-lab-catalog";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/shared/seo/site-config";

async function GET() {
  const siteUrl = getSiteUrl();
  const exercises = await loadAllLabExercises();

  const payload = {
    name: SITE_NAME,
    domain: siteUrl,
    description: SITE_DESCRIPTION,
    medicalDisclaimer:
      "FITAI provides AI-assisted training guidance only and does not diagnose medical conditions.",
    overviewFaqs: LANDING_FAQS,
    glossary: LAB_GLOSSARY_TERMS.map((term) => ({
      ...term,
      url: `${siteUrl}/lab/glossary#${term.id}`,
    })),
    guides: KNOWLEDGE_GUIDES.map((guide) => ({
      slug: guide.slug,
      url: `${siteUrl}/guides/${guide.slug}`,
      title: guide.title,
      lane: guide.lane,
      updatedAt: guide.updatedAt,
      description: guide.description,
      summaryPoints: guide.summaryPoints,
      faqs: guide.faqs,
    })),
    exercises: exercises.map((ex) => ({
      slug: ex.slug,
      url: `${siteUrl}/lab/${ex.slug}`,
      displayName: ex.displayName,
      category: ex.category,
      repType: ex.repType,
      cameraView: ex.cameraView,
      primaryMuscles: ex.primaryMuscles,
      answerSummary: ex.answerSummary,
      phaseMetric: ex.phaseMetric,
      phases: ex.phases,
      formRules: ex.formRules,
      faqs: ex.faqs,
    })),
  };

  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export { GET };
