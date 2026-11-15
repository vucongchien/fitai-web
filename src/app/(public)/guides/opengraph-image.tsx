import { createBrandedOgResponse, OG_IMAGE_SIZE } from "@/shared/seo/og-card";

const alt = "FITAI Knowledge Guides — 4-Week Adaptive Training & On-Device Biomechanics";
const size = OG_IMAGE_SIZE;
const contentType = "image/png";

function OpenGraphImage() {
  return createBrandedOgResponse({
    kicker: "ARCHITECTURE GUIDES",
    title: "Evidence-Based Training, Pose AI & Injury Guard.",
    subtitle:
      "Technical guides explaining 4-week planning, One-Euro smoothing, Epley 1RM, and 50% PR recovery caps.",
    pills: ["Plan · Max 6/wk", "Move · Pose & Manual", "Recover · 50% PR Cap"],
  });
}

export { alt, contentType, OpenGraphImage as default, size };
