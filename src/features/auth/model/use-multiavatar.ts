import multiavatar from "@multiavatar/multiavatar/esm";

const FALLBACK_SEED = "FitAI-Athlete";

export function generateMultiavatarSvg(seed: string): string {
  const cleanSeed = seed.trim() || FALLBACK_SEED;
  return multiavatar(cleanSeed);
}

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateRandomSeed(): string {
  return `fitai-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
