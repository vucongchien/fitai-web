import multiavatar from "@multiavatar/multiavatar/esm";
import { useMemo } from "react";

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

export function useMultiavatar(seed: string): { svg: string; dataUri: string } {
  return useMemo(() => {
    const svg = generateMultiavatarSvg(seed);
    const dataUri = svgToDataUri(svg);
    return { svg, dataUri };
  }, [seed]);
}
