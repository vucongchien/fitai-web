// 1-Euro Filter for real-time keypoint smoothing (Casiez et al., CHI 2012)

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
      this.y = value;
      return value;
    }
    this.y = alpha * value + (1 - alpha) * this.s!;
    this.s = this.y;
    return this.y;
  }

  lastValue(): number | null {
    return this.y;
  }

  reset(): void {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter {
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime: number | null = null;

  constructor(
    private minCutoff = 1.0,
    private beta = 0.007,
    private dCutoff = 1.0,
  ) {}

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(value: number, timestamp: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return this.xFilter.filter(value, 1.0);
    }
    const dt = Math.max((timestamp - this.lastTime) / 1000.0, 1e-4);
    this.lastTime = timestamp;

    const prevX = this.xFilter.lastValue();
    const dx = prevX !== null ? (value - prevX) / dt : 0;
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, dt));
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(value, this.alpha(cutoff, dt));
  }

  reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

const SYMMETRIC_JOINT_PAIRS: readonly [number, number][] = [
  [5, 6],   // shoulders
  [7, 8],   // elbows
  [9, 10],  // wrists
  [11, 12], // hips
  [13, 14], // knees
  [15, 16], // ankles
];

interface JointMemory {
  x: number;
  y: number;
  score: number;
  timestamp: number;
}

export interface PoseFilterOptions {
  /** Maximum duration (ms) to coast on last valid filtered position during brief occlusion. */
  maxCoastMs?: number;
  /** Score below which a tracked joint coasts instead of jumping to raw noise. */
  coastScoreThreshold?: number;
  /** Enable left/right anti-swap continuity check in side view when limbs overlap. */
  enableAntiSwap?: boolean;
}

export class PoseFilter {
  private filters: { x: OneEuroFilter; y: OneEuroFilter }[] = [];
  private lastValid: (JointMemory | null)[] = [];
  private readonly maxCoastMs: number;
  private readonly coastScoreThreshold: number;
  private readonly enableAntiSwap: boolean;

  constructor(
    keypointCount = 17,
    minCutoff = 1.0,
    beta = 0.007,
    dCutoff = 1.0,
    options?: PoseFilterOptions,
  ) {
    this.maxCoastMs = options?.maxCoastMs ?? 160;
    this.coastScoreThreshold = options?.coastScoreThreshold ?? 0.2;
    this.enableAntiSwap = options?.enableAntiSwap ?? true;

    for (let i = 0; i < keypointCount; i += 1) {
      this.filters.push({
        x: new OneEuroFilter(minCutoff, beta, dCutoff),
        y: new OneEuroFilter(minCutoff, beta, dCutoff),
      });
      this.lastValid.push(null);
    }
  }

  private resolveAntiSwappedInput(
    keypoints: { x: number; y: number; score: number }[],
  ): { x: number; y: number; score: number }[] {
    if (!this.enableAntiSwap || keypoints.length < 17) {
      return keypoints;
    }

    const sL = this.lastValid[5];
    const sR = this.lastValid[6];
    const hL = this.lastValid[11];
    const hR = this.lastValid[12];
    if (!sL || !sR || !hL || !hR) {
      return keypoints;
    }

    const torsoLen = Math.max(
      Math.hypot(sL.x - hL.x, sL.y - hL.y),
      Math.hypot(sR.x - hR.x, sR.y - hR.y),
    );
    if (torsoLen < 1e-3) {
      return keypoints;
    }

    // Only apply anti-swap when user is in side/oblique profile where left & right limbs cross paths
    const shoulderSpan = Math.abs(sL.x - sR.x);
    if (shoulderSpan / torsoLen > 0.55) {
      return keypoints;
    }

    let cloned: { x: number; y: number; score: number }[] | null = null;
    const minJumpDist = torsoLen * 0.18;

    for (const [leftIdx, rightIdx] of SYMMETRIC_JOINT_PAIRS) {
      const prevL = this.lastValid[leftIdx];
      const prevR = this.lastValid[rightIdx];
      const curL = keypoints[leftIdx];
      const curR = keypoints[rightIdx];
      if (
        !prevL ||
        !prevR ||
        !curL ||
        !curR ||
        curL.score < this.coastScoreThreshold ||
        curR.score < this.coastScoreThreshold
      ) {
        continue;
      }

      const directCost =
        Math.hypot(curL.x - prevL.x, curL.y - prevL.y) +
        Math.hypot(curR.x - prevR.x, curR.y - prevR.y);
      const swappedCost =
        Math.hypot(curR.x - prevL.x, curR.y - prevL.y) +
        Math.hypot(curL.x - prevR.x, curL.y - prevR.y);

      if (swappedCost + minJumpDist < directCost) {
        cloned ??= keypoints.map((pt) => ({ ...pt }));
        cloned[leftIdx] = { ...curR };
        cloned[rightIdx] = { ...curL };
      }
    }

    return cloned ?? keypoints;
  }

  filter(
    keypoints: { x: number; y: number; score: number }[],
    timestamp: number,
  ): { x: number; y: number; score: number }[] {
    const ordered = this.resolveAntiSwappedInput(keypoints);

    return ordered.map((pt, i) => {
      const f = this.filters[i];
      if (!f) {
        return pt;
      }

      if (pt.score < this.coastScoreThreshold) {
        const mem = this.lastValid[i];
        if (mem && timestamp >= mem.timestamp && timestamp - mem.timestamp <= this.maxCoastMs) {
          // Short-term coasting: preserve last smoothed position instead of raw low-score outlier
          const decayFactor = Math.max(0.4, 1 - ((timestamp - mem.timestamp) / this.maxCoastMs) * 0.5);
          return {
            score: Math.max(pt.score, Number((mem.score * decayFactor).toFixed(3))),
            x: mem.x,
            y: mem.y,
          };
        }
        return pt;
      }

      const filteredX = f.x.filter(pt.x, timestamp);
      const filteredY = f.y.filter(pt.y, timestamp);
      this.lastValid[i] = {
        score: pt.score,
        timestamp,
        x: filteredX,
        y: filteredY,
      };

      return {
        ...pt,
        x: filteredX,
        y: filteredY,
      };
    });
  }

  reset(): void {
    for (let i = 0; i < this.filters.length; i += 1) {
      const f = this.filters[i];
      if (f) {
        f.x.reset();
        f.y.reset();
      }
      this.lastValid[i] = null;
    }
  }
}
