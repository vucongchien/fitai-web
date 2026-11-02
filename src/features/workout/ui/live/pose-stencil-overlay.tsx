"use client";

import { useCallback, useRef, useState } from "react";

import { playSyntheticCueTone } from "@/features/workout/domain/audio-cues";
import type { Pose } from "@/features/workout/domain/pose-metrics";
import { hapticFeedback } from "@/shared/lib/haptic-feedback";

export interface PoseStencilOverlayProps {
  exerciseId: string;
  pose: Pose | null;
  onAlignedLock: () => void;
  onSkip: () => void;
  onSwitchManual?: () => void;
  setNumber?: number;
  recommendedAngle?: string;
}

// Strict biometric matching requiring visible shoulders and hips
export function isPoseMatchingStencil(exerciseId: string, pose: Pose | null): boolean {
  if (!pose || !pose.keypoints || pose.keypoints.length === 0) {
    return false;
  }
  // Count keypoints with confidence threshold >= 0.22
  const visible = pose.keypoints.filter((k) => k.score >= 0.22);
  if (visible.length < 5) {
    return false;
  }

  const sw = Math.max(1, pose.sourceWidth || 640);
  const sh = Math.max(1, pose.sourceHeight || 480);

  const xs = visible.map((k) => k.x);
  const ys = visible.map((k) => k.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const normHeight = (maxY - minY) / sh;
  const centerX = (minX + maxX) / 2 / sw;
  const centerY = (minY + maxY) / 2 / sh;

  // 1. Horizontal centering: user is reasonably within camera bounds (middle 76%)
  if (centerX < 0.12 || centerX > 0.88) {
    return false;
  }

  // 2. Key joints tracking (COCO-17 indices)
  // 5,6 = shoulders; 11,12 = hips
  const shoulderL = pose.keypoints[5];
  const shoulderR = pose.keypoints[6];
  const hipL = pose.keypoints[11];
  const hipR = pose.keypoints[12];

  const shoulder = (shoulderL?.score ?? 0) >= (shoulderR?.score ?? 0) ? shoulderL : shoulderR;
  const hip = (hipL?.score ?? 0) >= (hipR?.score ?? 0) ? hipL : hipR;

  const hasShoulder = (shoulder?.score ?? 0) >= 0.22;
  const hasHip = (hip?.score ?? 0) >= 0.22;

  // RULE 1: If shoulders or hips are missing, the user has NOT stepped back!
  // Peeking face/shoulders into the camera close-up will NEVER pass this check.
  if (!hasShoulder || !hasHip || !shoulder || !hip) {
    return false;
  }

  const deltaX = Math.abs(hip.x - shoulder.x) / sw;
  const deltaY = Math.abs(hip.y - shoulder.y) / sh;

  const floorExercises = new Set(["push_up", "plank", "sit_up", "bench_press"]);
  const isFloor = floorExercises.has(exerciseId);

  if (isFloor) {
    // Floor exercises require horizontal torso and lower height
    const isHorizontalTorso = deltaX >= deltaY * 0.8 && deltaX >= 0.16;
    const isFloorHeight = centerY >= 0.35;

    return isHorizontalTorso && isFloorHeight;
  }

  // Standing exercises require vertical torso and workout distance
  const isVerticalTorso = deltaY > deltaX * 1.05 && deltaY >= 0.18;
  const isSteppedBack = normHeight >= 0.36;
  const headInUpperFrame = minY / sh <= 0.42;

  return isVerticalTorso && isSteppedBack && headInUpperFrame;
}

// Exercise silhouette shapes on 1000x1000 viewBox
function getExerciseSilhouetteShapes(exerciseId: string) {
  switch (exerciseId) {
    case "push_up": {
      // Horizontal inclined push-up stance across 84% width
      return (
        <g>
          <circle cx="160" cy="570" r="56" />
          <path d="M 215 580 C 270 585 340 585 410 590 C 520 595 620 605 700 615 C 780 625 840 635 895 650 C 915 655 915 780 895 780 C 850 780 840 760 800 740 C 720 715 630 705 550 700 C 480 695 440 690 395 680 L 395 750 C 395 775 375 785 350 785 L 290 785 C 265 785 250 770 255 740 L 265 650 C 255 630 235 610 215 580 Z" />
          <line strokeDasharray="14 10" x1="90" x2="910" y1="790" y2="790" />
        </g>
      );
    }

    case "plank": {
      // Low horizontal prone plank with forearms on floor
      return (
        <g>
          <circle cx="160" cy="610" r="54" />
          <path d="M 215 620 C 280 625 360 625 450 630 C 560 635 670 645 760 655 C 830 665 870 670 900 690 C 915 700 915 775 895 775 C 850 775 840 760 800 740 C 730 720 640 710 550 705 C 470 705 450 705 440 775 L 280 775 C 260 775 250 760 255 730 L 265 660 C 255 645 235 630 215 620 Z" />
          <line strokeDasharray="14 10" x1="90" x2="910" y1="780" y2="780" />
        </g>
      );
    }

    case "squat": {
      // Athletic ready squat stance: feet wide, knees soft, arms in front
      return (
        <g>
          <circle cx="500" cy="150" r="62" />
          <path d="M 465 215 C 420 225 360 250 335 285 C 310 320 320 380 340 420 C 365 455 420 465 470 460 L 485 530 C 445 590 355 700 345 790 C 335 860 330 905 390 905 C 420 905 435 865 450 810 C 465 745 475 670 490 575 C 505 670 515 745 530 810 C 545 865 560 905 590 905 C 650 905 645 860 635 790 C 625 700 535 590 495 530 L 510 460 C 560 465 615 455 640 420 C 660 380 670 320 645 285 C 620 250 560 225 515 215 Z" />
        </g>
      );
    }

    case "shoulder_press": {
      // Standing upright with arms bent at 90 deg, dumbbells at ear height
      return (
        <g>
          <circle cx="500" cy="180" r="60" />
          <path d="M 465 240 C 420 250 385 270 370 310 C 355 350 330 360 290 360 C 260 360 250 320 250 250 C 250 180 290 170 320 170 C 340 170 350 200 350 240 C 350 270 380 290 420 300 L 420 530 C 425 610 385 700 385 790 C 385 860 385 905 440 905 C 465 905 470 860 470 800 C 470 730 480 650 490 560 C 500 650 510 730 510 800 C 510 860 515 905 540 905 C 595 905 595 860 595 790 C 595 700 555 610 560 530 L 560 300 C 600 290 630 270 630 240 C 630 200 640 170 660 170 C 690 170 730 180 730 250 C 730 320 720 360 690 360 C 650 360 625 350 610 310 C 595 270 560 250 515 240 Z" />
        </g>
      );
    }

    case "pull_up": {
      // Overhead reach silhouette
      return (
        <g>
          <circle cx="500" cy="260" r="58" />
          <path d="M 465 330 C 420 340 370 320 330 220 C 300 150 330 90 380 90 C 410 90 420 130 430 210 L 440 580 C 445 660 405 750 405 840 C 405 910 405 930 455 930 C 480 930 485 885 485 825 C 485 755 495 675 500 595 C 505 675 515 755 515 825 C 515 885 520 930 545 930 C 595 930 595 910 595 840 C 595 750 555 660 560 580 L 570 210 C 580 130 590 90 620 90 C 670 90 700 150 670 220 C 630 320 580 340 535 330 Z" />
          <line strokeDasharray="14 10" x1="220" x2="780" y1="85" y2="85" />
        </g>
      );
    }

    case "lunge": {
      // Split stance athletic silhouette
      return (
        <g>
          <circle cx="480" cy="165" r="58" />
          <path d="M 445 230 C 410 240 370 270 350 320 C 335 360 340 450 360 460 C 380 470 410 440 420 390 L 430 520 C 420 590 360 680 330 760 C 310 820 310 895 365 895 C 395 895 405 860 425 800 C 445 740 465 670 485 580 C 505 670 545 760 585 830 C 610 875 625 895 665 895 C 705 895 700 850 675 800 C 640 730 575 620 555 520 L 565 390 C 575 440 605 470 625 460 C 645 450 650 360 635 320 C 615 270 575 240 540 230 Z" />
        </g>
      );
    }

    case "deadlift": {
      // Hip hinge athletic posture
      return (
        <g>
          <circle cx="560" cy="210" r="56" />
          <path d="M 510 270 C 460 270 400 360 370 450 C 350 510 370 580 420 620 L 420 895 C 420 910 465 910 470 870 C 480 790 490 700 500 620 C 520 650 540 720 540 800 L 540 895 C 540 910 585 910 590 870 C 595 780 590 680 580 570 C 610 510 630 420 630 350 C 630 280 570 270 510 270 Z" />
          <line strokeDasharray="14 10" x1="330" x2="710" y1="680" y2="680" />
        </g>
      );
    }

    case "sit_up": {
      // Supine crunch/sit-up posture with bent knees
      return (
        <g>
          <circle cx="210" cy="690" r="52" />
          <path d="M 265 700 C 330 710 420 720 510 720 C 560 660 610 570 640 570 C 665 570 690 620 730 710 C 750 755 765 770 800 770 C 825 770 825 785 780 785 L 250 785 C 230 785 220 775 225 745 Z" />
          <line strokeDasharray="14 10" x1="90" x2="910" y1="785" y2="785" />
        </g>
      );
    }

    case "bench_press": {
      // Supine flat bench press
      return (
        <g>
          <circle cx="190" cy="680" r="52" />
          <path d="M 240 690 L 760 700 C 790 700 810 720 810 750 L 220 750 C 220 720 230 690 240 690 Z" />
          <rect height="180" rx="18" width="48" x="420" y="500" />
          <rect height="180" rx="18" width="48" x="520" y="500" />
          <line strokeDasharray="14 10" x1="300" x2="680" y1="495" y2="495" />
        </g>
      );
    }

    case "bicep_curl":
    case "lateral_raise":
    case "triceps_dip":
    default: {
      // Standard upright athletic standing silhouette (fills 83% of height)
      return (
        <g>
          <circle cx="500" cy="140" r="62" />
          <path d="M 465 205 C 420 215 370 235 340 260 C 315 285 310 360 315 440 C 320 500 315 545 335 555 C 355 565 370 535 375 480 C 380 420 395 340 420 330 C 420 380 415 460 420 530 C 425 610 385 700 385 790 C 385 860 385 905 440 905 C 465 905 470 860 470 800 C 470 730 480 650 490 560 C 500 650 510 730 510 800 C 510 860 515 905 540 905 C 595 905 595 860 595 790 C 595 700 555 610 560 530 C 565 460 560 380 560 330 C 585 340 600 420 605 480 C 610 535 625 565 645 555 C 665 545 660 500 665 440 C 670 360 665 285 640 260 C 610 235 560 215 515 205 Z" />
        </g>
      );
    }
  }
}

// High-end stencil mask with full-bleed frosted overlay
export function PoseStencilOverlay({
  exerciseId,
  onAlignedLock,
  onSkip,
  pose,
  recommendedAngle,
}: PoseStencilOverlayProps) {
  const [isAligned, setIsAligned] = useState(false);
  const alignedStartRef = useRef<number | null>(null);
  const lastMatchedRef = useRef<number>(0);
  const lockedRef = useRef(false);

  const checkAlignment = useCallback(() => {
    if (lockedRef.current) {
      return;
    }

    const matched = isPoseMatchingStencil(exerciseId, pose);
    const now = Date.now();

    if (matched) {
      lastMatchedRef.current = now;
      if (alignedStartRef.current === null) {
        alignedStartRef.current = now;
      }
      setIsAligned(true);

      // Must hold stable posture for 1200ms (1.2s) before auto-locking
      // Gives athlete plenty of time to settle in, preventing premature countdowns
      const elapsed = now - alignedStartRef.current;
      if (elapsed >= 1200) {
        lockedRef.current = true;
        hapticFeedback.repSuccess();
        playSyntheticCueTone("good");
        onAlignedLock();
      }
    } else {
      // 200ms grace period for transient camera jitter or dropped frames
      if (now - lastMatchedRef.current > 200) {
        alignedStartRef.current = null;
        setIsAligned(false);
      }
    }
  }, [exerciseId, onAlignedLock, pose]);

  const rootRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      checkAlignment();
    },
    [checkAlignment],
  );

  const maskId = `stencil-mask-${exerciseId}`;
  // App signature brand green (#25c77a) when matched; clean slate otherwise (no neon)
  const strokeColor = isAligned ? "#25c77a" : "rgba(51, 65, 85, 0.75)";
  const strokeW = isAligned ? 5 : 3.5;

  return (
    <div
      aria-label="Pose alignment stencil"
      className="absolute inset-0 z-20 w-full h-full cursor-pointer select-none overflow-hidden"
      onClick={onSkip}
      ref={rootRef}
      role="button"
      tabIndex={0}
      title="Step into the cutout, or tap anywhere to start immediately"
    >
      {recommendedAngle ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md text-white text-xs font-medium shadow-md border border-white/10 pointer-events-none select-none">
          <span>📱</span>
          <span>
            {recommendedAngle.toLowerCase().includes("side")
              ? "Đặt máy bên hông (Góc nhìn ngang)"
              : recommendedAngle.toLowerCase().includes("front")
                ? "Đặt máy trước mặt (Góc nhìn thẳng)"
                : "Đặt máy hướng về cơ thể"}
          </span>
        </div>
      ) : null}

      <svg className="w-full h-full block" height="100%" width="100%">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            {/* White covers 100% of entire camera viewport regardless of aspect ratio */}
            <rect fill="white" height="100%" width="100%" x="0" y="0" />
            {/* Cutout hole punches through with undistorted aspect ratio */}
            <svg
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              viewBox="0 0 1000 1000"
              width="100%"
              x="0"
              y="0"
            >
              <g fill="black">{getExerciseSilhouetteShapes(exerciseId)}</g>
            </svg>
          </mask>
        </defs>

        {/* 100% Full-bleed Frosted Glass Overlay (Covering 100% of camera feed) */}
        <rect
          fill="rgba(240, 244, 252, 0.48)"
          height="100%"
          mask={`url(#${maskId})`}
          width="100%"
          x="0"
          y="0"
        />

        {/* Centered, undistorted AR viewfinder corners & stencil outline */}
        <svg
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 1000 1000"
          width="100%"
          x="0"
          y="0"
        >
          {/* Four sleek AR camera viewfinder corners */}
          <g stroke={strokeColor} strokeLinecap="round" strokeWidth={3}>
            {/* Top-Left */}
            <path d="M 50 110 L 50 60 Q 50 50 60 50 L 110 50" fill="none" opacity={0.65} />
            {/* Top-Right */}
            <path d="M 890 50 L 940 50 Q 950 50 950 60 L 950 110" fill="none" opacity={0.65} />
            {/* Bottom-Left */}
            <path d="M 50 890 L 50 940 Q 50 950 60 950 L 110 950" fill="none" opacity={0.65} />
            {/* Bottom-Right */}
            <path d="M 890 950 L 940 950 Q 950 950 950 940 L 950 890" fill="none" opacity={0.65} />
          </g>

          {/* Subtle brand tint inside the cutout hole when matched */}
          {isAligned ? (
            <g className="transition-all duration-300" fill="rgba(37, 199, 122, 0.08)">
              {getExerciseSilhouetteShapes(exerciseId)}
            </g>
          ) : null}

          {/* Clean outline around the cutout (Sleek slate -> App signature green #25c77a, zero neon) */}
          <g
            className={`transition-all duration-300 ${isAligned ? "" : "animate-pulse"}`}
            fill="none"
            stroke={strokeColor}
            strokeDasharray={isAligned ? "none" : "14 10"}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeW}
          >
            {getExerciseSilhouetteShapes(exerciseId)}
          </g>
        </svg>
      </svg>
    </div>
  );
}
