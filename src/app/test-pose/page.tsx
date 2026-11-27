"use client";

import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Film,
  Play,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { useCameraStream } from "@/features/workout/model/use-camera-stream";
import { useMotionEngine } from "@/features/workout/model/use-motion-engine";
import { CameraStage } from "@/features/workout/ui/live/camera-stage";

import {
  buildTestMotionSpec,
  MUSCLE_GROUP_FILTERS,
  POSE_MODEL_OPTIONS,
  POSE_TEST_EXERCISES,
} from "./pose-test-catalog";
import type { MuscleGroupFilter, PoseTestExercise } from "./pose-test-catalog";

interface TelemetryLogItem {
  id: number;
  time: string;
  kind: "rep" | "error" | "info";
  text: string;
}

function formatNow(): string {
  return new Date().toLocaleTimeString("vi-VN", { hour12: false });
}

export default function TestPosePage() {
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroupFilter>("All");
  const [selectedExercise, setSelectedExercise] = useState<PoseTestExercise>(
    POSE_TEST_EXERCISES[0]!,
  );
  const [selectedModel, setSelectedModel] = useState<string>(POSE_MODEL_OPTIONS[0].id);
  const [isTracking, setIsTracking] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [logs, setLogs] = useState<TelemetryLogItem[]>([]);
  const logSeqRef = useRef(0);

  const pushLog = useCallback((kind: TelemetryLogItem["kind"], text: string) => {
    logSeqRef.current += 1;
    const entry: TelemetryLogItem = {
      id: logSeqRef.current,
      time: formatNow(),
      kind,
      text,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 40));
  }, []);

  const camera = useCameraStream();

  const motion = useMotionEngine({
    onRep: (rep) => {
      if (rep.counted) {
        pushLog(
          "rep",
          `Rep #${rep.count} (${Math.round(rep.romPercentage)}% ROM)`,
        );
      }
    },
    onFormError: (err) => {
      pushLog("error", `[S${err.severity}] ${err.code}: ${err.message}`);
    },
    onFallback: (reason) => {
      pushLog("info", `Engine fallback: ${reason}`);
    },
  });

  const filteredExercises = useMemo(() => {
    if (selectedGroup === "All") {
      return POSE_TEST_EXERCISES;
    }
    return POSE_TEST_EXERCISES.filter((ex) => ex.bodyPart === selectedGroup);
  }, [selectedGroup]);

  const startTrackingFor = useCallback(
    async (exercise: PoseTestExercise, modelUrl: string) => {
      const video = camera.videoRef.current;
      if (!video) {
        pushLog("info", "Chưa có nguồn video/webcam.");
        return;
      }
      const spec = buildTestMotionSpec(exercise, modelUrl);
      pushLog("info", `Đang tải engine cho ${exercise.name}...`);
      const kind = await motion.prepare(spec, video);
      if (kind === "manual") {
        pushLog("error", "Không khởi chạy được Worker ONNX (chuyển về manual).");
        setIsTracking(false);
        return;
      }
      motion.startSet();
      setIsTracking(true);
      pushLog("info", `Bắt đầu tracking ${exercise.name} (${modelUrl.split("/").pop()})`);
    },
    [camera.videoRef, motion, pushLog],
  );

  const handleStopTracking = useCallback(async () => {
    await motion.stopSet();
    motion.dispose();
    setIsTracking(false);
    pushLog("info", "Đã dừng tracking.");
  }, [motion, pushLog]);

  const handleStartWebcam = useCallback(async () => {
    const ok = await camera.start("user");
    if (!ok) {
      pushLog("error", "Không mở được webcam (kiểm tra quyền camera).");
      return;
    }
    await startTrackingFor(selectedExercise, selectedModel);
  }, [camera, pushLog, selectedExercise, selectedModel, startTrackingFor]);

  const handleLoadSampleVideo = useCallback(
    async (exercise: PoseTestExercise = selectedExercise, overrideVideoUrl?: string, overrideAngle?: "SIDE" | "FRONT" | "AUTO") => {
      const targetUrl = overrideVideoUrl || exercise.sampleVideoUrl;
      setLoadingSample(true);
      try {
        const res = await fetch(targetUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} khi tải ${targetUrl}`);
        }
        const blob = await res.blob();
        const file = new File([blob], `${exercise.id}.mp4`, {
          type: blob.type || "video/mp4",
        });
        camera.loadVideoFile(file);
        pushLog("info", `Đã nạp video mẫu: ${targetUrl}`);
        // Wait one animation frame for video element src binding
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const exWithAngle =
          overrideAngle && overrideAngle !== "AUTO"
            ? { ...exercise, cameraAngle: overrideAngle }
            : exercise;
        await startTrackingFor(exWithAngle, selectedModel);
      } catch (err) {
        pushLog(
          "error",
          err instanceof Error ? err.message : "Không tải được video mẫu",
        );
      } finally {
        setLoadingSample(false);
      }
    },
    [camera, pushLog, selectedExercise, selectedModel, startTrackingFor],
  );

  const handleUploadVideo = useCallback(
    (file: File) => {
      camera.loadVideoFile(file);
      pushLog("info", `Đã nạp video upload: ${file.name}`);
      requestAnimationFrame(() => {
        void startTrackingFor(selectedExercise, selectedModel);
      });
    },
    [camera, pushLog, selectedExercise, selectedModel, startTrackingFor],
  );

  const handleSelectExercise = useCallback(
    (exercise: PoseTestExercise) => {
      setSelectedExercise(exercise);
      if (isTracking) {
        void startTrackingFor(exercise, selectedModel);
      }
    },
    [isTracking, selectedModel, startTrackingFor],
  );

  const handleSelectModel = useCallback(
    (modelUrl: string) => {
      setSelectedModel(modelUrl);
      if (isTracking) {
        void startTrackingFor(selectedExercise, modelUrl);
      }
    },
    [isTracking, selectedExercise, startTrackingFor],
  );

  const handleResetReps = useCallback(() => {
    if (!isTracking) {
      return;
    }
    motion.startSet();
    pushLog("info", "Đã reset bộ đếm rep.");
  }, [isTracking, motion, pushLog]);

  const validKeypoints = useMemo(() => {
    if (!motion.pose?.keypoints) {
      return 0;
    }
    return motion.pose.keypoints.filter((k) => k.score >= 0.25).length;
  }, [motion.pose]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-5 md:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              AI Pose Sandbox — Test nhanh Model &amp; Rule
            </h1>
            <p className="text-xs text-neutral-400">
              Chọn bài trực tiếp, test bằng Webcam, Video mẫu có sẵn hoặc Upload video — không cần
              tạo Workout Session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Chọn model ONNX"
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-100"
              onChange={(e) => handleSelectModel(e.target.value)}
              value={selectedModel}
            >
              {POSE_MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
              disabled={motion.preparing}
              onClick={() => void handleStartWebcam()}
              type="button"
            >
              <Camera size={14} />
              <span>Mở Webcam</span>
            </button>

            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
              disabled={loadingSample || motion.preparing}
              onClick={() => void handleLoadSampleVideo(selectedExercise)}
              type="button"
            >
              <Film size={14} />
              <span>{loadingSample ? "Đang tải..." : "Chạy Video mẫu"}</span>
            </button>

            {isTracking ? (
              <>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 cursor-pointer"
                  onClick={handleResetReps}
                  type="button"
                >
                  <RotateCcw size={14} />
                  <span>Reset Rep</span>
                </button>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer"
                  onClick={() => void handleStopTracking()}
                  type="button"
                >
                  <Square size={14} />
                  <span>Dừng AI</span>
                </button>
              </>
            ) : (
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/60 bg-emerald-950/60 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 disabled:opacity-50 cursor-pointer"
                disabled={motion.preparing || (camera.state !== "ready" && !camera.isCustomVideo)}
                onClick={() => void startTrackingFor(selectedExercise, selectedModel)}
                type="button"
              >
                <Play size={14} />
                <span>Chạy AI</span>
              </button>
            )}
          </div>
        </header>

        {/* Main 3-column layout */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left: Quick Exercise Picker */}
          <aside className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Chọn bài tập ({filteredExercises.length})
              </h2>
              <span className="text-[11px] text-neutral-400">12 rule / 16 bài DB</span>
            </div>

            {/* Muscle group filter chips */}
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUP_FILTERS.map((group) => {
                const active = selectedGroup === group;
                return (
                  <button
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-white text-neutral-950"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    type="button"
                  >
                    {group}
                  </button>
                );
              })}
            </div>

            {/* Exercise list */}
            <div className="max-h-[540px] space-y-1.5 overflow-y-auto pr-1">
              {filteredExercises.map((ex) => {
                const active = ex.id === selectedExercise.id;
                return (
                  <button
                    className={`w-full rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                      active
                        ? "border-emerald-500 bg-emerald-950/40 text-white"
                        : "border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900"
                    }`}
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{ex.name}</span>
                      <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono text-neutral-300">
                        {ex.cameraAngle}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>
                        {ex.bodyPart} · {ex.targetMuscle}
                      </span>
                      <span className="text-[10px] uppercase">
                        {ex.isTimed ? "DURATION" : "REPS"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Center: Camera Stage + Skeleton Overlay */}
          <section className="space-y-3 lg:col-span-6">
            <div className="h-[520px] md:h-[580px]">
              <CameraStage
                activeErrors={motion.activeErrors}
                alert={Boolean(motion.lastError)}
                customVideoSrc={camera.customVideoSrc}
                isCustomVideo={camera.isCustomVideo}
                mirrored={camera.facingMode === "user"}
                onClearCustomVideo={() => void camera.clearCustomVideo()}
                onFlip={() => void camera.flip()}
                onUploadVideo={handleUploadVideo}
                pose={motion.pose}
                state={camera.state}
                videoRef={camera.videoRef}
              >
                {/* Compact HUD badge on video */}
                <div className="pointer-events-none absolute bottom-3 left-3 z-30 flex flex-wrap items-center gap-2">
                  <div className="rounded-xl bg-black/75 px-3 py-1.5 backdrop-blur-md border border-white/10">
                    <span className="text-[11px] text-neutral-400 block">
                      {selectedExercise.isTimed ? "Thời gian (giây)" : "Số Rep"}
                    </span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {motion.repCount}
                    </span>
                  </div>
                  {motion.metrics ? (
                    <div className="rounded-xl bg-black/75 px-3 py-1.5 backdrop-blur-md border border-white/10 text-xs font-mono">
                      <div className="text-neutral-300">
                        {motion.metrics.metricName}:{" "}
                        <span className="text-white font-semibold">
                          {Math.round(motion.metrics.angle)}°
                        </span>
                      </div>
                      <div className="text-neutral-400">
                        ROM: {Math.round(motion.metrics.rom)}% · Phase: {motion.metrics.phase}
                      </div>
                    </div>
                  ) : null}
                </div>

                {motion.lastError ? (
                  <div className="pointer-events-none absolute top-14 left-1/2 z-30 -translate-x-1/2 rounded-full bg-rose-600/90 px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
                    {motion.lastError}
                  </div>
                ) : null}
              </CameraStage>
            </div>

            {/* Selected exercise info bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-2.5 text-xs text-neutral-300">
              <div>
                <span className="font-semibold text-white">{selectedExercise.name}</span>
                <span className="mx-2 text-neutral-600">|</span>
                <span>Rule: </span>
                <code className="text-emerald-400">{selectedExercise.rulesUrl}</code>
              </div>
              <div className="text-neutral-400">
                Biến thể DB: {selectedExercise.dbVariants.join(", ")}
              </div>
            </div>

            {/* Scenario Video Picker (Chuẩn vs Từng Lỗi) */}
            {selectedExercise.scenarios && selectedExercise.scenarios.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900/70 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    Kịch bản Video thực tế ({selectedExercise.scenarios.length} clip đã cắt)
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Bấm vào từng kịch bản để chạy kiểm định lỗi
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedExercise.scenarios.map((sc) => (
                    <button
                      className="rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-left text-[11px] font-medium text-neutral-200 hover:border-emerald-500 hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                      disabled={loadingSample || motion.preparing}
                      key={sc.id}
                      onClick={() =>
                        void handleLoadSampleVideo(selectedExercise, sc.videoUrl, sc.cameraAngle)
                      }
                      type="button"
                    >
                      <div>{sc.label}</div>
                      {sc.expectedFaults.length > 0 ? (
                        <div className="text-[10px] font-mono text-rose-400">
                          Kỳ vọng: {sc.expectedFaults.join(", ")}
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-emerald-400">
                          Kỳ vọng: 0 lỗi{sc.expectedReps ? ` · ${sc.expectedReps} reps` : ""}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {/* Right: Telemetry & Event Log */}
          <aside className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <Activity size={15} className="text-emerald-400" />
                <span>Telemetry trực tiếp</span>
              </h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  motion.preparing
                    ? "bg-amber-500/20 text-amber-300"
                    : isTracking
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {motion.preparing ? "Loading..." : isTracking ? motion.kind ?? "Active" : "Idle"}
              </span>
            </div>

            {motion.error ? (
              <div className="rounded-lg border border-rose-500/40 bg-rose-950/50 p-2.5 text-xs text-rose-300">
                {motion.error}
              </div>
            ) : null}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-2.5">
                <div className="text-[10px] text-neutral-400">
                  {selectedExercise.isTimed ? "Seconds" : "Reps"}
                </div>
                <div className="mt-0.5 text-xl font-bold font-mono text-emerald-400">
                  {motion.repCount}
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-2.5">
                <div className="text-[10px] text-neutral-400">Keypoints (&ge;0.25)</div>
                <div className="mt-0.5 text-xl font-bold font-mono text-white">
                  {validKeypoints}/17
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-2.5">
                <div className="text-[10px] text-neutral-400">Góc khớp chính</div>
                <div className="mt-0.5 text-base font-semibold font-mono text-white">
                  {motion.metrics ? `${Math.round(motion.metrics.angle)}°` : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-2.5">
                <div className="text-[10px] text-neutral-400">ROM / Phase</div>
                <div className="mt-0.5 text-sm font-semibold font-mono text-white">
                  {motion.metrics
                    ? `${Math.round(motion.metrics.rom)}% · ${motion.metrics.phase}`
                    : "—"}
                </div>
              </div>
            </div>

            {/* Active Errors */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <div className="text-[11px] font-semibold text-neutral-400">
                Lỗi form đang phát hiện
              </div>
              {motion.activeErrors.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {motion.activeErrors.map((code) => (
                    <span
                      className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[11px] font-mono text-rose-300"
                      key={code}
                    >
                      <AlertTriangle size={11} />
                      {code}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 size={13} />
                  <span>Không có lỗi form</span>
                </div>
              )}
            </div>

            {/* Event Log */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">Event Log</span>
                <button
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white cursor-pointer"
                  onClick={() => setLogs([])}
                  type="button"
                >
                  <Trash2 size={12} />
                  <span>Xóa</span>
                </button>
              </div>
              <div className="h-[240px] space-y-1.5 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950 p-2.5 font-mono text-[11px]">
                {logs.length === 0 ? (
                  <p className="text-neutral-500">
                    Bấm &quot;Chạy Video mẫu&quot; hoặc &quot;Mở Webcam&quot; để bắt đầu test.
                  </p>
                ) : (
                  logs.map((item) => (
                    <div
                      className={`rounded px-2 py-1 ${
                        item.kind === "rep"
                          ? "bg-emerald-950/60 text-emerald-300"
                          : item.kind === "error"
                            ? "bg-rose-950/60 text-rose-300"
                            : "bg-neutral-900 text-neutral-400"
                      }`}
                      key={item.id}
                    >
                      <span className="text-neutral-500">[{item.time}]</span> {item.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
