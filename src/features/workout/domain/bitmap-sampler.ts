/**
 * FrameSampler's twin for the worker side.
 *
 * FrameSampler pulls from an <video> through a DOM canvas; this pulls from a
 * transferred ImageBitmap through an OffscreenCanvas. Both use letterboxLayout,
 * so a keypoint decoded here maps back to source pixels with toSourceCoords
 * exactly as it did on the main thread.
 *
 * The expensive part — getImageData, which forces a GPU readback — happens here
 * rather than on the main thread. That is the whole point of the move.
 */

import { letterboxLayout } from "@/features/workout/domain/frame-sampler";
import type { LetterboxedFrame } from "@/features/workout/domain/frame-sampler";

export class BitmapSampler {
  private canvas: OffscreenCanvas;
  private context: OffscreenCanvasRenderingContext2D | null;

  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {
    this.canvas = new OffscreenCanvas(width, height);
    this.context = this.canvas.getContext("2d", { willReadFrequently: true });
  }

  /** Closes `bitmap` before returning — the caller must not reuse it. */
  grab(bitmap: ImageBitmap): LetterboxedFrame | null {
    const { context } = this;
    const sourceWidth = bitmap.width;
    const sourceHeight = bitmap.height;
    if (!context || sourceWidth === 0 || sourceHeight === 0) {
      bitmap.close();
      return null;
    }

    const { drawHeight, drawWidth, padX, padY, scale } = letterboxLayout(
      sourceWidth,
      sourceHeight,
      this.width,
      this.height,
    );

    context.fillStyle = "#000";
    context.fillRect(0, 0, this.width, this.height);
    context.drawImage(bitmap, padX, padY, drawWidth, drawHeight);
    bitmap.close();

    return {
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
