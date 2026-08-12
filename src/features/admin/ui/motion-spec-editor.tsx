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
      toast.success("Motion Spec updated successfully!");
      if (onSaveSuccess) onSaveSuccess(updated);
    } catch (err) {
      toast.error("Failed to save Motion Spec: " + String(err));
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
        toast.success(`Loaded rule JSON file: ${file.name}`);
      } catch (err) {
        toast.info("Uploaded file is not standard JSON, but URL has been saved");
      }

      setLocalRulesUrl(presigned.fileUrl);
      toast.success(`Uploaded rule file successfully! URL: ${presigned.fileUrl}`);
    } catch (err) {
      toast.error("Failed to upload rule file: " + String(err));
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
          toast.success("Loaded voice dialogue configuration from JSON");
        } catch (err) {
          toast.info("Dialogue file is not standard JSON");
        }
        setDialogueEngineUrl(presigned.fileUrl);
      } else {
        toast.success(`Uploaded voice audio successfully! URL: ${presigned.fileUrl}`);
      }
    } catch (err) {
      toast.error("Failed to upload voice file: " + String(err));
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
      toast.success("Successfully patched Pose Rules file to Cloud Storage!");
      if (onSaveSuccess) {
        onSaveSuccess({
          ...spec,
          localRulesUrl: res.fileUrl,
          poseRules: poseRules ?? undefined,
        });
      }
    } catch (err) {
      toast.error("Failed to patch rule file: " + String(err));
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
      toast.success("Successfully patched Voice & Dialogue script to Cloud Storage!");
      if (onSaveSuccess) {
        onSaveSuccess({
          ...spec,
          dialogueEngineUrl: res.fileUrl,
          dialogueEngine: fullConfig,
        });
      }
    } catch (err) {
      toast.error("Failed to patch dialogue script: " + String(err));
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
            description: newErrorDesc || "Pose error description",
            joint: "knee_left_right",
            thresholdDegrees: 15,
          },
        },
      };
    });

    setDialogueMap((prev) => ({
      ...prev,
      [formatted]: {
        severity1: [{ text: `Warning: ${newErrorDesc || formatted}`, audioUrl: "" }],
        severity2: [{ text: `Caution: ${newErrorDesc || formatted}`, audioUrl: "" }],
      },
    }));

    setCooldowns((prev) => ({ ...prev, [formatted]: 3.0 }));
    setNewErrorCode("");
    setNewErrorDesc("");
    toast.success(`Added new error code: ${formatted}`);
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
    toast.info(`Removed error code ${code}`);
  };

  // Play audio preview
  const handlePlayAudio = (url: string) => {
    if (!url) {
      toast.info("No audio file URL configured for this dialogue line");
      return;
    }
    const audio = new Audio(url);
    setPlayingAudioUrl(url);
    audio.play().catch(() => {
      toast.info(`Simulating voice audio playback: ${url}`);
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
              AI Rules & Voice Coaching Configuration
            </h3>
            <p className="text-xs text-slate-500">
              Exercise ID: <code className="text-indigo-600 font-mono font-bold">{spec.exerciseId}</code>
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
            <span>Overview & Models</span>
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
            <span>Pose Rules (.json)</span>
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
            <span>Voice & Audio Files</span>
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
                  Pose Rules File URL (`local_rules_url`)
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
                  Dialogue Script File URL (`dialogue_engine_url`)
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
                  Recommended Camera Angle
                </label>
                <select
                  id={`${fieldIdBase}-recommendedCameraAngle`}
                  value={recommendedCameraAngle}
                  onChange={(e) => setRecommendedCameraAngle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-semibold cursor-pointer"
                >
                  <option value="side">Side View (90°)</option>
                  <option value="front">Front View (0°)</option>
                  <option value="45_degree">Diagonal View (45° Angle)</option>
                  <option value="overhead">Overhead View</option>
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
                <span>{isSavingGeneral ? "Saving..." : "Save Motion Spec"}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: POSE RULES */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            {/* Header Action Upload */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <FileJson className="size-6 text-amber-600" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    Local Pose Rules (JSON)
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    Defines rep counting thresholds, form penalty scores, joint angle limits, and camera distances.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs">
                  <UploadCloud className="size-4" />
                  <span>{isUploadingRuleFile ? "Uploading..." : "Upload Rule File (.json)"}</span>
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
                  <span>{isPatchingRules ? "Patching..." : "Patch Rule File to S3"}</span>
                </button>
              </div>
            </div>

            {!poseRules ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-amber-300 bg-amber-50/50 rounded-2xl space-y-3">
                <FileJson className="size-8 text-amber-500 mx-auto" />
                <div>
                  <p className="font-bold text-slate-800 text-sm">No Pose Rules File data (`local_rules_url` not loaded)</p>
                  <p className="text-slate-500 mt-1">This exercise does not have a rule JSON file or pose rule configuration yet.</p>
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
                  <span>Initialize New Pose Rules</span>
                </button>
              </div>
            ) : (
              <>

            {/* Threshold & Calibration Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="size-3.5 text-indigo-600" />
                  <span>Camera Calibration</span>
                </h5>
                <div>
                  <label
                    htmlFor={`${fieldIdBase}-minDistanceMeters`}
                    className="text-[11px] text-slate-500 font-medium"
                  >
                    Minimum Distance (meters):
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
                    Maximum Distance (meters):
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
                  <span>Rep Counting Rules</span>
                </h5>
                <div>
                  <label
                    htmlFor={`${fieldIdBase}-minRomPercentage`}
                    className="text-[11px] text-slate-500 font-medium"
                  >
                    Minimum Range of Motion (ROM %):
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
                  <span>Form Scoring & Penalties</span>
                </h5>
                <div>
                  <label
                    htmlFor={`${fieldIdBase}-penaltyPerError`}
                    className="text-[11px] text-slate-500 font-medium"
                  >
                    Penalty points per form error:
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
                  Pose Error Rules List
                </h5>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Error code (e.g. ERR_KNEE_VALGUS)"
                    value={newErrorCode}
                    onChange={(e) => setNewErrorCode(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 w-52 font-mono uppercase"
                  />
                  <input
                    type="text"
                    placeholder="Pose error description"
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
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-3">Error Code</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Tracked Joint</th>
                      <th className="p-3">Deviation Threshold (°)</th>
                      <th className="p-3 text-right">Actions</th>
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
                <span>Preview Standard Rule JSON (Live Rules JSON)</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                {JSON.stringify(poseRules, null, 2)}
              </pre>
            </div>
            </>
            )}
          </div>
        )}

        {/* TAB 3: AUDIO & VOICE (DIALOGUE ENGINE) */}
        {activeTab === "voice" && (
          <div className="space-y-6">
            {/* Header Action Upload */}
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Mic className="size-6 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">
                    Voice Files & AI Coach Feedback Scripts
                  </h4>
                  <p className="text-[11px] text-indigo-700">
                    Defines voice dialogue cues, audio `.mp3` files, and cooldown buffers for each error severity level.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs">
                  <UploadCloud className="size-4" />
                  <span>{isUploadingVoiceFile ? "Uploading..." : "Upload Audio / Dialogue (.json)"}</span>
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
                  <span>{isPatchingVoice ? "Patching..." : "Patch Dialogue Script to S3"}</span>
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
                  AI Coach Personality ID:
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
                Each Coach (e.g., <code className="font-bold text-slate-700">coach_alex</code>, <code className="font-bold text-slate-700">coach_sarah</code>) uses a dedicated voice set.
              </div>
            </div>

            {/* Dialogue Map Cards */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Dialogue Scripts & Voice Audio Files by Error Code
              </h5>

              {Object.keys(dialogueMap).length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl space-y-3">
                  <Mic className="size-8 text-indigo-500 mx-auto" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">No Voice File data (`dialogue_engine_url` not loaded)</p>
                    <p className="text-slate-500 mt-1">This exercise does not have a voice audio file or AI Coach dialogue script yet.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPersonalityId("coach_alex");
                      setDialogueMap({
                        ERR_FORM_NOTICE: {
                          severity1: [{ text: "Maintain proper form!", audioUrl: "" }],
                          severity2: [{ text: "Correct your posture immediately!", audioUrl: "" }],
                        },
                      });
                      setCooldowns({ ERR_FORM_NOTICE: 3.0 });
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="size-4" />
                    <span>Initialize New Dialogue Script</span>
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
                        <span className="text-xs text-slate-500 font-medium">Cooldown (s):</span>
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
                      Delete this error script
                    </button>
                  </div>

                  {/* Severity 1 */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                      <Volume2 className="size-4" />
                      <span>Severity 1 (Minor Cue / Reminder):</span>
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
                          placeholder="Reminder dialogue..."
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
                          placeholder="Voice audio file URL (.mp3)"
                          className="md:col-span-5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(opt.audioUrl)}
                          className="md:col-span-1 p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center cursor-pointer"
                          title="Preview audio"
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
                      <span>Severity 2 (Major Warning):</span>
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
                          placeholder="Critical warning dialogue..."
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
                          placeholder="Voice audio file URL (.mp3)"
                          className="md:col-span-5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(opt.audioUrl)}
                          className="md:col-span-1 p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center cursor-pointer"
                          title="Preview audio"
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
                <span>Preview Standard Dialogue Engine Config JSON</span>
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
