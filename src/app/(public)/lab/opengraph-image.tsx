import { createBrandedOgResponse, OG_IMAGE_SIZE } from "@/shared/seo/og-card";

const alt = "FITAI Movement Lab — 12 Biomechanical Exercise Rule Specs";
const size = OG_IMAGE_SIZE;
const contentType = "image/png";

function OpenGraphImage() {
  return createBrandedOgResponse({
    kicker: "OPEN MOVEMENT LAB",
    title: "12 Exercises. Inspectable Angles & Guardrails.",
    subtitle:
      "Every phase threshold, torso-lean bound, camera profile, and deterministic referee rule running inside FITAI.",
    pills: ["12 Rule Schemas", "17 COCO Keypoints", "100% On-Device ONNX"],
  });
}

export { alt, contentType, OpenGraphImage as default, size };
