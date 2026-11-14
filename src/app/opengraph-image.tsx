import { ImageResponse } from "next/og";

export const alt = "FITAI — Evidence-Based Adaptive Fitness & Form Coaching";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

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

const DOMAIN_PILL_STYLE = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#475467",
  border: "1px solid #d0d5dd",
  borderRadius: "999px",
  padding: "8px 18px",
  backgroundColor: "#ffffff",
} as const;

const HERO_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  maxWidth: "960px",
} as const;

const HEADING_STYLE = {
  fontSize: "64px",
  fontWeight: 800,
  lineHeight: 1.08,
  letterSpacing: "-0.03em",
} as const;

const SUBTITLE_STYLE = {
  fontSize: "28px",
  lineHeight: 1.4,
  color: "#344054",
} as const;

const LANES_STYLE = {
  display: "flex",
  gap: "16px",
  width: "100%",
} as const;

const LANE_PLAN_STYLE = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 22px",
  borderRadius: "14px",
  backgroundColor: "#ffffff",
  border: "2px solid #1d4ed8",
  fontSize: "20px",
  fontWeight: 700,
  color: "#1d4ed8",
} as const;

const LANE_MOVE_STYLE = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 22px",
  borderRadius: "14px",
  backgroundColor: "#ffffff",
  border: "2px solid #e5484d",
  fontSize: "20px",
  fontWeight: 700,
  color: "#c92a2a",
} as const;

const LANE_RECOVER_STYLE = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 22px",
  borderRadius: "14px",
  backgroundColor: "#ffffff",
  border: "2px solid #16a34a",
  fontSize: "20px",
  fontWeight: 700,
  color: "#15803d",
} as const;

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={CONTAINER_STYLE}>
      <div style={TOP_BAR_STYLE}>
        <div style={BRAND_STYLE}>
          <span>FIT</span>
          <span style={BRAND_ACCENT_STYLE}>AI</span>
        </div>
        <div style={DOMAIN_PILL_STYLE}>fitai.chien204.id.vn</div>
      </div>

      <div style={HERO_STYLE}>
        <div style={HEADING_STYLE}>Train with evidence, not guesswork.</div>
        <div style={SUBTITLE_STYLE}>
          4-week adaptive training plans, real-time biomechanical form checks, nutrition targets,
          and injury-safe recovery.
        </div>
      </div>

      <div style={LANES_STYLE}>
        <div style={LANE_PLAN_STYLE}>
          <span>01 · Plan</span>
          <span>4-Week Route</span>
        </div>
        <div style={LANE_MOVE_STYLE}>
          <span>02 · Move</span>
          <span>Form & Manual Log</span>
        </div>
        <div style={LANE_RECOVER_STYLE}>
          <span>03 · Recover</span>
          <span>Injury Guard</span>
        </div>
      </div>
    </div>,
    size,
  );
}
