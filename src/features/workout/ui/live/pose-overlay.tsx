"use client";

import { useCallback, useRef } from "react";

import { KEYPOINT_NAMES, SKELETON_EDGES } from "@/features/workout/domain/pose-metrics";
import type { Pose } from "@/features/workout/domain/pose-metrics";

// Maps biometric error codes and metrics to relevant COCO-17 joint indices
const ERROR_KEYPOINT_MAP: Record<string, number[]> = {
  // Hips / Spine / Torso alignment
  ERR_SIGNED_HIP_Y_DIFF: [11, 12, 5, 6],
  signed_hip_y_diff: [11, 12, 5, 6],
  ERR_HIP_SAGGING: [11, 12],
  hip_sagging: [11, 12],
  ERR_HIP_PIKE: [11, 12],
  ERR_BODY_INCLINE_ANGLE: [5, 6, 11, 12, 15, 16],
  body_alignment: [5, 6, 11, 12, 15, 16],
  ERR_TORSO_LEAN: [5, 6, 11, 12],
  torso_lean: [5, 6, 11, 12],
  ERR_SPINE_SWAY: [5, 6, 11, 12],
  spine_sway: [5, 6, 11, 12],

  // Elbows & Arms
  ERR_BENT_ELBOW_CHEAT: [5, 6, 7, 8, 9, 10],
  bent_elbow_cheat: [5, 6, 7, 8, 9, 10],
  ERR_ELBOW_ANGLE_TOO_LOW: [5, 7, 9, 6, 8, 10],
  ERR_ELBOW_FLARE: [5, 6, 7, 8],
  elbow_flare: [5, 6, 7, 8],
  ERR_ELBOW_SWAY: [7, 8],
  elbow_sway: [7, 8],
  elbow_angle: [7, 8],
  elbow_position: [7, 8],

  // Wrists & Hands
  ERR_WRIST_SYMMETRY: [9, 10],
  wrist_symmetry: [9, 10],
  ERR_HAND_WIDTH_RATIO_TOO_HIGH: [9, 10, 5, 6],
  ERR_BAR_DRIFT: [9, 10],

  // Knees, Hips & Depth
  ERR_KNEE_OVER_TOE: [13, 14, 15, 16],
  knee_over_toe: [13, 14, 15, 16],
  ERR_EXCESSIVE_KNEE_FLEXION: [13, 14],
  ERR_KNEE_VALGUS: [13, 14],
  knee_angle: [13, 14],
  depth: [11, 12, 13, 14],
  ERR_INCORRECT_DEPTH: [11, 12, 13, 14],
  ERR_ANKLE_LIFT: [15, 16],

  // Pull & Neck
  ERR_KIPPING_SWING: [11, 12, 13, 14],
  ERR_NECK_PULL: [0, 1, 2, 3, 4],
};

/** Minimum visual hold duration for errors (1.2 seconds) so athletes have time to notice */
const ERROR_HOLD_MS = 1200;

