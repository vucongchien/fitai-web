"use client";

import { Archive, ArrowLeft, CheckCircle2, Save, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import {
  approveExercise,
  archiveExercise,
  deleteExercise,
} from "@/features/admin/api/admin-exercise-service";
import {
  EXERCISE_STATUS_LABEL,
  EXERCISE_STATUS_STYLE,
  NEW_ADMIN_EXERCISE,
  type AdminExercise,
  type AdminExerciseStatus,
} from "@/features/admin/domain/admin-types";
import { getAiSupportState, validateMotionSlug } from "@/features/admin/domain/exercise-ai-support";
import { saveAdminExercise } from "@/features/admin/model/save-admin-exercise";
import { MotionSpecDialog } from "@/features/admin/ui/motion-spec-dialog";
import type {
  Equipment,
  ExerciseCategory,
  ExerciseForce,
  ExerciseLevel,
  ExerciseMechanic,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import type { EnumOption } from "@/shared/lib/taxonomy";
import {
  CATEGORY_OPTIONS,
  EQUIPMENT_OPTIONS,
  FORCE_OPTIONS,
  LEVEL_OPTIONS,
  MECHANIC_OPTIONS,
  MUSCLE_GROUP_OPTIONS,
} from "@/shared/lib/taxonomy";
import { toast } from "@/shared/ui/toast";

const FIELD_CLASS =
  "w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--color-border)] focus:border-[var(--color-action)] focus:bg-[var(--color-surface)] rounded-[var(--radius-input)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none transition-all";
const LABEL_CLASS = "text-xs font-bold text-[var(--color-text-muted)]";
const CARD_CLASS =
  "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-hero)] p-6 space-y-4 shadow-xs";

function toLines(text: string): string[] {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

interface EnumSelectProps<T extends number> {
  id: string;
  label: string;
  value: T;
  options: EnumOption<T>[];
  onChange: (value: T) => void;
  /** Label for UNSPECIFIED; omit when the field is required. */
  noneLabel?: string;
}

function EnumSelect<T extends number>({
  id,
  label,
  value,
  options,
  onChange,
  noneLabel,
}: EnumSelectProps<T>) {
  return (
    <div className="space-y-1.5">
      <label className={LABEL_CLASS} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as T)}
        className={`${FIELD_CLASS} cursor-pointer`}
      >
        {noneLabel ? <option value={0}>{noneLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface UrlFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

function UrlField({ id, label, value, placeholder, onChange }: UrlFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className={LABEL_CLASS} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={FIELD_CLASS}
      />
    </div>
  );
}

/** Edits a saved exercise, or creates one on first save when `initialExercise` is null. */
export function AdminExerciseForm({ initialExercise }: { initialExercise: AdminExercise | null }) {
  const fieldIdBase = useId();
  const router = useRouter();
  const initial = initialExercise ?? NEW_ADMIN_EXERCISE;

  const [exercise, setExercise] = useState<AdminExercise | null>(initialExercise);
  const [isSaving, setIsSaving] = useState(false);
  const [isMotionSpecDialogOpen, setIsMotionSpecDialogOpen] = useState(false);

  const [name, setName] = useState(initial.name);
  const [status, setStatus] = useState<AdminExerciseStatus>(initial.status);
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>(initial.primaryMuscle);
  const [secondaryMuscles, setSecondaryMuscles] = useState<MuscleGroup[]>(initial.secondaryMuscles);
  const [equipment, setEquipment] = useState<Equipment>(initial.equipment);
  const [category, setCategory] = useState<ExerciseCategory>(initial.category);
  const [level, setLevel] = useState<ExerciseLevel>(initial.level);
  const [force, setForce] = useState<ExerciseForce>(initial.force);
  const [mechanic, setMechanic] = useState<ExerciseMechanic>(initial.mechanic);
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(initial.defaultRestSeconds);
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl);
  const [startImage, setStartImage] = useState(initial.images[0] ?? "");
  const [endImage, setEndImage] = useState(initial.images[1] ?? "");
  const [instructions, setInstructions] = useState(initial.instructions.join("\n"));
  const [motionSlug, setMotionSlug] = useState(initial.motionSlug);

  // AI rules follow the saved motion slug, not the unsaved draft.
  const aiState = getAiSupportState({
    hasAiSupported: exercise?.hasAiSupported ?? false,
    motionSlug: exercise?.motionSlug ?? "",
  });
  const motionSlugError = validateMotionSlug(exercise?.hasAiSupported ?? false, motionSlug);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter an exercise title");
      return;
    }
    if (motionSlugError) {
      toast.error(motionSlugError);
      return;
    }
    setIsSaving(true);
    try {
      const result = await saveAdminExercise(exercise?.id ?? null, {
        name: name.trim(),
        status,
        primaryMuscle,
        secondaryMuscles: secondaryMuscles.filter((muscle) => muscle !== primaryMuscle),
        equipment,
        category,
        level,
        force,
        mechanic,
        defaultRestSeconds,
        videoUrl: videoUrl.trim(),
        images: [startImage.trim(), endImage.trim()].filter(Boolean),
        instructions: toLines(instructions),
        motionSlug: motionSlug.trim(),
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setExercise(result.exercise);
      toast.success(exercise ? "Exercise updated successfully!" : "Exercise created successfully!");
      router.push("/admin/exercises");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (saved: AdminExercise) => {
    const updated = await approveExercise(saved.id);
    setExercise(updated);
    setStatus("approved");
  };

  const handleArchive = async (saved: AdminExercise) => {
    await archiveExercise(saved.id);
    setStatus("archived");
  };

  const handleDelete = async (saved: AdminExercise) => {
    if (confirm(`Delete "${saved.name}" permanently?`)) {
      await deleteExercise(saved.id);
      router.push("/admin/exercises");
    }
  };

  const toggleSecondary = (muscle: MuscleGroup) => {
    setSecondaryMuscles((current) =>
      current.includes(muscle) ? current.filter((entry) => entry !== muscle) : [...current, muscle],
    );
  };

  const statusStyle = EXERCISE_STATUS_STYLE[status];

  return (
    <form noValidate onSubmit={handleSave} className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/exercises"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-action)] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Exercise Catalog</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--color-text)] font-display">
              {name || "New exercise"}
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              {EXERCISE_STATUS_LABEL[status]}
            </span>
          </div>
          <p className="text-xs font-mono text-[var(--color-text-muted)]">
            {exercise ? exercise.slug : "Slug is generated from the title on first save."}
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          {exercise ? (
            <>
              <button
                type="button"
                disabled={!aiState.canConfigure}
                title={aiState.message}
                onClick={() => setIsMotionSpecDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-input)] bg-[var(--color-action-soft)] hover:opacity-90 text-[var(--color-action)] border border-[color-mix(in_srgb,var(--color-action)_25%,transparent)] text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="size-4 text-[var(--color-action)]" />
                <span>AI Rules & Voice</span>
              </button>

              {status === "created" && (
                <button
                  type="button"
                  onClick={() => handleApprove(exercise)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-input)] bg-[var(--color-recovery-soft)] hover:opacity-90 text-[var(--color-recovery-ink)] border border-[color-mix(in_srgb,var(--color-recovery)_25%,transparent)] text-xs font-bold transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="size-4" />
                  <span>Approve Entry</span>
                </button>
              )}

              {status !== "archived" && (
                <button
                  type="button"
                  onClick={() => handleArchive(exercise)}
                  className="p-2 rounded-[var(--radius-input)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)] text-xs font-bold transition-colors cursor-pointer"
                  title="Archive Exercise"
                >
                  <Archive className="size-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDelete(exercise)}
                className="p-2 rounded-[var(--radius-input)] bg-[var(--color-surface)] hover:bg-[var(--color-danger-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] border border-[var(--color-border)] text-xs font-bold transition-colors cursor-pointer"
                title="Delete Exercise"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:opacity-90 text-[var(--color-action-contrast)] font-bold text-xs shadow-md shadow-[var(--color-action-soft)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="size-4" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={CARD_CLASS}>
            <h3 className="text-sm font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-3">
              General Exercise Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className={LABEL_CLASS} htmlFor={`${fieldIdBase}-name`}>
                  Exercise Title *
                </label>
                <input
                  id={`${fieldIdBase}-name`}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>

              <div className="space-y-1.5">
                <label className={LABEL_CLASS} htmlFor={`${fieldIdBase}-status`}>
                  Status
                </label>
                <select
                  id={`${fieldIdBase}-status`}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AdminExerciseStatus)}
                  className={`${FIELD_CLASS} cursor-pointer`}
                >
                  <option value="created">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <EnumSelect
                id={`${fieldIdBase}-level`}
                label="Level *"
                value={level}
                options={LEVEL_OPTIONS}
                onChange={setLevel}
              />
              <EnumSelect
                id={`${fieldIdBase}-category`}
                label="Category *"
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={setCategory}
              />
              <EnumSelect
                id={`${fieldIdBase}-primary`}
                label="Primary Muscle *"
                value={primaryMuscle}
                options={MUSCLE_GROUP_OPTIONS}
                onChange={setPrimaryMuscle}
              />
              <EnumSelect
                id={`${fieldIdBase}-equipment`}
                label="Equipment *"
                value={equipment}
                options={EQUIPMENT_OPTIONS}
                onChange={setEquipment}
              />
              <EnumSelect
                id={`${fieldIdBase}-force`}
                label="Force"
                value={force}
                options={FORCE_OPTIONS}
                onChange={setForce}
                noneLabel="Not set"
              />
              <EnumSelect
                id={`${fieldIdBase}-mechanic`}
                label="Mechanic"
                value={mechanic}
                options={MECHANIC_OPTIONS}
                onChange={setMechanic}
                noneLabel="Not set"
              />

              <div className="space-y-1.5">
                <label className={LABEL_CLASS} htmlFor={`${fieldIdBase}-rest`}>
                  Default Rest Time (Seconds)
                </label>
                <input
                  id={`${fieldIdBase}-rest`}
                  type="number"
                  value={defaultRestSeconds}
                  onChange={(e) => setDefaultRestSeconds(Number(e.target.value))}
                  className={FIELD_CLASS}
                />
              </div>
            </div>
          </div>

          <div className={CARD_CLASS}>
            <label
              className="text-sm font-bold text-[var(--color-text)]"
              htmlFor={`${fieldIdBase}-steps`}
            >
              Step-by-Step Instructions
            </label>
            <p className="text-xs text-[var(--color-text-muted)]">One step per line.</p>
            <textarea
              id={`${fieldIdBase}-steps`}
              rows={6}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Stand with your feet shoulder-width apart..."
              className={FIELD_CLASS}
            />
          </div>

          <div className={CARD_CLASS}>
            <h3 className="text-sm font-bold text-[var(--color-text)] border-b border-[var(--color-border)] pb-3">
              Media
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UrlField
                id={`${fieldIdBase}-img-start`}
                label="Start Position Image URL"
                value={startImage}
                placeholder="https://.../0.jpg"
                onChange={setStartImage}
              />
              <UrlField
                id={`${fieldIdBase}-img-end`}
                label="End Position Image URL"
                value={endImage}
                placeholder="https://.../1.jpg"
                onChange={setEndImage}
              />
              <UrlField
                id={`${fieldIdBase}-video-url`}
                label="Video URL (optional)"
                value={videoUrl}
                placeholder="https://.../video.mp4"
                onChange={setVideoUrl}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={CARD_CLASS}>
            <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center justify-between">
              <span>AI Form Tracking</span>
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                {exercise?.hasAiSupported ? "On" : "Off"}
              </span>
            </h3>
            <div className="space-y-1.5">
              <label className={LABEL_CLASS} htmlFor={`${fieldIdBase}-motion-slug`}>
                Motion Slug
              </label>
              <input
                id={`${fieldIdBase}-motion-slug`}
                type="text"
                value={motionSlug}
                onChange={(e) => setMotionSlug(e.target.value)}
                placeholder="e.g. squat"
                aria-invalid={Boolean(motionSlugError)}
                className={`${FIELD_CLASS} font-mono`}
              />
              {motionSlugError ? (
                <p className="text-xs text-[var(--color-danger)]" role="alert">
                  {motionSlugError}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">{aiState.message}</p>
          </div>

          <div className={CARD_CLASS}>
            <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center justify-between">
              <span>Secondary Muscles</span>
              <span className="text-xs text-[var(--color-action)] font-mono">
                {secondaryMuscles.length} Selected
              </span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUP_OPTIONS.filter((option) => option.value !== primaryMuscle).map(
                (option) => {
                  const isSelected = secondaryMuscles.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleSecondary(option.value)}
                      className={`px-2.5 py-1 rounded-[var(--radius-input)] text-xs font-semibold transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-[var(--color-action)] text-[var(--color-action-contrast)] border-[var(--color-action)]"
                          : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </div>

      {exercise ? (
        <MotionSpecDialog
          isOpen={isMotionSpecDialogOpen}
          exerciseId={exercise.id}
          exerciseName={name}
          onClose={() => setIsMotionSpecDialogOpen(false)}
        />
      ) : null}
    </form>
  );
}
