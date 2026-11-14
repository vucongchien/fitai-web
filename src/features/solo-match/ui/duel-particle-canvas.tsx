"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

interface Particle {
  color: string;
  life: number;
  maxLife: number;
  size: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

export interface DuelParticleCanvasProps {
  lastMilestone?: number | null;
  lastRepConfirmedAtMs?: number;
  myValue: number;
  opponentValue: number;
}

const BURST_COLORS = ["#38bdf8", "#3b82f6", "#34d399", "#fbbf24", "#f43f5e", "#ffffff"];

export function DuelParticleCanvas({
  lastMilestone = null,
  lastRepConfirmedAtMs = 0,
  myValue,
  opponentValue,
}: DuelParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const prevValuesRef = useRef({ lastRepConfirmedAtMs, myValue, opponentValue });

  const subscribeParticles = useCallback(() => {
    const prev = prevValuesRef.current;
    const repTriggered =
      lastRepConfirmedAtMs > 0 && lastRepConfirmedAtMs !== prev.lastRepConfirmedAtMs;
    const tookLead = prev.myValue <= prev.opponentValue && myValue > opponentValue;
    prevValuesRef.current = { lastRepConfirmedAtMs, myValue, opponentValue };

    if (!repTriggered && !tookLead) {
      return () => {};
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return () => {};
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return () => {};
    }

    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.clientWidth || 360;
    const height = rect.height || canvas.clientHeight || 480;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return () => {};
    }

    const isCelebration = Boolean(lastMilestone) || tookLead;
    const count = isCelebration ? 28 : 16;
    const originX = isCelebration ? width * 0.5 : width * 0.88;
    const originY = isCelebration ? height * 0.16 : height * 0.45;

    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = (isCelebration ? 3.2 : 2.2) + Math.random() * 3.5;
      particlesRef.current.push({
        color: BURST_COLORS[i % BURST_COLORS.length],
        life: 0,
        maxLife: 28 + Math.floor(Math.random() * 18),
        size: 2.5 + Math.random() * 3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        x: originX,
        y: originY,
      });
    }

    if (rafIdRef.current === null) {
      const tick = () => {
        const list = particlesRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = list.length - 1; i >= 0; i -= 1) {
          const p = list[i];
          p.life += 1;
          if (p.life >= p.maxLife) {
            list.splice(i, 1);
            continue;
          }
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.14;

          const alpha = Math.max(0, 1 - p.life / p.maxLife);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        if (list.length > 0) {
          rafIdRef.current = requestAnimationFrame(tick);
        } else {
          rafIdRef.current = null;
        }
      };

      rafIdRef.current = requestAnimationFrame(tick);
    }

    return () => {};
  }, [lastMilestone, lastRepConfirmedAtMs, myValue, opponentValue]);

  useSyncExternalStore(
    subscribeParticles,
    () => 0,
    () => 0,
  );

  const handleCanvasRef = useCallback((el: HTMLCanvasElement | null) => {
    canvasRef.current = el;
    if (!el && rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  return (
    <canvas
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-25 h-full w-full"
      data-testid="duel-particle-canvas"
      ref={handleCanvasRef}
    />
  );
}
