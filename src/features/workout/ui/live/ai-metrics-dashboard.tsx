"use client";

import { Activity, CheckCircle2, Flame, Gauge, ListOrdered, Target } from "lucide-react";
import { useEffect, useState } from "react";

export interface LogRow {
  frameIndex: number;
  metricName: string;
  userAngle: number;
  ruleAngle: number;
  startDeg: number;
  phase: string;
  repCount: number;
}

export interface AiMetricsDashboardProps {
  metrics: {
    frameIndex?: number;
    metricName?: string;
    angle: number;
    rom: number;
    phase: string;
    repCount?: number;
    startDeg: number;
    endDeg: number;
  } | null;
  repCount: number;
  targetReps: number;
  currentSet: number;
  totalSets: number;
  exerciseName: string;
  onDone: () => void;
  timed?: boolean;
  secondsLeft?: number;
}

export function AiMetricsDashboard({
  currentSet,
  exerciseName,
  metrics,
  onDone,
  repCount: propRepCount,
  secondsLeft = 0,
  targetReps,
  timed = false,
  totalSets,
}: AiMetricsDashboardProps) {
  const angle = metrics?.angle ?? 0;
  const rom = metrics?.rom ?? 0;
  const phase = metrics?.phase ?? "start";
  const startDeg = metrics?.startDeg ?? 150;
  const endDeg = metrics?.endDeg ?? 115;
  const frameIndex = metrics?.frameIndex ?? 0;
  const metricName = metrics?.metricName ?? "knee_angle";
  const liveRepCount = metrics?.repCount ?? propRepCount;

  // Friendly metric name formatter (e.g. knee_angle -> Knee Angle)
  const formatMetricName = (name: string) => {
    if (name.includes("knee")) return "Knee Angle (knee_angle)";
    if (name.includes("hip")) return "Hip Angle (hip_angle)";
    if (name.includes("spine")) return "Spine Angle (spine_angle)";
    if (name.includes("elbow")) return "Elbow Angle (elbow_angle)";
    return name;
  };

  // Real-time telemetry table history (max 10 recent frames)
  const [logHistory, setLogHistory] = useState<LogRow[]>([
    {
      frameIndex: frameIndex || 1,
      metricName: formatMetricName(metricName),
      phase,
      repCount: liveRepCount,
      ruleAngle: endDeg,
      startDeg,
      userAngle: angle,
    },
  ]);

  useEffect(() => {
    if (!metrics) {
      return;
    }
    setLogHistory((prev) => {
      const currentFrame = metrics.frameIndex && metrics.frameIndex > 0 ? metrics.frameIndex : (prev[0]?.frameIndex ?? 0) + 1;
      if (prev.length > 0 && prev[0]?.frameIndex === currentFrame && prev[0]?.userAngle === metrics.angle) {
        return prev;
      }
      const newRow: LogRow = {
        frameIndex: currentFrame,
        metricName: formatMetricName(metrics.metricName ?? "knee_angle"),
        phase,
        repCount: metrics.repCount ?? liveRepCount,
        ruleAngle: endDeg,
        startDeg,
        userAngle: angle,
      };
      return [newRow, ...prev].slice(0, 10);
    });
  }, [angle, endDeg, frameIndex, liveRepCount, metrics, phase, startDeg]);

  // Render phase badge text & style based on rest -> Start, transition -> Move, active -> Peak/Target
  const getPhaseBadge = (p: string) => {
    switch (p) {
      case "always":
        return {
          style: { background: "var(--color-recovery-soft)", color: "var(--color-recovery-strong)", borderColor: "var(--color-recovery)" },
          icon: <CheckCircle2 size={14} />,
          label: "Hold Pose",
        };
      case "moving_to_target":
        return {
          style: { background: "var(--color-action-soft)", color: "var(--color-action)", borderColor: "var(--color-action)" },
          icon: <Activity className="animate-pulse" size={14} />,
          label: "Moving",
        };
      case "target_reached":
        return {
          style: { background: "var(--color-recovery-soft)", color: "var(--color-recovery-strong)", borderColor: "var(--color-recovery)" },
          icon: <CheckCircle2 size={14} />,
          label: "Target Reached",
        };
      case "moving_to_start":
        return {
          style: { background: "var(--color-effort-soft)", color: "var(--color-effort)", borderColor: "var(--color-effort)" },
          icon: <Activity className="animate-pulse" size={14} />,
          label: "Returning",
        };
      default:
        return {
          style: { background: "var(--color-surface-subtle)", color: "var(--color-text-muted)", borderColor: "var(--color-border)" },
          icon: <Target size={14} />,
          label: "Start",
        };
    }
  };

  const badge = getPhaseBadge(phase);

  return (
    <div
      className="w-full backdrop-blur-xl p-4 md:p-5 space-y-4 shadow-2xl transition-all"
      style={{
        background: "var(--color-surface)",
        color: "var(--color-text)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      {/* Top Bar: Exercise Info, Completed Rep Counter & Movement Phase Badge */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 pb-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-base md:text-lg flex items-center gap-2" style={{ color: "var(--color-text)" }}>
            <span>{exerciseName}</span>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-medium"
              style={{ background: "var(--color-surface-subtle)", color: "var(--color-text-muted)" }}
            >
              Set {currentSet} / {totalSets}
            </span>
          </h3>

          {/* Prominent Live Completed Rep Badge (5-stage FSM) */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold text-xs shadow-sm border"
            style={{
              background: "var(--color-recovery-soft)",
              color: "var(--color-recovery-strong)",
              borderColor: "var(--color-recovery)",
            }}
          >
            <Flame size={14} style={{ color: "var(--color-recovery)" }} />
            <span>Reps: {liveRepCount} / {targetReps}</span>
          </div>
        </div>

        {/* Dynamic Movement Phase Pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
          style={badge.style}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* 4-Column Real-time Telemetry Log Table */}
      <div
        className="rounded-2xl p-3.5 space-y-2 border"
        style={{
          background: "var(--color-surface-subtle)",
          borderColor: "var(--color-border)",
        }}
      >
        <div
          className="flex items-center justify-between pb-2"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <span
            className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: "var(--color-action)" }}
          >
            <ListOrdered size={16} />
            AI 4-Column Telemetry & Rep Counter (Real-time)
          </span>
          <span className="text-[11px] font-mono" style={{ color: "var(--color-text-muted)" }}>
            Latest 10 frames
          </span>
        </div>

        <div className="overflow-x-auto max-h-48 overflow-y-auto pr-1">
          <table className="w-full text-left text-xs" style={{ color: "var(--color-text)" }}>
            <tbody className="divide-y font-mono text-[11px]" style={{ borderColor: "var(--color-border)" }}>
              {logHistory.map((row) => {
                const b = getPhaseBadge(row.phase);
                return (
                  <tr
                    className="transition-colors"
                    key={row.frameIndex}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td className="py-2 px-2.5 font-semibold" style={{ color: "var(--color-text)" }}>
                      Frame #{row.frameIndex}
                    </td>
                    <td className="py-2 px-2.5 font-bold" style={{ color: "var(--color-effort)" }}>
                      {row.metricName}: {row.userAngle}°
                    </td>
                    <td className="py-2 px-2.5" style={{ color: "var(--color-text-muted)" }}>
                      Target: <span className="font-bold" style={{ color: "var(--color-recovery)" }}>≤{row.ruleAngle}°</span> | Start: &gt;{row.startDeg}°
                    </td>
                    <td className="py-2 px-2.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold border" style={b.style}>
                        {b.label}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded font-bold border"
                        style={{
                          background: "var(--color-recovery-soft)",
                          color: "var(--color-recovery-strong)",
                          borderColor: "var(--color-recovery)",
                        }}
                      >
                        {row.repCount} reps
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Cards: Live ROM & Rep Counter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Live Angle Summary */}
        <div
          className="p-3 rounded-xl border flex items-center justify-between"
          style={{
            background: "var(--color-surface-subtle)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="text-xs flex items-center gap-1.5 font-medium" style={{ color: "var(--color-text-muted)" }}>
            <Gauge size={15} style={{ color: "var(--color-effort)" }} />
            {formatMetricName(metricName)}
          </div>
          <div className="text-xl font-bold" style={{ color: "var(--color-effort)" }}>{angle}°</div>
        </div>

        {/* Card 2: Live ROM % */}
        <div
          className="p-3 rounded-xl border flex items-center justify-between"
          style={{
            background: "var(--color-surface-subtle)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="text-xs flex items-center gap-1.5 font-medium" style={{ color: "var(--color-text-muted)" }}>
            <Flame size={15} style={{ color: "var(--color-recovery)" }} />
            Range of Motion (ROM)
          </div>
          <div className="text-xl font-bold" style={{ color: "var(--color-recovery)" }}>{rom}%</div>
        </div>

        {/* Card 3: Rep Counter & Finish Button */}
        <div
          className="p-3 rounded-xl border flex items-center justify-between gap-2"
          style={{
            background: "var(--color-surface-subtle)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full border-2 font-bold text-sm flex items-center justify-center"
              style={{
                borderColor: "var(--color-recovery)",
                color: "var(--color-text)",
              }}
            >
              {timed ? secondsLeft : liveRepCount}
            </div>
            <div className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
              {timed ? `${secondsLeft}s` : `${liveRepCount} / ${targetReps} Reps`}
            </div>
          </div>

          <button
            className="px-3.5 py-1.5 rounded-lg font-bold text-xs shadow transition-all flex items-center gap-1 cursor-pointer"
            onClick={onDone}
            style={{
              background: "var(--color-action)",
              color: "#ffffff",
            }}
            type="button"
          >
            <CheckCircle2 size={15} />
            <span>Complete Set</span>
          </button>
        </div>
      </div>
    </div>
  );
}
