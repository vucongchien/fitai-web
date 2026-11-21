import { cn } from "@/shared/lib/cn";

export type FitAiMascotMood = "idle" | "loading" | "celebrating";

interface FitAiMascotSvgProps {
  className?: string;
  decorative?: boolean;
  mood?: FitAiMascotMood;
}

export function FitAiMascotSvg({
  className,
  decorative = false,
  mood = "idle",
}: FitAiMascotSvgProps) {
  return (
    <svg
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : "FitAI waving mascot"}
      className={cn("shrink-0 select-none", className)}
      fill="none"
      role={decorative ? undefined : "img"}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="50" cy="92" fill="#101214" opacity="0.1" rx="30" ry="5.5" />

      <rect fill="#4b57f2" height="64" rx="28" width="56" x="22" y="24" />
      <path
        d="M22 60 C22 75, 34 88, 50 88 C66 88, 78 75, 78 60 L78 68 C78 80, 66 88, 50 88 C34 88, 22 80, 22 68 Z"
        fill="#3945dc"
      />

      <rect fill="#ff5a47" height="15" rx="5" width="58" x="21" y="26" />
      <path
        d="M21 38 L79 38 L79 41 C79 43, 76 44, 74 44 L26 44 C24 44, 21 43, 21 41 Z"
        fill="#e04635"
      />
      <path d="M51 29 L47 34 L50 34 L48 39 L54 33 L51 33 Z" fill="#ffffff" />

      {mood === "celebrating" ? (
        <>
          <path
            d="M34 50 Q41 42 48 50"
            fill="none"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeWidth="3.5"
          />
          <path
            d="M52 50 Q59 42 66 50"
            fill="none"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeWidth="3.5"
          />
        </>
      ) : mood === "loading" ? (
        <>
          <ellipse cx="40" cy="52" fill="#ffffff" rx="7" ry="7" />
          <circle cx="42" cy="52" fill="#101214" r="4" />
          <circle cx="43" cy="50" fill="#ffffff" r="1.5" />

          <ellipse cx="60" cy="52" fill="#ffffff" rx="7" ry="7" />
          <circle cx="62" cy="52" fill="#101214" r="4" />
          <circle cx="63" cy="50" fill="#ffffff" r="1.5" />
        </>
      ) : (
        <>
          <ellipse cx="39" cy="52" fill="#ffffff" rx="8" ry="9" />
          <ellipse cx="40" cy="52" fill="#101214" rx="5" ry="6" />
          <circle cx="42" cy="49" fill="#ffffff" r="2.2" />
          <circle cx="38" cy="54" fill="#ffffff" r="1.1" />

          <ellipse cx="61" cy="52" fill="#ffffff" rx="8" ry="9" />
          <ellipse cx="60" cy="52" fill="#101214" rx="5" ry="6" />
          <circle cx="62" cy="49" fill="#ffffff" r="2.2" />
          <circle cx="58" cy="54" fill="#ffffff" r="1.1" />
        </>
      )}

      <circle cx="28" cy="58" fill="#ff5a47" opacity="0.4" r="4" />
      <circle cx="72" cy="58" fill="#ff5a47" opacity="0.4" r="4" />

      {mood === "celebrating" ? (
        <g>
          <path d="M42 63 C42 70, 58 70, 58 63 Z" fill="#ffffff" />
          <path d="M45 66 C47 69, 53 69, 55 66 Z" fill="#ff5a47" />
        </g>
      ) : (
        <path
          d="M44 64 Q50 70 56 64"
          fill="none"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeWidth="2.8"
        />
      )}

      {mood === "celebrating" ? (
        <>
          <rect
            fill="#4b57f2"
            height="24"
            rx="6"
            transform="rotate(-30 10 32)"
            width="12"
            x="10"
            y="32"
          />
          <rect
            fill="#4b57f2"
            height="24"
            rx="6"
            transform="rotate(30 78 24)"
            width="12"
            x="78"
            y="24"
          />
        </>
      ) : (
        <>
          <circle cx="18" cy="62" fill="#4b57f2" r="7" />
          <circle cx="82" cy="62" fill="#4b57f2" r="7" />
        </>
      )}
    </svg>
  );
}
