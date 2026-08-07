"use client";

import { useEffect, useRef } from "react";

import { KEYPOINT_NAMES, MIN_KEYPOINT_SCORE, SKELETON_EDGES } from '@/features/workout/domain/pose-metrics';
import type { Pose } from '@/features/workout/domain/pose-metrics';

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
    if (!canvas) {return;}
    const context = canvas.getContext("2d");
    if (!context) {return;}

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
      canvas.width = width * ratio;
      canvas.height = height * ratio;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    if (!pose || sourceWidth === 0 || sourceHeight === 0) {return;}

    // The video is object-fit: cover, so mirror that maths here.
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const offsetX = (width - sourceWidth * scale) / 2;
    const offsetY = (height - sourceHeight * scale) / 2;
    const project = (x: number, y: number) => {
      const px = x * scale + offsetX;
      return { x: mirrored ? width - px : px, y: y * scale + offsetY };
    };

    const stroke = alert ? "rgba(255, 99, 88, 0.95)" : "rgba(120, 220, 190, 0.9)";
    context.lineWidth = 3;
    context.strokeStyle = stroke;
    context.fillStyle = stroke;

    for (const [from, to] of SKELETON_EDGES) {
      const a = pose.keypoints[KEYPOINT_NAMES.indexOf(from)];
      const b = pose.keypoints[KEYPOINT_NAMES.indexOf(to)];
      if (!a || !b || a.score < MIN_KEYPOINT_SCORE || b.score < MIN_KEYPOINT_SCORE) {continue;}
      const start = project(a.x, a.y);
      const end = project(b.x, b.y);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }

    for (const point of pose.keypoints) {
      if (point.score < MIN_KEYPOINT_SCORE) {continue;}
      const projected = project(point.x, point.y);
      context.beginPath();
      context.arc(projected.x, projected.y, 4, 0, Math.PI * 2);
      context.fill();
    }
  }, [alert, mirrored, pose, sourceHeight, sourceWidth]);

  return <canvas aria-hidden="true" className="pose-overlay" ref={canvasRef} />;
}
