/**
 * Mobile Design System Theme Constants
 * Maps directly to shared design tokens.
 */

import { tokens } from "@/shared/design-system/tokens";

export const theme = {
  colors: {
    // Backgrounds & Surfaces
    background: tokens.colors.dark.background,
    surface: tokens.colors.dark.surface,
    surfaceSubtle: tokens.colors.dark.surfaceSubtle,
    card: tokens.colors.dark.card,

    // Borders
    border: tokens.colors.dark.border,
    borderStrong: tokens.colors.dark.borderStrong,

    // Typography
    text: tokens.colors.dark.text,
    textMuted: tokens.colors.dark.textMuted,

    // Triple Lane Signature
    relayBlue: tokens.colors.relayBlue,
    sprintCoral: tokens.colors.sprintCoral,
    fieldGreen: tokens.colors.fieldGreen,

    // Status
    danger: tokens.colors.danger,
    warning: tokens.colors.warning,
    success: tokens.colors.fieldGreen,
  },

  spacing: tokens.spacing,
  radius: tokens.radius,
  duration: tokens.duration,
} as const;

export type Theme = typeof theme;
