"use client";

import { Dumbbell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
  pullThreshold?: number;
  maxPullDistance?: number;
  activePath?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  pullThreshold = 75,
  maxPullDistance = 115,
  activePath = "/home",
}: PullToRefreshProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Only active on the designated route (e.g. /home)
  const isEnabled = !activePath || pathname === activePath;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isEnabled || isRefreshing) {
        return;
      }

      const scrollTop =
        typeof window !== "undefined" ? window.scrollY || document.documentElement.scrollTop || 0 : 0;

      if (scrollTop <= 0 && e.touches.length === 1) {
        startYRef.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    },
    [isEnabled, isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isEnabled || !isPulling || isRefreshing) {
        return;
      }

      const scrollTop =
        typeof window !== "undefined" ? window.scrollY || document.documentElement.scrollTop || 0 : 0;
      if (scrollTop > 0) {
        setIsPulling(false);
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      if (deltaY > 0) {
        const damped = Math.min(maxPullDistance, deltaY * 0.45);
        setPullDistance(damped);
      } else {
        setPullDistance(0);
      }
    },
    [isEnabled, isPulling, isRefreshing, maxPullDistance],
  );

  const handleTouchCancel = useCallback(() => {
    setIsPulling(false);
    setPullDistance(0);
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!isEnabled || !isPulling) {
      return;
    }
    setIsPulling(false);

    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold);

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          router.refresh();
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isEnabled, isPulling, pullDistance, pullThreshold, isRefreshing, onRefresh, router]);

  // Progress from 0 to 1
  const progress = Math.min(1, pullThreshold > 0 ? pullDistance / pullThreshold : 0);
  const isReadyToTrigger = progress >= 1;

  // SVG ring dimensions
  const size = 44;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Subtle content opacity reduction (down to max ~0.84 for subtle feedback)
  const contentOpacity = isEnabled && pullDistance > 0 ? 1 - progress * 0.16 : 1;

  return (
    <div
      className="pull-to-refresh-container"
      onTouchCancel={handleTouchCancel}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      ref={containerRef}
      style={{ touchAction: "pan-y", overscrollBehaviorY: "contain" }}
    >
      {/* Floating Fitness-Themed Indicator Pill (ONLY THIS DROPS DOWN) */}
      {isEnabled && (pullDistance > 0 || isRefreshing) && (
        <div
          aria-hidden="true"
          className={`pull-to-refresh-indicator ${isRefreshing ? "is-refreshing" : ""} ${isReadyToTrigger ? "is-ready" : ""}`}
          style={{
            top: "3.75rem",
            opacity: Math.min(1, progress * 1.4),
            transform: `translate3d(0, ${Math.min(pullDistance, pullThreshold)}px, 0) scale(${0.75 + progress * 0.25})`,
            transition: isPulling
              ? "none"
              : "transform 240ms cubic-bezier(0.25, 1, 0.5, 1), opacity 240ms ease",
          }}
        >
          <div className="pull-to-refresh-indicator__badge">
            {/* SVG Progress Ring */}
            <svg
              className={`pull-to-refresh-indicator__ring ${isRefreshing ? "animate-spin" : ""}`}
              height={size}
              width={size}
            >
              {/* Background Track */}
              <circle
                cx={center}
                cy={center}
                fill="none"
                r={radius}
                stroke="var(--color-border, rgba(0,0,0,0.1))"
                strokeWidth={strokeWidth}
              />
              {/* Active Progress Ring */}
              <circle
                cx={center}
                cy={center}
                fill="none"
                r={radius}
                stroke={
                  isReadyToTrigger || isRefreshing
                    ? "var(--color-action, #4b57f2)"
                    : "var(--color-text-muted, #8e8e93)"
                }
                strokeDasharray={circumference}
                strokeDashoffset={isRefreshing ? circumference * 0.25 : strokeDashoffset}
                strokeLinecap="round"
                strokeWidth={strokeWidth}
                style={{
                  transition: isPulling
                    ? "none"
                    : "stroke-dashoffset 200ms ease, stroke 200ms ease",
                  transform: "rotate(-90deg)",
                  transformOrigin: "50% 50%",
                }}
              />
            </svg>

            {/* Muscle/Dumbbell Icon */}
            <div className="pull-to-refresh-indicator__icon-wrap">
              <Dumbbell
                className={`pull-to-refresh-indicator__icon ${isRefreshing ? "animate-pulse text-action" : (isReadyToTrigger ? "text-action scale-110" : "text-muted")}`}
                size={19}
                style={{
                  transform: isRefreshing
                    ? undefined
                    : `rotate(${progress * 45}deg) scale(${0.9 + progress * 0.2})`,
                  transition: isPulling ? "none" : "transform 200ms ease, color 200ms ease",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content (STAYS 100% STATIONARY, ONLY OPACITY FADES SUBTLY) */}
      <div
        className="pull-to-refresh-content"
        style={{
          opacity: contentOpacity,
          transition: isPulling ? "none" : "opacity 240ms ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
