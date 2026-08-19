"use client";

import { useEffect, useRef } from "react";

import {
  KEYPOINT_NAMES,
  SKELETON_EDGES,
} from "@/features/workout/domain/pose-metrics";
import type { Pose } from "@/features/workout/domain/pose-metrics";

/**
 * The 17-point skeleton drawn over the camera feed (FR-CC-01, FR-CC-04 visual half).
 *
 * Keypoints arrive in source-frame pixels, so the canvas scales them to whatever
 * size the video is actually displayed at. Turns red while a form error is live.
 */
export function PoseOverlay({
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
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
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

    // The video is object-fit: contain, so mirror that maths here.
    const scale = Math.min(width / effectiveSourceWidth, height / effectiveSourceHeight);
    const offsetX = (width - effectiveSourceWidth * scale) / 2;
    const offsetY = (height - effectiveSourceHeight * scale) / 2;
    const project = (x: number, y: number) => {
      const px = x * scale + offsetX;
      return { x: mirrored ? width - px : px, y: y * scale + offsetY };
    };

    const MIN_DRAW_SCORE = 0.1;
    context.lineWidth = 4;

    // 1. Draw 17-keypoint skeleton edges from MMPose/RTMPose
    for (const [from, to] of SKELETON_EDGES) {
      const a = pose.keypoints[KEYPOINT_NAMES.indexOf(from)];
      const b = pose.keypoints[KEYPOINT_NAMES.indexOf(to)];
      if (!a || !b || a.score < MIN_DRAW_SCORE || b.score < MIN_DRAW_SCORE) {
        continue;
      }
      const start = project(a.x, a.y);
      const end = project(b.x, b.y);
      const edgeScore = (a.score + b.score) / 2;
      const opacity = Math.min(1, Math.max(0.6, edgeScore));

      const strokeStyle = alert
        ? `rgba(255, 60, 60, ${opacity})`
        : `rgba(0, 255, 170, ${opacity})`;

      context.strokeStyle = strokeStyle;
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }

    // 2. Draw 17 keypoint joint nodes (glowing neon circles)
    for (const point of pose.keypoints) {
      if (point.score < MIN_DRAW_SCORE) {
        continue;
      }
      const projected = project(point.x, point.y);
      const opacity = Math.min(1, Math.max(0.7, point.score));
      const strokeStyle = alert
        ? `rgba(255, 60, 60, ${opacity})`
        : `rgba(0, 255, 170, ${opacity})`;

      // Outer colored stroke ring
      context.beginPath();
      context.arc(projected.x, projected.y, 7, 0, Math.PI * 2);
      context.lineWidth = 2.5;
      context.strokeStyle = strokeStyle;
      context.stroke();

      // Inner white node
      context.beginPath();
      context.arc(projected.x, projected.y, 4, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      context.fill();
    }
  }, [alert, mirrored, pose, sourceHeight, sourceWidth]);

  return (
    <canvas
      aria-hidden="true"
      className="pose-overlay absolute inset-0 w-full h-full pointer-events-none z-10"
      ref={canvasRef}
    />
  );
}
