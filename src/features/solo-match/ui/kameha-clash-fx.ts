"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

// Kameha VFX Clash Engine: springs, squash & stretch, anime smoke puffs, and slash bursts for duel clash.

const TAU = Math.PI * 2;
const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const rnd = (a = 1, b?: number): number =>
  b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const out = (t: number): number => 1 - (1 - t) ** 3;
const inn = (t: number): number => t * t * t;
const back = (t: number): number => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;

export class KamehaSpring {
  d: number;
  k: number;
  to: number;
  v = 0;
  x: number;

  constructor(x = 0, k = 420, d = 30) {
    this.x = x;
    this.to = x;
    this.k = k;
    this.d = d;
  }

  step(dt: number): number {
    if (!(dt > 0)) return this.x;
    const n = Math.ceil(dt / 0.008);
    const h = dt / n;
    for (let i = n; i > 0; i -= 1) {
      this.v += (-this.k * (this.x - this.to) - this.d * this.v) * h;
      this.x += this.v * h;
    }
    return this.x;
  }
}

const P = {
  accent: "#ff5fa8",
  fill: "#ffffff",
  ink: "#1d1a4a",
  line: "#5a4fd8",
  shade: "#b8b3ff",
};

interface Particle {
  dead?: boolean;
  draw: (progress: number, time: number, dt: number) => void;
  life: number;
  t: number;
}

