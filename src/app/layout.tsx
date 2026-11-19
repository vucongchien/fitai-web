import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { AdminQueryProvider } from "@/features/admin/ui/admin-query-provider";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/shared/seo/site-config";
import { ToastContainer } from "@/shared/ui/toast/toast-container";
import { ToastProvider } from "@/shared/ui/toast/toast-context";

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
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    types: {
      "application/rss+xml": [
        {
          url: "/feed.xml",
          title: "FITAI Open Movement Lab & Guides RSS",
        },
      ],
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  icons: {
    apple: "/icons/icon-192.png",
    icon: "/icons/icon-192.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "FITAI — Evidence-Based Adaptive Fitness & Form Coaching",
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
  title: {
    default: SITE_NAME,
    template: "%s · FITAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "FITAI — Evidence-Based Adaptive Fitness & Form Coaching",
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  initialScale: 1,
  themeColor: "#f7f8f6",
  viewportFit: "cover",
  width: "device-width",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${display.variable} ${body.variable} ${data.variable}`} lang="en">
      <body data-design-direction="triple-lane" data-design-seed="4ff89157">
        <AdminQueryProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </AdminQueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
