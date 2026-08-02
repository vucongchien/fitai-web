import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import "./globals.css";

const display = localFont({
  adjustFontFallback: false,
  display: "swap",
  fallback: ["Arial Narrow", "Arial", "sans-serif"],
  src: "../assets/fonts/anybody-latin-variable.woff2",
  variable: "--font-anybody",
  weight: "100 900",
});

const body = localFont({
  adjustFontFallback: false,
  display: "swap",
  fallback: ["Arial", "sans-serif"],
  src: "../assets/fonts/atkinson-hyperlegible-next-latin-variable.woff2",
  variable: "--font-atkinson",
  weight: "200 800",
});

const data = localFont({
  adjustFontFallback: false,
  display: "swap",
  fallback: ["Consolas", "monospace"],
  src: "../assets/fonts/atkinson-hyperlegible-mono-latin-variable.woff2",
  variable: "--font-atkinson-mono",
  weight: "200 800",
});

export const metadata: Metadata = {
  description: "A four-week training plan that adapts to your progress.",
  title: {
    default: "FITAI",
    template: "%s · FITAI",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f8f6",
  width: "device-width",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${display.variable} ${body.variable} ${data.variable}`} lang="en">
      {/*
        THESIS: Triple Lane turns planning, effort, and recovery into one continuous route; it refuses the generic KPI dashboard.
        OWN-WORLD: White, ink, and gray chassis with one semantic sport triad, precise type, flat surfaces, and authored lane geometry.
        STORY: A returning beginner sees the next safe session, completes it, and watches the plan absorb the evidence.
        FIRST VIEWPORT: Three lanes converge on the next session; the primary action sits directly beneath that convergence.
        FORM: User-pinned Triple Lane operating interface; seed 4ff89157. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
      */}
      <body data-design-direction="triple-lane" data-design-seed="4ff89157">
        {children}
      </body>
    </html>
  );
}
