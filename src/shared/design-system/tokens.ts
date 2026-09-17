/**
 * FITAI Design Tokens (Headless TypeScript constants)
 * Shared between Next.js (Web) and React Native / Expo (Mobile).
 * Source of truth mapped to src/shared/design-system/tokens.css.
 */

export const tokens = {
  colors: {
    // Signature Triple Lane Palette
    relayBlue: "#4b57f2",
    sprintCoral: "#ff5a47",
    fieldGreen: "#25c77a",

    // Tints
    blueTint: "#eef0ff",
    coralTint: "#fff0ed",
    greenTint: "#eafbf2",

    // Semantic status
    danger: "#c92f42",
    dangerTint: "#fff0f2",
    warning: "#8a451d",

    // Neutral base palette
    white: "#ffffff",
    softPaper: "#f7f8f6",
    trueInk: "#101214",
    graphite: "#50565c",
    mist: "#eceef0",
    steel: "#c9cdd1",

    // Dark Mode Theme (Mobile Native & Dark Web)
    dark: {
      background: "#09090b",
      surface: "#18181b",
      surfaceSubtle: "#27272a",
      border: "#27272a",
      borderStrong: "#3f3f46",
      text: "#f4f4f5",
      textMuted: "#71717a",
      card: "#18181b",
    },
  },

  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },

  radius: {
    input: 10,
    surface: 14,
    hero: 20,
    round: 9999,
  },

  duration: {
    pressMs: 90,
    stateMs: 180,
    routeMs: 360,
  },
} as const;

export type TokenColors = typeof tokens.colors;
export type TokenSpacing = typeof tokens.spacing;
export type TokenRadius = typeof tokens.radius;
