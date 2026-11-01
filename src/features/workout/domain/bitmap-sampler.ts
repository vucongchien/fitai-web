// FrameSampler twin for worker side with dynamic ROI cropping

import { letterboxLayout } from "@/features/workout/domain/frame-sampler";
import type { LetterboxedFrame } from "@/features/workout/domain/frame-sampler";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CroppedLetterboxedFrame extends LetterboxedFrame {
  cropOffset?: { x: number; y: number };
}

// Compute dynamic bounding box with margin around keypoints
export function computeRoiCrop(
  keypoints: { x: number; y: number; score: number }[],
  sourceWidth: number,
  sourceHeight: number,
  paddingFactor = 0.35,
): CropRect | null {
  const valid = keypoints.filter((k) => k.score >= 0.3);
  if (valid.length < 5) {
    return null;
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const k of valid) {
    if (k.x < minX) minX = k.x;
    if (k.x > maxX) maxX = k.x;
    if (k.y < minY) minY = k.y;
    if (k.y > maxY) maxY = k.y;
  }

  const boxW = maxX - minX;
  const boxH = maxY - minY;
  if (boxW < 20 || boxH < 20) {
    return null;
  }

  const padW = boxW * paddingFactor;
  const padH = boxH * paddingFactor;

  const cropX = Math.max(0, minX - padW);
  const cropY = Math.max(0, minY - padH);
  const cropW = Math.min(sourceWidth - cropX, boxW + 2 * padW);
  const cropH = Math.min(sourceHeight - cropY, boxH + 2 * padH);

  if (cropW >= sourceWidth * 0.85 && cropH >= sourceHeight * 0.85) {
    return null;
  }

  return {
    height: Math.round(cropH),
    width: Math.round(cropW),
    x: Math.round(cropX),
    y: Math.round(cropY),
  };
}

export class BitmapSampler {
  private canvas: OffscreenCanvas;
  private context: OffscreenCanvasRenderingContext2D | null;

  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {
    this.canvas = new OffscreenCanvas(width, height);
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
    if (this.context) {
      this.context.imageSmoothingEnabled = true;
      this.context.imageSmoothingQuality = "high";
    }
  }

  /** Closes `bitmap` before returning — the caller must not reuse it. */
  grab(bitmap: ImageBitmap, crop?: CropRect | null): CroppedLetterboxedFrame | null {
    const { context } = this;
    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;
    if (!context || sourceWidth === 0 || sourceHeight === 0) {
      bitmap.close();
      return null;
    }

    const cropX = crop ? Math.max(0, Math.min(crop.x, sourceWidth - 10)) : 0;
    const cropY = crop ? Math.max(0, Math.min(crop.y, sourceHeight - 10)) : 0;
    const cropW = crop ? Math.max(10, Math.min(crop.width, sourceWidth - cropX)) : sourceWidth;
    const cropH = crop ? Math.max(10, Math.min(crop.height, sourceHeight - cropY)) : sourceHeight;

    const { drawHeight, drawWidth, padX, padY, scale } = letterboxLayout(
      cropW,
      cropH,
      this.width,
      this.height,
    );

    context.fillStyle = "#000";
    context.fillRect(0, 0, this.width, this.height);
    if (crop) {
      context.drawImage(bitmap, cropX, cropY, cropW, cropH, padX, padY, drawWidth, drawHeight);
    } else {
      context.drawImage(bitmap, padX, padY, drawWidth, drawHeight);
    }
    bitmap.close();

    return {
      cropOffset: crop ? { x: cropX, y: cropY } : undefined,
      data: context.getImageData(0, 0, this.width, this.height),
      padX,
      padY,
      scale,
      sourceHeight,
      sourceWidth,
    };
  }

  dispose(): void {
    this.context = null;
  }
}