export function PoseOverlay({
  activeErrors = [],
  alert,
  mirrored,
  pose,
  sourceHeight,
  sourceWidth,
}: {
  pose: Pose | null;
  sourceWidth: number;
  sourceHeight: number;
  mirrored?: boolean;
  alert?: boolean;
  activeErrors?: string[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const errorTimestampsRef = useRef<Map<string, number>>(new Map());

  const drawSkeleton = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) {
        return;
      }
      canvasRef.current = canvas;
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const now = Date.now();
      for (const err of activeErrors) {
        errorTimestampsRef.current.set(err, now);
      }

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = window.devicePixelRatio || 1;
      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const effectiveSourceWidth =
        pose?.sourceWidth && pose.sourceWidth > 0
          ? pose.sourceWidth
          : sourceWidth > 0
            ? sourceWidth
            : width > 0
              ? width
              : 1280;
      const effectiveSourceHeight =
        pose?.sourceHeight && pose.sourceHeight > 0
          ? pose.sourceHeight
          : sourceHeight > 0
            ? sourceHeight
            : height > 0
              ? height
              : 720;

      if (!pose) {
        return;
      }

      const scale = Math.min(width / effectiveSourceWidth, height / effectiveSourceHeight);
      const offsetX = (width - effectiveSourceWidth * scale) / 2;
      const offsetY = (height - effectiveSourceHeight * scale) / 2;
      const project = (x: number, y: number) => {
        const px = x * scale + offsetX;
        return { x: mirrored ? width - px : px, y: y * scale + offsetY };
      };

      const MIN_DRAW_SCORE = 0.2;

      // Clean up expired errors and extract currently active ones within the 1.2s persistence window
      const validErrors: string[] = [];
      errorTimestampsRef.current.forEach((timestamp, code) => {
        if (now - timestamp <= ERROR_HOLD_MS) {
          validErrors.push(code);
        } else {
          errorTimestampsRef.current.delete(code);
        }
      });

      // Build set of joints that have an active error
      const errorJoints = new Set<number>();
      for (const err of validErrors) {
        const key = err.trim();
        const mapped = ERROR_KEYPOINT_MAP[key] ?? ERROR_KEYPOINT_MAP[key.toLowerCase()];
        if (mapped) {
          for (const idx of mapped) {
            errorJoints.add(idx);
          }
        }
      }
      const fallbackAlert = alert && errorJoints.size === 0;

      // 1. Draw 17-keypoint skeleton edges with Targeted Color Coding
      for (const [from, to] of SKELETON_EDGES) {
        const idxA = KEYPOINT_NAMES.indexOf(from);
        const idxB = KEYPOINT_NAMES.indexOf(to);
        const a = pose.keypoints[idxA];
        const b = pose.keypoints[idxB];
        if (!a || !b || a.score < MIN_DRAW_SCORE || b.score < MIN_DRAW_SCORE) {
          continue;
        }
        const start = project(a.x, a.y);
        const end = project(b.x, b.y);
        const edgeScore = (a.score + b.score) / 2;
        const opacity = Math.min(1, Math.max(0.6, edgeScore));

        const isBoneError = fallbackAlert || (errorJoints.has(idxA) && errorJoints.has(idxB));
        const isBoneWarning = !isBoneError && (errorJoints.has(idxA) || errorJoints.has(idxB));

        // 3-tier colors: Red (Danger Error) | Amber (Warning) | Neon Green (Clean form)
        const strokeStyle = isBoneError
          ? `rgba(255, 60, 60, ${opacity})`
          : isBoneWarning
            ? `rgba(255, 165, 0, ${opacity})`
            : `rgba(0, 255, 170, ${opacity})`;

        context.strokeStyle = strokeStyle;
        context.lineWidth = isBoneError ? 5 : 4;
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
      }

      // 2. Draw 17 keypoint joint nodes (Targeted Glowing Circles)
      for (let i = 0; i < pose.keypoints.length; i++) {
        const point = pose.keypoints[i]!;
        if (point.score < MIN_DRAW_SCORE) {
          continue;
        }
        const projected = project(point.x, point.y);
        const opacity = Math.min(1, Math.max(0.7, point.score));

        const isJointError = fallbackAlert || errorJoints.has(i);
        const strokeStyle = isJointError
          ? `rgba(255, 60, 60, ${opacity})`
          : `rgba(0, 255, 170, ${opacity})`;

        // Outer colored stroke ring (larger if error for emphasis)
        context.beginPath();
        context.arc(projected.x, projected.y, isJointError ? 9 : 7, 0, Math.PI * 2);
        context.lineWidth = isJointError ? 3.5 : 2.5;
        context.strokeStyle = strokeStyle;
        context.stroke();

        // Inner glowing node (Red if error, White if normal)
        context.beginPath();
        context.arc(projected.x, projected.y, 4, 0, Math.PI * 2);
        context.fillStyle = isJointError
          ? `rgba(255, 80, 80, ${opacity})`
          : `rgba(255, 255, 255, ${opacity})`;
        context.fill();
      }
    },
    [activeErrors, alert, mirrored, pose, sourceHeight, sourceWidth],
  );

  return (
    <canvas
      aria-hidden="true"
      className="pose-overlay absolute inset-0 w-full h-full pointer-events-none z-10"
      ref={drawSkeleton}
    />
  );
}
