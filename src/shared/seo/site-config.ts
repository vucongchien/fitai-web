function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://fitai.chien204.id.vn";
  return raw.replace(/\/+$/u, "");
}

const SITE_NAME = "FITAI";

const SITE_DESCRIPTION =
  "AI-personalized 4-week adaptive workout and nutrition plans, real-time biomechanical form checks, solo matches, and injury-safe recovery tracking.";

const PRIVATE_ROUTE_PREFIXES = [
  "/admin/",
  "/api/",
  "/rpc/",
  "/home",
  "/onboarding",
  "/profile",
  "/roadmap",
  "/schedule",
  "/progress",
  "/nutrition",
  "/workouts/",
  "/challenge/",
  "/leaderboard",
  "/community",
  "/search",
  "/notifications",
] as const;

export { getSiteUrl, PRIVATE_ROUTE_PREFIXES, SITE_DESCRIPTION, SITE_NAME };
