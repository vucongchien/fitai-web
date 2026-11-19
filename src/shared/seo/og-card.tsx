import { ImageResponse } from "next/og";

interface BrandedOgCardInput {
  kicker: string;
  title: string;
  subtitle: string;
  pills: readonly [string, string, string];
}

const CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  backgroundColor: "#f7f8f6",
  color: "#111315",
  padding: "64px 72px",
  fontFamily: "sans-serif",
} as const;

const TOP_BAR_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
} as const;

const BRAND_STYLE = {
  display: "flex",
  alignItems: "baseline",
  fontSize: "40px",
  fontWeight: 800,
  letterSpacing: "-0.03em",
} as const;

const BRAND_ACCENT_STYLE = {
  color: "#1d4ed8",
} as const;

const PILL_TOP_STYLE = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  borderRadius: "999px",
  padding: "8px 20px",
  backgroundColor: "#eff6ff",
} as const;

const HERO_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
  maxWidth: "980px",
} as const;

const HEADING_STYLE = {
  fontSize: "58px",
  fontWeight: 800,
  lineHeight: 1.08,
  letterSpacing: "-0.03em",
} as const;

const SUBTITLE_STYLE = {
  fontSize: "26px",
  lineHeight: 1.4,
  color: "#344054",
} as const;

const FOOTER_ROW_STYLE = {
  display: "flex",
  gap: "16px",
  width: "100%",
} as const;

const BADGE_STYLE = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px 20px",
  borderRadius: "14px",
  backgroundColor: "#ffffff",
  border: "2px solid #d0d5dd",
  fontSize: "20px",
  fontWeight: 700,
  color: "#1f2937",
} as const;

const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
} as const;

function createBrandedOgResponse(input: BrandedOgCardInput): ImageResponse {
  return new ImageResponse(
    <div style={CONTAINER_STYLE}>
      <div style={TOP_BAR_STYLE}>
        <div style={BRAND_STYLE}>
          <span>FIT</span>
          <span style={BRAND_ACCENT_STYLE}>AI</span>
        </div>
        <div style={PILL_TOP_STYLE}>{input.kicker}</div>
      </div>

      <div style={HERO_STYLE}>
        <div style={HEADING_STYLE}>{input.title}</div>
        <div style={SUBTITLE_STYLE}>{input.subtitle}</div>
      </div>

      <div style={FOOTER_ROW_STYLE}>
        <div style={BADGE_STYLE}>{input.pills[0]}</div>
        <div style={BADGE_STYLE}>{input.pills[1]}</div>
        <div style={BADGE_STYLE}>{input.pills[2]}</div>
      </div>
    </div>,
    OG_IMAGE_SIZE,
  );
}

export { createBrandedOgResponse, OG_IMAGE_SIZE };
