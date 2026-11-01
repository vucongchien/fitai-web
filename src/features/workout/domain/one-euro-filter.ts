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

export class PoseFilter {
  private filters: { x: OneEuroFilter; y: OneEuroFilter }[] = [];

  constructor(keypointCount = 17, minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    for (let i = 0; i < keypointCount; i += 1) {
      this.filters.push({
        x: new OneEuroFilter(minCutoff, beta, dCutoff),
        y: new OneEuroFilter(minCutoff, beta, dCutoff),
      });
    }
  }

  filter(
    keypoints: { x: number; y: number; score: number }[],
    timestamp: number,
  ): { x: number; y: number; score: number }[] {
    return keypoints.map((pt, i) => {
      const f = this.filters[i];
      if (!f || pt.score < 0.2) {
        return pt;
      }
      return {
        ...pt,
        x: f.x.filter(pt.x, timestamp),
        y: f.y.filter(pt.y, timestamp),
      };
    });
  }

  reset(): void {
    for (const f of this.filters) {
      f.x.reset();
      f.y.reset();
    }
  }
}
