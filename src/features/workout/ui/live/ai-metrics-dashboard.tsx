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

  // Friendly metric name formatter (e.g. knee_angle -> Góc Gối)
  const formatMetricName = (name: string) => {
    if (name.includes("knee")) return "Góc Gối (knee_angle)";
    if (name.includes("hip")) return "Góc Hông (hip_angle)";
    if (name.includes("spine")) return "Cột sống (spine_angle)";
    if (name.includes("elbow")) return "Góc Khuỷu (elbow_angle)";
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

  // Render phase badge text & style based on rest -> Bắt đầu, transition -> Di chuyển, active -> Tới đích
  const getPhaseBadge = (p: string) => {
    switch (p) {
      case "always":
        return {
          bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold",
          icon: <CheckCircle2 size={14} />,
          label: "Giữ tư thế",
        };
      case "moving_to_target":
        return {
          bg: "bg-blue-500/20 text-blue-400 border-blue-500/40",
          icon: <Activity className="animate-pulse" size={14} />,
          label: "Di chuyển",
        };
      case "target_reached":
        return {
          bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold",
          icon: <CheckCircle2 size={14} />,
          label: "Tới đích",
        };
      case "moving_to_start":
        return {
          bg: "bg-purple-500/20 text-purple-400 border-purple-500/40",
          icon: <Activity className="animate-pulse" size={14} />,
          label: "Quay về",
        };
      default:
        return {
          bg: "bg-slate-700/50 text-slate-300 border-slate-600/40",
          icon: <Target size={14} />,
          label: "Bắt đầu",
        };
    }
  };

  const badge = getPhaseBadge(phase);

  return (
    <div className="w-full bg-slate-950/95 text-white backdrop-blur-xl border-t border-slate-800 p-4 md:p-5 space-y-4 shadow-2xl transition-all">
      {/* Top Bar: Exercise Info, Completed Rep Counter & Movement Phase Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-base md:text-lg text-white flex items-center gap-2">
            <span>{exerciseName}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              Hiệp {currentSet} / {totalSets}
            </span>
          </h3>

          {/* Prominent Live Completed Rep Badge (5-stage FSM) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs border border-emerald-500/40 shadow-sm animate-pulse">
            <Flame className="text-emerald-400 fill-emerald-400" size={14} />
            <span>Đã tập: {liveRepCount} / {targetReps} cái</span>
          </div>
        </div>

        {/* Dynamic Movement Phase Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </div>
      </div>

      {/* 4-Column Real-time Telemetry Log Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <ListOrdered size={16} />
            Bảng chỉ số AI 4 Cột & Đếm Rep (Thời gian thực)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {`10 frames mới nhất`}
          </span>
        </div>

        <div className="overflow-x-auto max-h-48 overflow-y-auto pr-1">
          <table className="w-full text-left text-xs text-slate-300">
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logHistory.map((row) => {
                const b = getPhaseBadge(row.phase);
                return (
                  <tr
                    className="hover:bg-slate-800/50 transition-colors"
                    key={row.frameIndex}
                  >
                    <td className="py-2 px-2.5 text-slate-300 font-semibold">
                      Frame #{row.frameIndex}
                    </td>
                    <td className="py-2 px-2.5 text-amber-400 font-bold">
                      {row.metricName}: {row.userAngle}°
                    </td>
                    <td className="py-2 px-2.5 text-slate-300">
                      Đích: <span className="text-emerald-400 font-bold">≤{row.ruleAngle}°</span> | Đầu: &gt;{row.startDeg}°
                    </td>
                    <td className="py-2 px-2.5 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold border ${b.bg}`}>
                        {b.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        {row.repCount} cái
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
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Gauge className="text-amber-400" size={15} />
            {formatMetricName(metricName)}
          </div>
          <div className="text-xl font-bold text-amber-400">{angle}°</div>
        </div>

        {/* Card 2: Live ROM % */}
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Flame className="text-emerald-400" size={15} />
            Biên độ (ROM)
          </div>
          <div className="text-xl font-bold text-emerald-400">{rom}%</div>
        </div>

        {/* Card 3: Rep Counter & Finish Button */}
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full border-2 border-emerald-500/40 text-white font-bold text-sm flex items-center justify-center">
              {timed ? secondsLeft : liveRepCount}
            </div>
            <div className="text-xs font-semibold text-slate-200">
              {timed ? `${secondsLeft}s` : `${liveRepCount} / ${targetReps} Reps`}
            </div>
          </div>

          <button
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all flex items-center gap-1"
            onClick={onDone}
            type="button"
          >
            <CheckCircle2 size={15} />
            <span>Hoàn thành</span>
          </button>
        </div>
      </div>
    </div>
  );
}
