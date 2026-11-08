"use client";

export function DuelHeroAnimation() {
  return (
    <div className="relative mx-auto w-full max-w-[420px] select-none py-1">
      <style>{`
        @keyframes pushup-left {
          0%, 100% {
            /* Lockout / Up position */
            transform: translateY(0px) rotate(0deg);
          }
          45%, 55% {
            /* Dip / Chest-to-floor position */
            transform: translateY(8px) rotate(-3deg);
          }
        }
        @keyframes pushup-right {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          45%, 55% {
            transform: translateY(8px) rotate(3deg);
          }
        }
        @keyframes arm-left {
          0%, 100% {
            d: path("M 85 54 L 88 78 L 94 78");
          }
          45%, 55% {
            d: path("M 85 54 L 96 66 L 94 78");
          }
        }
        @keyframes pulse-vs {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(75, 87, 242, 0.2);
          }
          50% {
            transform: scale(1.06);
            box-shadow: 0 0 0 6px rgba(75, 87, 242, 0);
          }
        }
        .animate-pushup-p1 {
          animation: pushup-left 2.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          transform-origin: 30px 78px;
        }
        .animate-pushup-p2 {
          animation: pushup-right 2.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite 0.25s;
          transform-origin: 290px 78px;
        }
        .animate-vs-badge {
          animation: pulse-vs 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Duel Arena Vector Canvas */}
      <div className="relative flex items-center justify-between">
        {/* SVG Athlete Figures */}
        <svg
          className="h-24 w-full"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 320 90"
        >
          {/* Ground baseline */}
          <line
            className="stroke-neutral-200"
            strokeDasharray="4 4"
            strokeWidth="1.5"
            x1="15"
            x2="305"
            y1="80"
            y2="80"
          />

          {/* Left Player (You - Relay Blue #4B57F2) */}
          <g className="animate-pushup-p1">
            {/* Head */}
            <circle cx="95" cy="38" fill="#4B57F2" r="7" />
            {/* Torso & Legs (Plank line) */}
            <line stroke="#4B57F2" strokeWidth="4" x1="32" x2="90" y1="77" y2="46" />
            {/* Left Arm / Pushup Joint */}
            <polyline points="84,49 88,65 92,79" stroke="#4B57F2" strokeWidth="3.5" />
            {/* Feet on ground */}
            <circle cx="32" cy="78" fill="#4B57F2" r="3" />
            {/* Hands on ground */}
            <circle cx="92" cy="79" fill="#4B57F2" r="2.5" />
          </g>

          {/* Right Player (Rival - Ink Black #101214) */}
          <g className="animate-pushup-p2">
            {/* Head */}
            <circle cx="225" cy="38" fill="#101214" r="7" />
            {/* Torso & Legs (Plank line) */}
            <line stroke="#101214" strokeWidth="4" x1="288" x2="230" y1="77" y2="46" />
            {/* Right Arm / Pushup Joint */}
            <polyline points="236,49 232,65 228,79" stroke="#101214" strokeWidth="3.5" />
            {/* Feet on ground */}
            <circle cx="288" cy="78" fill="#101214" r="3" />
            {/* Hands on ground */}
            <circle cx="228" cy="79" fill="#101214" r="2.5" />
          </g>
        </svg>

        {/* Center Floating VS Badge */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-vs-badge flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[var(--color-action)] text-white shadow-md">
            <span className="font-black text-[11px] tracking-tighter">VS</span>
          </div>
        </div>
      </div>

      {/* Subtext under graphic */}
      <div className="mt-1 flex items-center justify-between px-2 text-[11px] font-semibold">
        <span className="text-[var(--color-action)]">You (Live Lane)</span>
        <span className="text-[var(--color-text-muted)]">Rival (Real-Time)</span>
      </div>
    </div>
  );
}