export class KamehaVfxEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private lastTime = 0;
  private live: Particle[] = [];
  private rafId: number | null = null;
  private running = false;
  private timers: Array<{ at: number; fn: () => void }> = [];
  now = 0;

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
  }

  detach() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.live = [];
    this.timers = [];
    this.canvas = null;
    this.ctx = null;
  }

  resize() {
    if (!this.canvas) return;
    this.dpr = Math.min(2.5, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const w = typeof window !== "undefined" ? window.innerWidth : 800;
    const h = typeof window !== "undefined" ? window.innerHeight : 600;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
  }

  private add(life: number, draw: Particle["draw"]): Particle {
    const p: Particle = { draw, life, t: 0 };
    this.live.push(p);
    this.start();
    return p;
  }

  later(ms: number, fn: () => void) {
    this.timers.push({ at: this.now + ms / 1000, fn });
    this.start();
  }

  private start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = typeof performance !== "undefined" ? performance.now() : 0;
    this.rafId = requestAnimationFrame((ms) => this.loop(ms));
  }

  private loop(ms: number) {
    if (!this.running) return;
    const dt = clamp((ms - this.lastTime) / 1000, 0, 0.034);
    this.lastTime = ms;
    this.advance(dt);
    if (!this.live.length && !this.timers.length) {
      this.running = false;
      this.rafId = null;
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      return;
    }
    this.rafId = requestAnimationFrame((nextMs) => this.loop(nextMs));
  }

  private advance(dt: number) {
    this.now += dt;
    const due = this.timers.filter((q) => q.at <= this.now).sort((a, b) => a.at - b.at);
    if (due.length) {
      for (const q of due) {
        const idx = this.timers.indexOf(q);
        if (idx >= 0) this.timers.splice(idx, 1);
        q.fn();
      }
    }
    this.tick(dt);
  }

  private tick(dt: number) {
    const g = this.ctx;
    const c = this.canvas;
    if (!g || !c) return;

    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, c.width / this.dpr, c.height / this.dpr);
    g.lineJoin = "round";
    g.lineCap = "round";

    this.live = this.live.filter((p) => !p.dead && (p.t += dt) < p.life);
    for (const p of this.live) {
      g.save();
      p.draw(p.t / p.life, p.t, dt);
      g.restore();
    }
  }

  blob(
    cs: Array<[number, number, number]>,
    lw = 1.5,
    opts: { arcs?: boolean; deep?: number; lx?: number } = {},
  ) {
    const g = this.ctx;
    if (!g) return;
    const { arcs = false, deep = 1, lx = -1 } = opts;
    const u = new Path2D();
    for (const [x, y, r] of cs) {
      if (r > 0.3) {
        u.moveTo(x + r, y);
        u.arc(x, y, r, 0, TAU);
      }
    }
    g.save();
    g.lineWidth = lw * 2;
    g.strokeStyle = P.line;
    g.stroke(u);
    g.restore();

    g.save();
    g.clip(u);
    g.fillStyle = P.shade;
    g.fillRect(-1e4, -1e4, 2e4, 2e4);
    const r = cs[0] ? cs[0][2] : 8;
    g.save();
    g.translate(lx * r * 0.2 * deep, -r * 0.26 * deep);
    g.fillStyle = P.fill;
    g.fill(u);
    g.restore();

    if (arcs) {
      g.strokeStyle = P.line;
      g.lineWidth = lw * 0.75;
      g.beginPath();
      for (const [x, y, rr] of cs) {
        if (rr > 3) {
          g.moveTo(x + Math.cos(-2.7) * rr, y + Math.sin(-2.7) * rr);
          g.arc(x, y, rr, -2.7, -0.5);
        }
      }
      g.stroke();
    }
    g.restore();
  }

  shape(path: Path2D, lw = 1.5, off = 3, fill = P.fill) {
    const g = this.ctx;
    if (!g) return;
    g.save();
    g.lineWidth = lw * 2;
    g.strokeStyle = P.line;
    g.stroke(path);
    g.restore();

    g.save();
    g.clip(path);
    g.fillStyle = P.shade;
    g.fillRect(-1e4, -1e4, 2e4, 2e4);
    g.translate(-off * 0.7, -off);
    g.fillStyle = fill;
    g.fill(path);
    g.restore();
  }

  puff(
    x: number,
    y: number,
    {
      life = 0.8,
      n = 5,
      size = 13,
      spread = 1,
      vx = 0,
      vy = -18,
    }: {
      life?: number;
      n?: number;
      size?: number;
      spread?: number;
      vx?: number;
      vy?: number;
    } = {},
  ) {
    const lobes = Array.from({ length: n }, (_, i) => ({
      a: (i / n) * TAU + rnd(0.6),
      d: rnd(0.25, 0.9) * size * spread,
      ph: rnd(TAU),
      r: rnd(0.55, 1) * size,
      sp: rnd(0.6, 1.3),
    }));
    lobes.unshift({ a: 0, d: 0, ph: 0, r: size, sp: 1 });

    this.add(life, (k, t) => {
      const grow = back(clamp(t / 0.22));
      const die = 1 - inn(clamp((k - 0.55) / 0.45));
      const px = x + vx * out(k) * life;
      const py = y + vy * out(k) * life;

      this.blob(
        lobes.map((l) => [
          px + Math.cos(l.a + t * 0.9 * l.sp) * l.d * (0.5 + out(k) * 0.9),
          py + Math.sin(l.a + t * 0.9 * l.sp) * l.d * (0.5 + out(k) * 0.9) - out(k) * 5 * l.sp,
          l.r * grow * die * (1 + Math.sin(t * 9 + l.ph) * 0.05),
        ]),
        1.5,
        { arcs: size > 6.5, deep: 1.5, lx: 0.5 },
      );
    });
  }

  burst(
    x: number,
    y: number,
    { life = 0.34, r = 44, spikes = 13 }: { life?: number; r?: number; spikes?: number } = {},
  ) {
    const g = this.ctx;
    if (!g) return;
    const j = Array.from({ length: spikes * 2 }, (_, i) =>
      i % 2 ? rnd(0.34, 0.5) : rnd(0.75, 1.15),
    );
    const rot = rnd(TAU);
    const pins = Array.from({ length: 8 }, (_, i) => ({
      a: (i / 8) * TAU + rnd(0.5),
      l: rnd(1.25, 1.75),
      w: rnd(0.03, 0.055),
    }));

    const star = (R: number, turn: number, inner = 1) => {
      const p = new Path2D();
      j.forEach((m, i) => {
        const a = rot + turn + (i / j.length) * TAU;
        const rr = R * (i % 2 ? m * inner : m);
        p[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      });
      p.closePath();
      return p;
    };

    this.add(life, (k) => {
      const gCurrent = this.ctx;
      if (!gCurrent) return;
      const R = r * out(clamp(k / 0.3));
      const hollow = 1 + inn(clamp((k - 0.35) / 0.65)) * 1.3;
      const r0 = R * 0.6 * Math.min(1.9, hollow);

      gCurrent.save();
      gCurrent.fillStyle = P.accent;
      gCurrent.beginPath();
      for (const n of pins) {
        const l = R * n.l;
        if (l <= r0) continue;
        gCurrent.moveTo(x + Math.cos(n.a - n.w) * r0, y + Math.sin(n.a - n.w) * r0);
        gCurrent.lineTo(x + Math.cos(n.a) * l, y + Math.sin(n.a) * l);
        gCurrent.lineTo(x + Math.cos(n.a + n.w) * r0, y + Math.sin(n.a + n.w) * r0);
      }
      gCurrent.fill();
      gCurrent.restore();

      const big = star(R * 1.16, 0.19, hollow);
      gCurrent.save();
      gCurrent.fillStyle = P.shade;
      gCurrent.fill(big);
      gCurrent.strokeStyle = P.line;
      gCurrent.lineWidth = 1.2;
      gCurrent.stroke(big);
      gCurrent.restore();

      this.shape(star(R * 0.84, 0, hollow), 1.4, 3);
    });
  }

  shards(
    x: number,
    y: number,
    {
      arc = Math.PI,
      dir = -Math.PI / 2,
      grav = 420,
      life = 0.75,
      n = 7,
      size = 5,
      speed = 190,
    }: {
      arc?: number;
      dir?: number;
      grav?: number;
      life?: number;
      n?: number;
      size?: number;
      speed?: number;
    } = {},
  ) {
    const g = this.ctx;
    if (!g) return;
    for (let i = 0; i < n; i += 1) {
      const a = dir + rnd(-arc, arc) / 2;
      const v = speed * rnd(0.5, 1.15);
      const s = size * rnd(0.6, 1.4);
      const spin = rnd(-7, 7);
      const pts = [
        [-1.4, 0.1],
        [-0.6, -0.7],
        [1.2, -0.45],
        [1.5, 0.15],
        [0.4, 0.75],
      ].map(([px, py]) => [px * rnd(0.8, 1.2), py * rnd(0.8, 1.2)]);

      this.add(life * rnd(0.7, 1), (k, t) => {
        const gCurrent = this.ctx;
        if (!gCurrent) return;
        const px = x + Math.cos(a) * v * t;
        const py = y + Math.sin(a) * v * t + grav * t * t;
        const sc = s * (1 - inn(clamp((k - 0.6) / 0.4)));

        gCurrent.translate(px, py);
        gCurrent.rotate(spin * t + a);
        const p = new Path2D();
        pts.forEach(([u, w], q) => p[q ? "lineTo" : "moveTo"](u * sc, w * sc));
        p.closePath();
        this.shape(p, 1.1, sc * 0.45, P.fill);

        if (sc > 2.5) {
          gCurrent.strokeStyle = P.line;
          gCurrent.lineWidth = 0.9;
          gCurrent.beginPath();
          gCurrent.moveTo(pts[1][0] * sc, pts[1][1] * sc);
          gCurrent.lineTo(pts[4][0] * sc, pts[4][1] * sc);
          gCurrent.stroke();
        }
      });
    }
  }

  slash(
    x: number,
    y: number,
    {
      ang = -0.5,
      col,
      len = 110,
      life = 0.42,
      thick = 15,
    }: {
      ang?: number;
      col?: string;
      len?: number;
      life?: number;
      thick?: number;
    } = {},
  ) {
    const R = len * 0.9;
    const cx = x - Math.cos(ang - Math.PI / 2) * R * 0.86;
    const cy = y - Math.sin(ang - Math.PI / 2) * R * 0.86;
    const a0 = ang - Math.PI / 2 - 0.62;
    const sweep = 1.24;
    const c = col || P.accent;

    this.add(life, (k) => {
      const gCurrent = this.ctx;
      if (!gCurrent) return;
      const head = out(clamp(k / 0.42));
      const tail = inn(clamp((k - 0.22) / 0.78));
      if (head - tail < 0.01) return;

      const cres = (T: number) => {
        const p = new Path2D();
        const N = 26;
        for (let i = 0; i <= N; i += 1) {
          const u = lerp(tail, head, i / N);
          const a = a0 + sweep * u;
          p[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        }
        for (let i = N; i >= 0; i -= 1) {
          const q = i / N;
          const u = lerp(tail, head, q);
          const a = a0 + sweep * u;
          const rr = R - T * Math.sin(q * Math.PI) ** 0.7;
          p.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        p.closePath();
        return p;
      };

      gCurrent.save();
      gCurrent.fillStyle = c;
      gCurrent.fill(cres(thick));
      gCurrent.restore();
      gCurrent.fillStyle = P.fill;
      gCurrent.fill(cres(thick * 0.42));
      gCurrent.strokeStyle = P.line;
      gCurrent.lineWidth = 1.3;
      gCurrent.stroke(cres(thick));
    });
  }

  lines(
    x: number,
    y: number,
    {
      dir = Math.PI,
      len = 46,
      life = 0.3,
      n = 7,
      spread = 26,
    }: {
      dir?: number;
      len?: number;
      life?: number;
      n?: number;
      spread?: number;
    } = {},
  ) {
    for (let i = 0; i < n; i += 1) {
      const o = rnd(-spread, spread);
      const l = len * rnd(0.5, 1.3);
      const d = rnd(0, 0.25);
      const w = rnd(1, 2.6);
      this.add(life, (k) => {
        const gCurrent = this.ctx;
        if (!gCurrent) return;
        const kk = clamp((k - d) / (1 - d));
        const a = out(kk);
        const b = inn(kk);
        const px = x - Math.sin(dir) * o;
        const py = y + Math.cos(dir) * o;
        gCurrent.strokeStyle = P.line;
        gCurrent.lineWidth = w * (1 - b);
        gCurrent.beginPath();
        gCurrent.moveTo(px + Math.cos(dir) * l * b * 1.4, py + Math.sin(dir) * l * b * 1.4);
        gCurrent.lineTo(
          px + Math.cos(dir) * l * (0.2 + a * 1.2),
          py + Math.sin(dir) * l * (0.2 + a * 1.2),
        );
        if (kk > 0) gCurrent.stroke();
      });
    }
  }

  ticks(
    x: number,
    y: number,
    {
      dir = -0.9,
      fan = 0.42,
      len = 9,
      life = 0.4,
      n = 3,
      r = 16,
    }: {
      dir?: number;
      fan?: number;
      len?: number;
      life?: number;
      n?: number;
      r?: number;
    } = {},
  ) {
    this.add(life, (k) => {
      const gCurrent = this.ctx;
      if (!gCurrent) return;
      const a = out(clamp(k / 0.5));
      const b = inn(clamp((k - 0.4) / 0.6));
      gCurrent.save();
      gCurrent.fillStyle = P.accent;
      gCurrent.beginPath();
      for (let i = 0; i < n; i += 1) {
        const an = dir + (i - (n - 1) / 2) * fan;
        const r0 = r + len * b * 1.25;
        const r1 = r + len * a * 1.25;
        const hw = 0.07 + 2.2 / (r1 + 8);
        if (r1 - r0 < 0.6) continue;
        gCurrent.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0);
        gCurrent.lineTo(x + Math.cos(an - hw) * r1, y + Math.sin(an - hw) * r1);
        gCurrent.lineTo(x + Math.cos(an + hw) * r1, y + Math.sin(an + hw) * r1);
        gCurrent.closePath();
      }
      gCurrent.fill();
      gCurrent.restore();
    });
  }

  wob(
    x: number,
    y: number,
    { dir = 1, life = 0.45, r = 16 }: { dir?: number; life?: number; r?: number } = {},
  ) {
    this.add(life, (k) => {
      const gCurrent = this.ctx;
      if (!gCurrent) return;
      gCurrent.strokeStyle = P.line;
      gCurrent.lineWidth = 2.2 * (1 - k);
      if (gCurrent.lineWidth < 0.2) return;
      gCurrent.beginPath();
      for (const d of [0, 7]) {
        const rr = r + d + out(k) * 8;
        const c = dir > 0 ? 0 : Math.PI;
        gCurrent.moveTo(x - dir * r + Math.cos(c - 0.45) * rr, y + Math.sin(c - 0.45) * rr);
        gCurrent.arc(x - dir * r, y, rr, c - 0.45, c + 0.45);
      }
      gCurrent.stroke();
    });
  }

  sfxText(
    text: string,
    x: number,
    y: number,
    {
      col = "#ffffff",
      edge = "#1d1a4a",
      fontSize = 28,
      life = 0.85,
      rot = 0.06,
      size = 1,
    }: {
      col?: string;
      edge?: string;
      fontSize?: number;
      life?: number;
      rot?: number;
      size?: number;
    } = {},
  ) {
    if (typeof document === "undefined") return;
    const pad = 16;
    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    offCtx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
    const metrics = offCtx.measureText(text);
    const w = Math.ceil(metrics.width) + pad * 2;
    const h = fontSize * 1.5 + pad * 2;
    offscreen.width = w;
    offscreen.height = h;

    offCtx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.lineJoin = "round";
    offCtx.lineWidth = 5;
    offCtx.strokeStyle = edge;
    offCtx.strokeText(text, w / 2, h / 2);
    offCtx.fillStyle = col;
    offCtx.fillText(text, w / 2, h / 2);

    const s = new KamehaSpring(0.2, 520, 17);
    s.to = 1;
    let lastT = 0;

    this.add(life, (k, t) => {
      const gCurrent = this.ctx;
      if (!gCurrent) return;
      const sc = s.step(t - lastT) * (1 - inn(clamp((k - 0.86) / 0.14))) * size;
      lastT = t;

      gCurrent.save();
      gCurrent.translate(x + Math.sin(t * 31) * 0.8, y + Math.cos(t * 27) * 0.8);
      gCurrent.rotate(rot + Math.sin(t * 6) * 0.03);
      gCurrent.drawImage(
        offscreen,
        (-offscreen.width / 2) * sc,
        (-offscreen.height / 2) * sc,
        offscreen.width * sc,
        offscreen.height * sc,
      );
      gCurrent.restore();
    });
  }
}

export function useKamehaTugClash({
  canvasRef,
  dividerRef,
  isTieActive,
  myShare,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  dividerRef: React.RefObject<HTMLDivElement | null>;
  isTieActive: boolean;
  myShare: number;
}) {
  const engineRef = useRef<KamehaVfxEngine | null>(null);
  const springRef = useRef<KamehaSpring | null>(null);
  const stateRef = useRef({
    acc: 0,
    lastTime: 0,
    peak: 0,
    t: 0,
  });

  const subscribe = useCallback(() => {
    if (typeof window === "undefined") return () => {};
    const canvas = canvasRef.current;
    if (!canvas) return () => {};

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return () => {};
    }

    if (!engineRef.current) {
      const engine = new KamehaVfxEngine();
      engine.attach(canvas);
      engineRef.current = engine;
    }

    const engine = engineRef.current;
    engine.attach(canvas);

    const target = myShare / 100;
    if (springRef.current === null) {
      springRef.current = new KamehaSpring(target, 420, 30);
    } else {
      springRef.current.to = target;
    }

    // Tie struggle dual puffs
    if (isTieActive && dividerRef.current) {
      const rect = dividerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;

      engine.puff(cx - 18, cy, {
        life: 0.65,
        n: 4,
        size: 9,
        vx: -28,
        vy: -14,
      });
      engine.puff(cx + 18, cy, {
        life: 0.65,
        n: 4,
        size: 9,
        vx: 28,
        vy: -14,
      });
      engine.shards(cx, cy, { arc: Math.PI, n: 3, size: 3.5, speed: 120 });
    }

    const handleResize = () => engine.resize();
    window.addEventListener("resize", handleResize);

    let rafId: number | null = null;
    stateRef.current.lastTime = typeof performance !== "undefined" ? performance.now() : 0;

    const loop = (time: number) => {
      const dt = clamp((time - stateRef.current.lastTime) / 1000, 0, 0.034);
      stateRef.current.lastTime = time;
      stateRef.current.t += dt;

      const spring = springRef.current;
      const divider = dividerRef.current;

      if (spring && divider) {
        spring.step(dt);
        const v = spring.v;
        const st = 1 + Math.min(1.5, Math.abs(v) * 0.3);

        const inner = divider.firstElementChild as HTMLElement | null;
        if (inner) {
          inner.style.transform = `scale(${st}, ${1 / Math.sqrt(st)})`;
        }

        if (Math.abs(v) > Math.abs(stateRef.current.peak)) {
          stateRef.current.peak = v;
        } else {
          stateRef.current.peak *= 0.96;
        }

        if (Math.abs(v) > 0.35) {
          stateRef.current.acc += dt * Math.abs(v) * 20;
          const rect = divider.getBoundingClientRect();
          const cx = rect.left + rect.width * 0.5;
          const cy = rect.top + rect.height * 0.5;
          const dir = Math.sign(v) || 1;
          const big = Math.min(1, Math.abs(v) / 2.4);

          while (stateRef.current.acc > 1) {
            stateRef.current.acc -= 1;
            engine.puff(cx - dir * rnd(14, 30), cy - rnd(2, 12) - big * 8, {
              life: rnd(0.7, 1.15),
              n: 4,
              size: rnd(6, 9) + big * 9,
              vx: -dir * rnd(26, 70),
              vy: -rnd(22, 58) * (0.5 + big),
            });
            engine.lines(cx - dir * 16, cy + rnd(-4, 12), {
              dir: dir > 0 ? Math.PI : 0,
              len: 50 + big * 50,
              life: 0.24,
              n: 1,
              spread: 2,
            });
            if (Math.random() < 0.3) {
              engine.shards(cx - dir * 20, cy + 6, {
                arc: 1,
                dir: dir > 0 ? Math.PI + 0.5 : -0.5,
                n: 1,
                size: 3.5,
                speed: 120,
              });
            }
          }
        }

        if (Math.abs(stateRef.current.peak) > 1.3 && Math.abs(v) < 0.1) {
          const dir = Math.sign(stateRef.current.peak) || 1;
          const rect = divider.getBoundingClientRect();
          const cx = rect.left + rect.width * 0.5;
          const cy = rect.top + rect.height * 0.5;

          engine.slash(cx + dir * 34, cy, {
            ang: dir > 0 ? 0 : Math.PI,
            col: "#b8b3ff",
            len: 150,
            life: 0.5,
            thick: 12,
          });
          engine.burst(cx + dir * 4, cy, { life: 0.28, r: 24, spikes: 11 });
          engine.shards(cx + dir * 10, cy, {
            arc: 2.4,
            dir: dir > 0 ? 0 : Math.PI,
            n: 4,
            size: 4,
          });
          engine.ticks(cx + dir * 52, cy - 30, {
            dir: dir > 0 ? -0.6 : -2.5,
            len: 10,
            life: 0.4,
            n: 3,
            r: 4,
          });
          engine.later(520, () => {
            engine.puff(cx - dir * 60, cy - 34, {
              life: 0.8,
              n: 4,
              size: 11,
              vy: -10,
            });
            engine.puff(cx - dir * 22, cy - 22, {
              life: 0.6,
              n: 3,
              size: 6,
              vy: -8,
            });
            engine.wob(cx - dir * 82, cy - 34, { dir: -1, r: 9 });
          });
          stateRef.current.peak = 0;
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
      engine.detach();
      engineRef.current = null;
    };
  }, [canvasRef, dividerRef, isTieActive, myShare]);

  useSyncExternalStore(
    subscribe,
    () => 0,
    () => 0,
  );
}

let globalEngine: KamehaVfxEngine | null = null;

function getGlobalEngine(): KamehaVfxEngine | null {
  if (typeof document === "undefined" || !document.body) return null;
  if (!globalEngine) {
    let canvas = document.querySelector<HTMLCanvasElement>("canvas.kameha-fx-global");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "kameha-fx-global";
      canvas.style.cssText =
        "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:99999;";
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
    }
    const engine = new KamehaVfxEngine();
    engine.attach(canvas);
    window.addEventListener("resize", () => engine.resize());
    globalEngine = engine;
  }
  return globalEngine;
}

export interface KamehaCheerOptions {
  col?: string;
  edge?: string;
  size?: number;
  text?: string;
}

// Reusable cheer/streak trigger replicating the exact Sakuga Radio popup effect
export function triggerKamehaCheer(
  target: { x: number; y: number } | HTMLElement,
  options: KamehaCheerOptions = {},
) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const engine = getGlobalEngine();
  if (!engine) return;

  const coords =
    target instanceof HTMLElement
      ? (() => {
          const rect = target.getBoundingClientRect();
          return {
            x: rect.left + rect.width * 0.5,
            y: rect.top + rect.height * 0.5,
          };
        })()
      : target;

  const { x, y } = coords;
  const { col = "#ffffff", edge = "#1d1a4a", size = 1, text = "NICE!" } = options;

  // 1. Ticks: Fan of wedges shooting outward
  engine.ticks(x, y, {
    dir: -2.3,
    fan: 0.36,
    len: 15 * size,
    life: 0.5,
    n: 4,
    r: 20 * size,
  });

  // 2. Speed lines shooting upward-diagonal
  engine.lines(x - 26 * size, y + 18 * size, {
    dir: 2.6,
    len: 26 * size,
    life: 0.3,
    n: 3,
    spread: 6 * size,
  });

  // 3. First puff drifting away
  engine.puff(x + 26 * size, y - 22 * size, {
    life: 0.7,
    n: 3,
    size: 8 * size,
    vx: 16,
    vy: -14,
  });

  // 4. Second puff delayed (120ms) drifting further
  engine.later(120, () => {
    engine.puff(x + 78 * size, y + 2 * size, {
      life: 0.6,
      n: 3,
      size: 7 * size,
      vx: 10,
      vy: -10,
    });
  });

  // 5. Popping manga / cheer SFX text bouncing in with wobble
  engine.sfxText(text, x + 68 * size, y - 68 * size, {
    col,
    edge,
    fontSize: 26 * size,
    life: 0.85,
    rot: 0.06,
    size: 1,
  });
}
