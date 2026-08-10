"use client";

import {
  AlertCircle,
  CheckCircle2,
  Code2,
  FileCode,
  FileJson,
  Mic,
  Pause,
  Play,
  Plus,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  UploadCloud,
  Volume2,
} from "lucide-react";
import { useId, useState } from "react";

import {
  getPresignedUploadUrl,
  patchMotionSpecificationAsset,
  updateMotionSpecification,
} from "@/features/admin/api/admin-motion-spec-service";
import type {
  AdminMotionSpecification,
  DialogueSeverities,
  PoseRuleConfig,
} from "@/features/admin/domain/admin-motion-spec-types";
import { toast } from "@/shared/ui/toast";

export interface MotionSpecEditorProps {
  spec: AdminMotionSpecification;
  onSaveSuccess?: (updated: AdminMotionSpecification) => void;
}

export function MotionSpecEditor({ spec, onSaveSuccess }: MotionSpecEditorProps) {
  const fieldIdBase = useId();
  const [activeTab, setActiveTab] = useState<"general" | "rules" | "voice">("general");

  // General fields
  const [onnxDetectorUrl, setOnnxDetectorUrl] = useState(spec.onnxDetectorUrl || "");
  const [onnxSkeletonUrl, setOnnxSkeletonUrl] = useState(spec.onnxSkeletonUrl || "");
  const [localRulesUrl, setLocalRulesUrl] = useState(spec.localRulesUrl || "");
  const [dialogueEngineUrl, setDialogueEngineUrl] = useState(spec.dialogueEngineUrl || "");
  const [recommendedCameraAngle, setRecommendedCameraAngle] = useState(
    spec.recommendedCameraAngle || "side",
  );

  // Pose Rules state (null if not configured)
  const [poseRules, setPoseRules] = useState<PoseRuleConfig | null>(spec.poseRules || null);

  // Dialogue Engine state
  const [personalityId, setPersonalityId] = useState(
    spec.dialogueEngine?.personalityId || "",
  );
  const [cooldowns, setCooldowns] = useState<Record<string, number>>(
    spec.dialogueEngine?.cooldowns || {},
  );
  const [dialogueMap, setDialogueMap] = useState<Record<string, DialogueSeverities>>(
    spec.dialogueEngine?.dialogueMap || {},
  );

  // Audio preview state
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);

  // Uploading state
  const [isUploadingRuleFile, setIsUploadingRuleFile] = useState(false);
  const [isUploadingVoiceFile, setIsUploadingVoiceFile] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isPatchingRules, setIsPatchingRules] = useState(false);
  const [isPatchingVoice, setIsPatchingVoice] = useState(false);

  // New Error Code Inputs
  const [newErrorCode, setNewErrorCode] = useState("");
  const [newErrorDesc, setNewErrorDesc] = useState("");

  // Handle General Spec Save
  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    try {
      const updated = await updateMotionSpecification({
        exerciseId: spec.exerciseId,
        onnxDetectorUrl,
        onnxSkeletonUrl,
        localRulesUrl,
        dialogueEngineUrl,
        recommendedCameraAngle,
      });
      toast.success("Cập nhật thông tin Motion Spec thành công!");
      if (onSaveSuccess) onSaveSuccess(updated);
    } catch (err) {
      toast.error("Lỗi khi lưu Motion Spec: " + String(err));
    } finally {
      setIsSavingGeneral(false);
    }
  };

  // Upload Rule File JSON
  const handleRuleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingRuleFile(true);
    try {
      const presigned = await getPresignedUploadUrl(file.name, file.type || "application/json");
      
      // Parse local JSON to state preview
      const fileText = await file.text();
      try {
        const parsed = JSON.parse(fileText);
        setPoseRules((prev) => ({ ...prev, ...parsed }));
        toast.success(`Đã đọc file rule JSON: ${file.name}`);
      } catch (err) {
        toast.info("File vừa upload không đúng định dạng JSON tiêu chuẩn, nhưng vẫn lưu URL");
      }

      setLocalRulesUrl(presigned.fileUrl);
      toast.success(`Upload file rule thành công! S3 URL: ${presigned.fileUrl}`);
    } catch (err) {
      toast.error("Lỗi upload file rule: " + String(err));
    } finally {
      setIsUploadingRuleFile(false);
    }
  };

  // Upload Voice File Audio (.mp3 / .wav) or JSON
  const handleVoiceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVoiceFile(true);
    try {
      const isAudio = file.type.startsWith("audio/") || file.name.endsWith(".mp3") || file.name.endsWith(".wav");
      const presigned = await getPresignedUploadUrl(file.name, file.type || (isAudio ? "audio/mpeg" : "application/json"));

      if (!isAudio) {
        // Dialogue JSON
        const text = await file.text();
        try {
          const parsed = JSON.parse(text);
          if (parsed.dialogueMap) setDialogueMap(parsed.dialogueMap);
          if (parsed.cooldowns) setCooldowns(parsed.cooldowns);
          if (parsed.personalityId) setPersonalityId(parsed.personalityId);
          toast.success("Đã nạp cấu hình kịch bản giọng nói từ JSON");
        } catch (err) {
          toast.info("File kịch bản không đúng JSON tiêu chuẩn");
        }
        setDialogueEngineUrl(presigned.fileUrl);
      } else {
        toast.success(`Upload thành công audio giọng nói! URL: ${presigned.fileUrl}`);
      }
    } catch (err) {
      toast.error("Lỗi upload file giọng nói: " + String(err));
    } finally {
      setIsUploadingVoiceFile(false);
    }
  };

  // Patch Pose Rules JSON
  const handlePatchPoseRules = async () => {
    setIsPatchingRules(true);
    try {
      const res = await patchMotionSpecificationAsset({
        exerciseId: spec.exerciseId,
        assetType: "POSE_RULES",
        patchJson: JSON.stringify(poseRules, null, 2),
      });
      setLocalRulesUrl(res.fileUrl);
      toast.success("Đã Patch thành công File Rule tư thế lên Cloud Storage!");
      if (onSaveSuccess) {
        onSaveSuccess({
          ...spec,
          localRulesUrl: res.fileUrl,
          poseRules: poseRules ?? undefined,
        });
      }
    } catch (err) {
      toast.error("Lỗi khi patch file rule: " + String(err));
    } finally {
      setIsPatchingRules(false);
    }
  };

  // Patch Dialogue Engine Voice Config
  const handlePatchDialogueConfig = async () => {
    setIsPatchingVoice(true);
    try {
      const fullConfig = {
        personalityId,
        cooldowns,
        dialogueMap,
      };

      const res = await patchMotionSpecificationAsset({
        exerciseId: spec.exerciseId,
        assetType: "DIALOGUE_CONFIG",
        patchJson: JSON.stringify(fullConfig, null, 2),
      });
      setDialogueEngineUrl(res.fileUrl);
      toast.success("Đã Patch thành công File Giọng nói & Kịch bản AI Coach!");
      if (onSaveSuccess) {
        onSaveSuccess({
          ...spec,
          dialogueEngineUrl: res.fileUrl,
          dialogueEngine: fullConfig,
        });
      }
    } catch (err) {
      toast.error("Lỗi khi patch kịch bản giọng nói: " + String(err));
    } finally {
      setIsPatchingVoice(false);
    }
  };

  // Add Error Rule Code
  const handleAddErrorCode = () => {
    if (!newErrorCode.trim()) return;
    const formatted = newErrorCode.trim().toUpperCase().startsWith("ERR_")
      ? newErrorCode.trim().toUpperCase()
      : `ERR_${newErrorCode.trim().toUpperCase()}`;

    setPoseRules((prev) => {
      const base: PoseRuleConfig = prev || {
        calibration: { minDistanceMeters: 1.5, maxDistanceMeters: 3.0, targetAngle: 90 },
        repCounting: { minRomPercentage: 80 },
        formScoring: { penaltyPerError: 10 },
        errorRules: {},
      };
      return {
        ...base,
        errorRules: {
          ...base.errorRules,
          [formatted]: {
            description: newErrorDesc || "Mô tả lỗi tư thế",
            joint: "knee_left_right",
            thresholdDegrees: 15,
          },
        },
      };
    });

    setDialogueMap((prev) => ({
      ...prev,
      [formatted]: {
        severity1: [{ text: `Cảnh báo: ${newErrorDesc || formatted}`, audioUrl: "" }],
        severity2: [{ text: `Nguy hiểm: ${newErrorDesc || formatted}`, audioUrl: "" }],
      },
    }));

    setCooldowns((prev) => ({ ...prev, [formatted]: 3.0 }));
    setNewErrorCode("");
    setNewErrorDesc("");
    toast.success(`Đã thêm mã lỗi mới: ${formatted}`);
  };

  // Remove Error Code
  const handleRemoveErrorCode = (code: string) => {
    setPoseRules((prev) => {
      if (!prev) return null;
      const updated = { ...prev.errorRules };
      delete updated[code];
      return { ...prev, errorRules: updated };
    });
    setDialogueMap((prev) => {
      const updated = { ...prev };
      delete updated[code];
      return updated;
    });
    toast.info(`Đã xoá mã lỗi ${code}`);
  };

  // Play audio preview
  const handlePlayAudio = (url: string) => {
    if (!url) {
      toast.info("Chưa có URL file audio giọng nói cho dòng kịch bản này");
      return;
    }
    const audio = new Audio(url);
    setPlayingAudioUrl(url);
    audio.play().catch(() => {
      toast.info(`Đang giả lập phát audio giọng nói: ${url}`);
    });
    audio.onended = () => setPlayingAudioUrl(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Editor Tab Navigation */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm font-display">
              Cấu hình AI Rules & Voice Coaching
            </h3>
            <p className="text-xs text-slate-500">
              Bài tập ID: <code className="text-indigo-600 font-mono font-bold">{spec.exerciseId}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "general"
                ? "bg-white text-indigo-600 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="size-3.5" />
            <span>Tổng quan & Models</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "rules"
                ? "bg-white text-indigo-600 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCode className="size-3.5" />
            <span>File Rule Tư thế (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("voice")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "voice"
                ? "bg-white text-indigo-600 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mic className="size-3.5" />
            <span>File Giọng nói & Audio</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* TAB 1: GENERAL & ONNX MODELS */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${fieldIdBase}-onnxDetectorUrl`}
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  ONNX Object Detector Model URL
                </label>
                <input
                  id={`${fieldIdBase}-onnxDetectorUrl`}
                  type="text"
                  value={onnxDetectorUrl}
                  onChange={(e) => setOnnxDetectorUrl(e.target.value)}
                  placeholder="https://storage.fitai.com/models/yolov8_detector.onnx"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor={`${fieldIdBase}-onnxSkeletonUrl`}
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  ONNX Pose Skeleton Landmarker URL
                </label>
                <input
                  id={`${fieldIdBase}-onnxSkeletonUrl`}
                  type="text"
                  value={onnxSkeletonUrl}
                  onChange={(e) => setOnnxSkeletonUrl(e.target.value)}
                  placeholder="https://storage.fitai.com/models/pose_landmarker.onnx"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor={`${fieldIdBase}-localRulesUrl`}
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  File Rule Tư thế URL (`local_rules_url`)
                </label>
                <input
                  id={`${fieldIdBase}-localRulesUrl`}
                  type="text"
                  value={localRulesUrl}
                  onChange={(e) => setLocalRulesUrl(e.target.value)}
                  placeholder="https://storage.fitai.com/rules/pose_rules.json"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor={`${fieldIdBase}-dialogueEngineUrl`}
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  File Kịch bản Giọng nói URL (`dialogue_engine_url`)
                </label>
                <input
                  id={`${fieldIdBase}-dialogueEngineUrl`}
                  type="text"
                  value={dialogueEngineUrl}
                  onChange={(e) => setDialogueEngineUrl(e.target.value)}
                  placeholder="https://storage.fitai.com/dialogue/coach_dialogue.json"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor={`${fieldIdBase}-recommendedCameraAngle`}
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Góc quay Camera đề xuất
                </label>
                <select
                  id={`${fieldIdBase}-recommendedCameraAngle`}
                  value={recommendedCameraAngle}
                  onChange={(e) => setRecommendedCameraAngle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-semibold cursor-pointer"
                >
                  <option value="side">Nhìn ngang (Side View - 90°)</option>
                  <option value="front">Nhìn chính diện (Front View - 0°)</option>
                  <option value="45_degree">Góc chéo (45 Degree Angle)</option>
                  <option value="overhead">Từ trên xuống (Overhead View)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveGeneral}
                disabled={isSavingGeneral}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="size-4" />
                <span>{isSavingGeneral ? "Đang lưu..." : "Lưu cấu hình Motion Spec"}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: FILE RULE TƯ THẾ (POSE RULES) */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            {/* Header Action Upload */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <FileJson className="size-6 text-amber-600" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    File Rule Tư thế Cục bộ (Pose Rules JSON)
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    Quy định ngưỡng tính Rep, điểm phạt sai form, góc giới hạn khớp và khoảng cách camera.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs">
                  <UploadCloud className="size-4" />
                  <span>{isUploadingRuleFile ? "Đang upload..." : "Upload File Rule .json"}</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleRuleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handlePatchPoseRules}
                  disabled={isPatchingRules || !poseRules}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="size-4" />
                  <span>{isPatchingRules ? "Đang Patch..." : "Patch Rule File lên S3"}</span>
                </button>
              </div>
            </div>

            {!poseRules ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-amber-300 bg-amber-50/50 rounded-2xl space-y-3">
                <FileJson className="size-8 text-amber-500 mx-auto" />
                <div>
                  <p className="font-bold text-slate-800 text-sm">Chưa có dữ liệu File Rule tư thế (`local_rules_url` chưa được nạp)</p>
                  <p className="text-slate-500 mt-1">Bài tập này chưa có file rule JSON hoặc cấu hình các quy tắc tư thế.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPoseRules({
                      calibration: { minDistanceMeters: 1.5, maxDistanceMeters: 3.0, targetAngle: 90 },
                      repCounting: { minRomPercentage: 80 },
                      formScoring: { penaltyPerError: 10 },
                      errorRules: {},
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="size-4" />
                  <span>Khởi tạo cấu hình Rule tư thế mới</span>
                </button>
              </div>
            ) : (
              <>

            {/* Threshold & Calibration Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="size-3.5 text-indigo-600" />
                  <span>Hiệu chỉnh Camera (Calibration)</span>
                </h5>
                <div>
                  <label
                    htmlFor={`${fieldIdBase}-minDistanceMeters`}
                    className="text-[11px] text-slate-500 font-medium"
                  >
                    Khoảng cách tối thiểu (mét):
                  </label>
                  <input
                    id={`${fieldIdBase}-minDistanceMeters`}
                    type="number"
                    step="0.1"
                    value={poseRules.calibration.minDistanceMeters}
                    onChange={(e) =>
                      setPoseRules({
                        ...poseRules,
                        calibration: {
                          ...poseRules.calibration,
                          minDistanceMeters: Number.parseFloat(e.target.value) || 1.0,
                        },
                      })
                    }
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 mt-1 font-bold"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`${fieldIdBase}-maxDistanceMeters`}
                    className="text-[11px] text-slate-500 font-medium"
                  >
                    Khoảng cách tối đa (mét):
                  </label>
                  <input
                    id={`${fieldIdBase}-maxDistanceMeters`}
                    type="number"
                    step="0.1"
                    value={poseRules.calibration.maxDistanceMeters}
                    onChange={(e) =>
                      setPoseRules({
                        ...poseRules,
                        calibration: {
                          ...poseRules.calibration,
                          maxDistanceMeters: Number.parseFloat(e.target.value) || 3.0,
                        },
                      })
                    }
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 mt-1 font-bold"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Quy tắc Đếm Rep (Rep Counting)</span>
                </h5>
                <div>
                  <label
                    htmlFor={`${fieldIdBase}-minRomPercentage`}
                    className="text-[11px] text-slate-500 font-medium"
                  >
                    Biên độ chuyển động tối thiểu (ROM %):
                  </label>
                  <input
                    id={`${fieldIdBase}-minRomPercentage`}
                    type="number"
                    step="1"
                    value={poseRules.repCounting.minRomPercentage}
                    onChange={(e) =>
                      setPoseRules({
                        ...poseRules,
                        repCounting: {
                          minRomPercentage: Number.parseFloat(e.target.value) || 70,
                        },
                      })
                    }
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 mt-1 font-bold"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 text-rose-600" />
                  <span>Điểm phạt Form (Form Scoring)</span>
                </h5>
                <div>
                  <label
                    htmlFor={`${fieldIdBase}-penaltyPerError`}
                    className="text-[11px] text-slate-500 font-medium"
                  >
                    Điểm trừ cho mỗi vi phạm tư thế:
                  </label>
                  <input
                    id={`${fieldIdBase}-penaltyPerError`}
                    type="number"
                    step="1"
                    value={poseRules.formScoring.penaltyPerError}
                    onChange={(e) =>
                      setPoseRules({
                        ...poseRules,
                        formScoring: {
                          penaltyPerError: Number.parseFloat(e.target.value) || 10,
                        },
                      })
                    }
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 mt-1 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Error Rules Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Danh sách Mã lỗi Tư thế (Error Rules)
                </h5>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Mã lỗi (ví dụ: ERR_KNEE_VALGUS)"
                    value={newErrorCode}
                    onChange={(e) => setNewErrorCode(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 w-52 font-mono uppercase"
                  />
                  <input
                    type="text"
                    placeholder="Mô tả lỗi tư thế"
                    value={newErrorDesc}
                    onChange={(e) => setNewErrorDesc(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 w-64"
                  />
                  <button
                    type="button"
                    onClick={handleAddErrorCode}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Mã Lỗi (Error Code)</th>
                      <th className="p-3">Mô tả Lỗi</th>
                      <th className="p-3">Khớp theo dõi</th>
                      <th className="p-3">Ngưỡng lệch (Độ °)</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Object.entries(poseRules.errorRules || {}).map(([code, item]) => (
                      <tr key={code} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-indigo-600">{code}</td>
                        <td className="p-3 font-medium text-slate-800">{item.description}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
                            {item.joint}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-700">
                          {item.thresholdDegrees || 15}°
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveErrorCode(code)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live JSON Preview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Code2 className="size-4 text-indigo-600" />
                <span>Xem trước File Rule JSON tiêu chuẩn (Live Rules JSON)</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                {JSON.stringify(poseRules, null, 2)}
              </pre>
            </div>
            </>
            )}
          </div>
        )}

        {/* TAB 3: FILE GIỌNG NÓI & AUDIO (DIALOGUE ENGINE) */}
        {activeTab === "voice" && (
          <div className="space-y-6">
            {/* Header Action Upload */}
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Mic className="size-6 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">
                    File Giọng nói & Kịch bản Feedback AI Coach
                  </h4>
                  <p className="text-[11px] text-indigo-700">
                    Quy định lời thoại giọng nói, file âm thanh `.mp3` và thời gian đệm Cooldown cho từng mức độ lỗi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs">
                  <UploadCloud className="size-4" />
                  <span>{isUploadingVoiceFile ? "Đang upload..." : "Upload Audio / Dialogue .json"}</span>
                  <input
                    type="file"
                    accept=".mp3,.wav,.json,audio/*,application/json"
                    onChange={handleVoiceFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handlePatchDialogueConfig}
                  disabled={isPatchingVoice}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="size-4" />
                  <span>{isPatchingVoice ? "Đang Patch..." : "Patch Kịch bản Giọng nói lên S3"}</span>
                </button>
              </div>
            </div>

            {/* Coach Personality ID */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label
                  htmlFor={`${fieldIdBase}-personalityId`}
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Tính cách AI Coach (Personality ID):
                </label>
                <input
                  id={`${fieldIdBase}-personalityId`}
                  type="text"
                  value={personalityId}
                  onChange={(e) => setPersonalityId(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-indigo-600 bg-white w-56"
                />
              </div>

              <div className="text-xs text-slate-500">
                Mỗi Coach (ví dụ: <code className="font-bold text-slate-700">coach_alex</code>, <code className="font-bold text-slate-700">coach_sarah</code>) sẽ dùng bộ file giọng nói riêng.
              </div>
            </div>

            {/* Dialogue Map Cards */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Kịch bản Lời thoại & File âm thanh Giọng nói theo Mã lỗi
              </h5>

              {Object.keys(dialogueMap).length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl space-y-3">
                  <Mic className="size-8 text-indigo-500 mx-auto" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Chưa có dữ liệu File Giọng nói (`dialogue_engine_url` chưa được nạp)</p>
                    <p className="text-slate-500 mt-1">Bài tập này chưa có file audio giọng nói hoặc kịch bản lời thoại AI Coach.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPersonalityId("coach_alex");
                      setDialogueMap({
                        ERR_FORM_NOTICE: {
                          severity1: [{ text: "Giữ đúng tư thế chuẩn!", audioUrl: "" }],
                          severity2: [{ text: "Chú ý điều chỉnh tư thế ngay!", audioUrl: "" }],
                        },
                      });
                      setCooldowns({ ERR_FORM_NOTICE: 3.0 });
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="size-4" />
                    <span>Khởi tạo Kịch bản Giọng nói mới</span>
                  </button>
                </div>
              )}

              {Object.entries(dialogueMap).map(([code, item]) => (
                <div
                  key={code}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-indigo-600 text-xs px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200">
                        {code}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Cooldown (giây):</span>
                        <input
                          type="number"
                          step="0.5"
                          value={cooldowns[code] ?? 3.0}
                          onChange={(e) =>
                            setCooldowns({
                              ...cooldowns,
                              [code]: Number.parseFloat(e.target.value) || 3.0,
                            })
                          }
                          className="w-20 text-xs px-2 py-1 rounded-md border border-slate-200 font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveErrorCode(code)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Xoá kịch bản mã lỗi này
                    </button>
                  </div>

                  {/* Severity 1 */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                      <Volume2 className="size-4" />
                      <span>Mức độ 1 (Severity 1 - Nhắc nhở nhẹ):</span>
                    </div>

                    {item.severity1.map((opt, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newSev1 = [...item.severity1];
                            newSev1[idx].text = e.target.value;
                            setDialogueMap({
                              ...dialogueMap,
                              [code]: { ...item, severity1: newSev1 },
                            });
                          }}
                          placeholder="Lời thoại nhắc nhở..."
                          className="md:col-span-6 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-medium"
                        />
                        <input
                          type="text"
                          value={opt.audioUrl}
                          onChange={(e) => {
                            const newSev1 = [...item.severity1];
                            newSev1[idx].audioUrl = e.target.value;
                            setDialogueMap({
                              ...dialogueMap,
                              [code]: { ...item, severity1: newSev1 },
                            });
                          }}
                          placeholder="URL file audio giọng nói (.mp3)"
                          className="md:col-span-5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(opt.audioUrl)}
                          className="md:col-span-1 p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center cursor-pointer"
                          title="Phát thử âm thanh"
                        >
                          {playingAudioUrl === opt.audioUrl ? (
                            <Pause className="size-4 text-indigo-700 animate-pulse" />
                          ) : (
                            <Play className="size-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Severity 2 */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                      <Volume2 className="size-4" />
                      <span>Mức độ 2 (Severity 2 - Cảnh báo nghiêm trọng):</span>
                    </div>

                    {item.severity2.map((opt, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newSev2 = [...item.severity2];
                            newSev2[idx].text = e.target.value;
                            setDialogueMap({
                              ...dialogueMap,
                              [code]: { ...item, severity2: newSev2 },
                            });
                          }}
                          placeholder="Lời thoại cảnh báo nghiêm trọng..."
                          className="md:col-span-6 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-medium"
                        />
                        <input
                          type="text"
                          value={opt.audioUrl}
                          onChange={(e) => {
                            const newSev2 = [...item.severity2];
                            newSev2[idx].audioUrl = e.target.value;
                            setDialogueMap({
                              ...dialogueMap,
                              [code]: { ...item, severity2: newSev2 },
                            });
                          }}
                          placeholder="URL file audio giọng nói (.mp3)"
                          className="md:col-span-5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(opt.audioUrl)}
                          className="md:col-span-1 p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center cursor-pointer"
                          title="Phát thử âm thanh"
                        >
                          {playingAudioUrl === opt.audioUrl ? (
                            <Pause className="size-4 text-indigo-700 animate-pulse" />
                          ) : (
                            <Play className="size-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Dialogue Live JSON Preview */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Code2 className="size-4 text-indigo-600" />
                <span>Xem trước File Dialogue Engine Config JSON tiêu chuẩn</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                {JSON.stringify(
                  {
                    personalityId,
                    cooldowns,
                    dialogueMap,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
