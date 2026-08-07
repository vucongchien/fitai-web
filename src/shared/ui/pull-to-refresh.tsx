"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type ReactNode } from "react";

type PullToRefreshProps = {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
  pullThreshold?: number;
  maxPullDistance?: number;
};

export function PullToRefresh({
  children,
  onRefresh,
  pullThreshold = 70,
  maxPullDistance = 110,
}: PullToRefreshProps) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return;

      // Only enable pull-to-refresh when at the top of the container / window
      const container = containerRef.current;
      const scrollTop = container ? container.scrollTop : window.scrollY;

      if (scrollTop <= 0 && e.touches.length === 1) {
        startYRef.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    },
    [isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      if (deltaY > 0) {
        // Damped pull distance formula for smooth resistance
        const damped = Math.min(maxPullDistance, deltaY * 0.45);
        setPullDistance(damped);
      } else {
        setPullDistance(0);
      }
    },
    [isPulling, isRefreshing, maxPullDistance],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(pullThreshold);

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default refresh behaviour: revalidate Next.js route
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
  }, [isPulling, pullDistance, pullThreshold, isRefreshing, onRefresh, router]);

  const progress = Math.min(1, pullDistance / pullThreshold);

  return (
    <div
      className="pull-to-refresh-container"
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      ref={containerRef}
      style={{ touchAction: "pan-y", overscrollBehaviorY: "contain" }}
    >
      {/* Pull Indicator Banner */}
      <div
        aria-hidden="true"
        className="pull-to-refresh-indicator"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
          transition: isPulling ? "none" : "height 240ms ease, opacity 240ms ease",
        }}
      >
        <div className="pull-to-refresh-indicator__icon-box">
          {isRefreshing ? (
            <Loader2 className="animate-spin text-primary" size={20} />
          ) : (
            <RefreshCw
              className="text-muted-foreground"
              size={18}
              style={{
                transform: `rotate(${progress * 180}deg)`,
                transition: isPulling ? "none" : "transform 200ms ease",
              }}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        className="pull-to-refresh-content"
        style={{
          transform: `translate3d(0, ${pullDistance}px, 0)`,
          transition: isPulling ? "none" : "transform 240ms cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
