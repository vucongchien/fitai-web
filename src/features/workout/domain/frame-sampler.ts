/**
 * Frame plumbing shared by the motion engines: pull a frame off the <video>,
 * letterbox it to the model's input size, and measure how bright it is.
 *
 * Keeping this separate means the ONNX engine only deals with tensors and the
 * calibration loop only deals with numbers.
 */

export type LetterboxedFrame = {
  data: ImageData;
  /** Scale applied to the source frame. */
  scale: number;
  /** Padding added on each axis, in destination pixels. */
  padX: number;
  padY: number;
  sourceWidth: number;
  sourceHeight: number;
};

export class FrameSampler {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly width: number,
    private readonly height: number,
  ) {}

  /** Aspect-preserving resize into a width × height buffer. Null until the video has data. */
  grab(): LetterboxedFrame | null {
    const sourceWidth = this.video.videoWidth;
    const sourceHeight = this.video.videoHeight;
    if (sourceWidth === 0 || sourceHeight === 0) return null;

    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.context = this.canvas.getContext("2d", { willReadFrequently: true });
    }
    const context = this.context;
    if (!context) return null;

    const scale = Math.min(this.width / sourceWidth, this.height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const padX = (this.width - drawWidth) / 2;
    const padY = (this.height - drawHeight) / 2;

    context.fillStyle = "#000";
    context.fillRect(0, 0, this.width, this.height);
    context.drawImage(this.video, padX, padY, drawWidth, drawHeight);

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
    this.canvas = null;
    this.context = null;
  }
}

/** Mean luma (0-255) of every Nth pixel — cheap enough to run every frame. */
export function meanBrightness(image: ImageData, sampleEvery = 16): number {
  const { data } = image;
  let total = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4 * sampleEvery) {
    total += 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    count += 1;
  }
  return count === 0 ? 0 : total / count;
}

/** Map a keypoint from letterboxed model space back to source-frame pixels. */
export function toSourceCoords(
  x: number,
  y: number,
  frame: Pick<LetterboxedFrame, "padX" | "padY" | "scale">,
): { x: number; y: number } {
  return { x: (x - frame.padX) / frame.scale, y: (y - frame.padY) / frame.scale };
}
