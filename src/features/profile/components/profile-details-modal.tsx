import {
  AlertCircle,
  Check,
  CheckCircle2,
  Dumbbell,
  HelpCircle,
  Scale,
  Shield,
  Target,
  User,
  X,
} from "lucide-react";
import React, { useState } from "react";

import { useCatalogMetadata } from "@/features/exercise/model/catalog-metadata-store";
import type { PreferredWorkoutTimesMap } from "@/features/onboarding/domain/workout-times-normalizer";
import { WorkoutSchedulePicker } from "@/features/onboarding/ui/components/workout-schedule-picker";
import { startAIAdjustment } from "@/features/roadmap/model/ai-adjustment-store";
import { cn } from "@/shared/lib/cn";

import { calculateBMI } from "../model/profile.mapper";
import type { InjuryItem, ProfileViewModel } from "../model/profile.types";
import {
  recoverInjuryServerAction,
  reportInjuryServerAction,
  updateProfileServerAction,
} from "../server/profile-actions";

export type ModalType =
  | "BODY_METRICS"
  | "GOALS"
  | "EQUIPMENT"
  | "PERSONAL_INFO"
  | "INJURY_HISTORY"
  | "FEEDBACK"
  | null;

interface ProfileDetailsModalProps {
  activeModal: ModalType;
  onClose: () => void;
  profile: ProfileViewModel;
  onSaveProfile: (updated: Partial<ProfileViewModel>) => void;
}

export function ProfileDetailsModal({
  activeModal,
  onClose,
  profile,
  onSaveProfile,
}: ProfileDetailsModalProps) {
  if (!activeModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 transition-opacity">
      <div className="relative w-full max-h-[90vh] max-w-xl overflow-y-auto bg-[var(--color-surface)] rounded-t-[var(--radius-card)] sm:rounded-[var(--radius-card)] shadow-2xl border border-[var(--color-border)] font-body">
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-[var(--radius-input)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)] transition-colors z-10 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          {activeModal === "BODY_METRICS" && (
            <BodyMetricsForm profile={profile} onSave={onSaveProfile} onClose={onClose} />
          )}
          {activeModal === "GOALS" && (
            <GoalsForm profile={profile} onSave={onSaveProfile} onClose={onClose} />
          )}
          {activeModal === "EQUIPMENT" && (
            <EquipmentForm profile={profile} onSave={onSaveProfile} onClose={onClose} />
          )}
          {activeModal === "PERSONAL_INFO" && (
            <PersonalInfoForm profile={profile} onSave={onSaveProfile} onClose={onClose} />
          )}
          {activeModal === "INJURY_HISTORY" && (
            <InjuryHistoryForm profile={profile} onSave={onSaveProfile} />
          )}
          {activeModal === "FEEDBACK" && <FeedbackForm onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title = "Confirm Changes",
  message,
  confirmText = "Confirm & Save",
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] p-6 max-w-md w-full shadow-2xl space-y-4 border border-[var(--color-border)]">
        <h3 className="text-base font-bold text-[var(--color-text)] font-display">{title}</h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-[var(--radius-input)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold rounded-[var(--radius-input)] bg-[var(--color-action)] text-[var(--color-action-contrast)] hover:bg-[var(--color-action-strong)] transition-colors cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectableTile({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-[var(--radius-card)] text-left transition-colors cursor-pointer min-h-[64px] border-[1.5px]",
        selected
          ? "border-[var(--color-action)] bg-[var(--color-action-soft)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)]",
      )}
    >
      <div>
        <div
          className={cn(
            "text-sm font-semibold transition-colors",
            selected ? "text-[var(--color-action)]" : "text-[var(--color-text)]",
          )}
        >
          {label}
        </div>
        {description && (
          <div className="text-xs mt-0.5 text-[var(--color-text-muted)]">{description}</div>
        )}
      </div>
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ml-3 border-2",
          selected
            ? "border-[var(--color-action)] bg-[var(--color-action)] text-[var(--color-action-contrast)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-transparent",
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

function BodyMetricsForm({
  profile,
  onSave,
  onClose,
}: {
  profile: ProfileViewModel;
  onSave: (updated: Partial<ProfileViewModel>) => void;
  onClose: () => void;
}) {
  const [data, setData] = useState({
    currentWeightKg: profile.highlights.currentWeightKg || "",
    targetWeightKg: profile.highlights.targetWeightKg || "",
    heightCm: profile.healthMetrics.heightCm || "",
    bodyFatPercent: profile.highlights.bodyFatPercent || "",
    targetBodyFatPercent: profile.healthMetrics.targetBodyFatPercent || "",
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const bmi = React.useMemo(() => {
    if (data.currentWeightKg && data.heightCm) {
      return calculateBMI(Number(data.currentWeightKg), Number(data.heightCm));
    }
    return null;
  }, [data.currentWeightKg, data.heightCm]);

  const confirmSave = async () => {
    setIsSaving(true);
    const updatedPayload: Partial<ProfileViewModel> = {
      highlights: {
        ...profile.highlights,
        currentWeightKg: Number(data.currentWeightKg),
        targetWeightKg: Number(data.targetWeightKg),
        bodyFatPercent: Number(data.bodyFatPercent),
      },
      healthMetrics: {
        ...profile.healthMetrics,
        heightCm: Number(data.heightCm),
        targetBodyFatPercent: Number(data.targetBodyFatPercent),
        bmi: bmi ? bmi.bmi : profile.healthMetrics.bmi,
        bmiCategory: bmi ? bmi.category : profile.healthMetrics.bmiCategory,
      },
    };

    onSave(updatedPayload);
    await updateProfileServerAction(updatedPayload);
    startAIAdjustment({
      reason: "profile_updated",
      targetWeightKg: Number(data.targetWeightKg) || undefined,
    });
    setIsSaving(false);
    setShowConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6 pr-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)]">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)] font-display">Body Metrics</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Update your physical status and target goals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--color-text-muted)]">
            Current Weight (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={data.currentWeightKg}
            onInvalid={(e) => e.preventDefault()}
            onChange={(e) => setData({ ...data, currentWeightKg: e.target.value })}
            className="w-full h-11 px-3.5 text-sm font-data rounded-[var(--radius-input)] border border-[var(--color-border)] outline-none focus:border-[var(--color-action)] bg-[var(--color-surface)] text-[var(--color-text)]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--color-text-muted)]">
            Target Weight (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={data.targetWeightKg}
            onInvalid={(e) => e.preventDefault()}
            onChange={(e) => setData({ ...data, targetWeightKg: e.target.value })}
            className="w-full h-11 px-3.5 text-sm font-data rounded-[var(--radius-input)] border border-[var(--color-border)] outline-none focus:border-[var(--color-action)] bg-[var(--color-surface)] text-[var(--color-text)]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--color-text-muted)]">
            Height (cm)
          </label>
          <input
            type="number"
            value={data.heightCm}
            onInvalid={(e) => e.preventDefault()}
            onChange={(e) => setData({ ...data, heightCm: e.target.value })}
            className="w-full h-11 px-3.5 text-sm font-data rounded-[var(--radius-input)] border border-[var(--color-border)] outline-none focus:border-[var(--color-action)] bg-[var(--color-surface)] text-[var(--color-text)]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--color-text-muted)]">
            Body Fat (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={data.bodyFatPercent}
            onInvalid={(e) => e.preventDefault()}
            onChange={(e) => setData({ ...data, bodyFatPercent: e.target.value })}
            className="w-full h-11 px-3.5 text-sm font-data rounded-[var(--radius-input)] border border-[var(--color-border)] outline-none focus:border-[var(--color-action)] bg-[var(--color-surface)] text-[var(--color-text)]"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold text-[var(--color-text-muted)]">
            Target Body Fat (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={data.targetBodyFatPercent}
            onInvalid={(e) => e.preventDefault()}
            onChange={(e) => setData({ ...data, targetBodyFatPercent: e.target.value })}
            className="w-full h-11 px-3.5 text-sm font-data rounded-[var(--radius-input)] border border-[var(--color-border)] outline-none focus:border-[var(--color-action)] bg-[var(--color-surface)] text-[var(--color-text)]"
          />
        </div>
      </div>

      {bmi && (
        <div className="p-3.5 rounded-[var(--radius-input)] mb-6 bg-[var(--color-action-soft)] border border-[color-mix(in_srgb,var(--color-action)_20%,transparent)] flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)]">
            Calculated Body Mass Index (BMI)
          </span>
          <span className="text-sm font-bold font-data text-[var(--color-action)]">
            {bmi.bmi}{" "}
            <span className="text-xs font-normal text-[var(--color-text-muted)]">
              ({bmi.category})
            </span>
          </span>
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        disabled={isSaving}
        className="w-full h-12 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:bg-[var(--color-action-strong)] text-[var(--color-action-contrast)] font-bold text-sm transition-colors cursor-pointer disabled:opacity-60"
      >
        {isSaving ? "Saving via gRPC..." : "Save Changes"}
      </button>

      {showConfirm && (
        <ConfirmDialog
          message="Updating your body metrics will adjust upcoming workout sessions. Past workouts stay unchanged."
          onConfirm={confirmSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

function GoalsForm({
  profile,
  onSave,
  onClose,
}: {
  profile: ProfileViewModel;
  onSave: (updated: Partial<ProfileViewModel>) => void;
  onClose: () => void;
}) {
  const [experience, setExperience] = useState(profile.user.experienceLevel || "Intermediate");
  const [goals, setGoals] = useState<string[]>(profile.healthMetrics.goals || ["Build Muscle"]);
  const [muscles, setMuscles] = useState<string[]>(
    profile.healthMetrics.preferredMuscleGroups || ["Chest", "Back", "Legs"],
  );
  const { muscles: catalogMuscleGroups, isLoading: isLoadingMuscles } = useCatalogMetadata();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleGoal = (item: string) => {
    if (goals.includes(item)) {
      if (goals.length > 1) {
        setGoals(goals.filter((i) => i !== item));
      }
    } else {
      setGoals([...goals, item]);
    }
  };

  const toggleMuscle = (item: string) => {
    if (muscles.includes(item)) {
      setMuscles(muscles.filter((i) => i !== item));
    } else {
      setMuscles([...muscles, item]);
    }
  };

  const confirmSave = async () => {
    setIsSaving(true);
    const updatedPayload: Partial<ProfileViewModel> = {
      user: { ...profile.user, experienceLevel: experience },
      healthMetrics: { ...profile.healthMetrics, goals, preferredMuscleGroups: muscles },
    };

    onSave(updatedPayload);
    await updateProfileServerAction(updatedPayload);
    startAIAdjustment({
      reason: "profile_updated",
    });
    setIsSaving(false);
    setShowConfirm(false);
    onClose();
  };

  const catalogGoals = [
    { id: "Build Muscle", desc: "Hypertrophy & muscle growth" },
    { id: "Lose Fat", desc: "Calorie burn & lean physique" },
    { id: "Strength", desc: "Pure power & heavier lifts" },
    { id: "Endurance", desc: "Stamina & cardiovascular health" },
  ];

  return (
    <>
      <div className="flex items-center gap-3 mb-6 pr-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-recovery-soft)] text-[var(--color-recovery-strong)]">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)] font-display">
            Training Goals
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Customize your focus, target muscles & experience level
          </p>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {/* Experience Level */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2.5">
            Experience Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["Beginner", "Intermediate", "Advanced"].map((level) => {
              const isSelected = experience === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExperience(level)}
                  className={cn(
                    "py-3 px-2 rounded-[var(--radius-input)] text-xs font-semibold text-center transition-colors cursor-pointer min-h-[44px] border-[1.5px]",
                    isSelected
                      ? "border-[var(--color-action)] bg-[var(--color-action-soft)] text-[var(--color-action)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]",
                  )}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Goals */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2.5">
            Primary Goals (Select at least 1)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {catalogGoals.map((item) => (
              <SelectableTile
                key={item.id}
                label={item.id}
                description={item.desc}
                selected={goals.includes(item.id)}
                onClick={() => toggleGoal(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Preferred Muscle Groups from DB Catalog */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2.5">
            Preferred Muscle Groups (Optional)
          </label>
          {isLoadingMuscles ? (
            <div className="py-4 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
              Loading muscles catalog from server...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {catalogMuscleGroups.map((mg) => {
                const isSelected = muscles.includes(mg.name);
                return (
                  <button
                    key={mg.id}
                    type="button"
                    onClick={() => toggleMuscle(mg.name)}
                    className={cn(
                      "flex items-center justify-center p-3 rounded-[var(--radius-input)] text-center transition-colors cursor-pointer min-h-[48px] border-[1.5px]",
                      isSelected
                        ? "border-[var(--color-action)] bg-[var(--color-action-soft)] text-[var(--color-action)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]",
                    )}
                  >
                    <span className="text-xs font-semibold">{mg.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowConfirm(true)}
        disabled={isSaving}
        className="w-full h-12 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:bg-[var(--color-action-strong)] text-[var(--color-action-contrast)] font-bold text-sm transition-colors cursor-pointer disabled:opacity-60"
      >
        {isSaving ? "Saving via gRPC..." : "Save Goal Plan"}
      </button>

      {showConfirm && (
        <ConfirmDialog
          message="Updating your goals will adjust future session volume & exercise selection. Past history stays intact."
          onConfirm={confirmSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

function EquipmentForm({
  profile,
  onSave,
  onClose,
}: {
  profile: ProfileViewModel;
  onSave: (updated: Partial<ProfileViewModel>) => void;
  onClose: () => void;
}) {
  const [equipment, setEquipment] = useState<string[]>(
    profile.settings.availableEquipment && profile.settings.availableEquipment.length > 0
      ? profile.settings.availableEquipment
      : ["Full Gym"],
  );
  const { equipments: catalogEquipments, isLoading: isLoadingEquipments } = useCatalogMetadata();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleEquipment = (item: string) => {
    if (equipment.includes(item)) {
      if (equipment.length > 1) {
        setEquipment(equipment.filter((i) => i !== item));
      }
    } else {
      setEquipment([...equipment, item]);
    }
  };

  const confirmSave = async () => {
    setIsSaving(true);
    const updatedPayload: Partial<ProfileViewModel> = {
      settings: { ...profile.settings, availableEquipment: equipment },
    };

    onSave(updatedPayload);
    await updateProfileServerAction(updatedPayload);
    startAIAdjustment({
      reason: "profile_updated",
    });
    setIsSaving(false);
    setShowConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6 pr-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)]">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)] font-display">
            Available Equipment
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Select what gear you have access to for workouts
          </p>
        </div>
      </div>

      {isLoadingEquipments ? (
        <div className="py-8 text-center text-xs font-semibold text-[var(--color-text-muted)] animate-pulse">
          Loading equipment catalog from server...
        </div>
      ) : (
        <div className="space-y-2.5 mb-8">
          {catalogEquipments.map((item) => (
            <SelectableTile
              key={item.id}
              label={item.name}
              selected={equipment.includes(item.name)}
              onClick={() => toggleEquipment(item.name)}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        disabled={isSaving}
        className="w-full h-12 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:bg-[var(--color-action-strong)] text-[var(--color-action-contrast)] font-bold text-sm transition-colors cursor-pointer disabled:opacity-60"
      >
        {isSaving ? "Saving via gRPC..." : "Save Equipment"}
      </button>

      {showConfirm && (
        <ConfirmDialog
          message="Updating equipment access will substitute exercises you cannot perform. Upcoming sessions will be regenerated."
          onConfirm={confirmSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

function PersonalInfoForm({
  profile,
  onSave,
  onClose,
}: {
  profile: ProfileViewModel;
  onSave: (updated: Partial<ProfileViewModel>) => void;
  onClose: () => void;
}) {
  const [dob, setDob] = useState(profile.user.dateOfBirth || "1998-05-15");
  const [gender, setGender] = useState(profile.user.gender || "Female");
  const [times, setTimes] = useState<PreferredWorkoutTimesMap | string[]>(
    profile.settings.preferredWorkoutTimes || {},
  );
  const [coachStyle, setCoachStyle] = useState(profile.settings.coachStyle || "Motivational");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const updatedPayload: Partial<ProfileViewModel> = {
      user: { ...profile.user, dateOfBirth: dob, gender },
      settings: { ...profile.settings, preferredWorkoutTimes: times, coachStyle },
    };

    onSave(updatedPayload);
    await updateProfileServerAction(updatedPayload);
    startAIAdjustment({
      reason: "profile_updated",
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6 pr-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)]">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)] font-display">Personal Info</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Manage profile details & coach preferences
          </p>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-muted)]">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full h-11 px-3.5 text-sm rounded-[var(--radius-input)] border border-[var(--color-border)] outline-none focus:border-[var(--color-action)] bg-[var(--color-surface)] text-[var(--color-text)] font-body"
            />
          </div>
          {/* Gender: Male, Female, Other */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-muted)]">Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {["Male", "Female", "Other"].map((g) => {
                const isSelected = gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={cn(
                      "h-11 px-2 rounded-[var(--radius-input)] text-xs font-semibold text-center transition-colors cursor-pointer border-[1.5px]",
                      isSelected
                        ? "border-[var(--color-action)] bg-[var(--color-action-soft)] text-[var(--color-action)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]",
                    )}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2.5">
            Preferred Workout Schedule
          </label>
          <WorkoutSchedulePicker
            value={times}
            onChange={(updated) => setTimes(updated)}
            showTitle={false}
            compact
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2.5">
            AI Coach Style
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: "Motivational", desc: "Encouraging & energetic" },
              { id: "Strict", desc: "Direct & disciplined" },
              { id: "Scientific", desc: "Data-focused & precise" },
            ].map((item) => (
              <SelectableTile
                key={item.id}
                label={item.id}
                description={item.desc}
                selected={coachStyle === item.id}
                onClick={() => setCoachStyle(item.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full h-12 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:bg-[var(--color-action-strong)] text-[var(--color-action-contrast)] font-bold text-sm transition-colors cursor-pointer disabled:opacity-60"
      >
        {isSaving ? "Saving via gRPC..." : "Save Personal Info"}
      </button>
    </>
  );
}

function InjuryHistoryForm({
  profile,
  onSave,
}: {
  profile: ProfileViewModel;
  onSave: (updated: Partial<ProfileViewModel>) => void;
}) {
  const [injuries, setInjuries] = useState<InjuryItem[]>(profile.injuries || []);
  const [showReport, setShowReport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmReport, setShowConfirmReport] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<
    "All" | "Upper Body" | "Lower Body" | "Core & Joints"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newInjury, setNewInjury] = useState({
    muscleGroup: "Shoulders",
    severity: "Mild",
    notes: "",
  });
  const [confirmRecoverId, setConfirmRecoverId] = useState<string | null>(null);

  const { muscles: dynamicDbMuscles } = useCatalogMetadata();

  const baseAnatomyAreas = [
    // Upper Body
    { name: "Shoulders", category: "Upper Body", hint: "Deltoids & Rotator Cuff" },
    { name: "Chest", category: "Upper Body", hint: "Pectorals" },
    { name: "Upper Back", category: "Upper Body", hint: "Rhomboids & Traps" },
    { name: "Lats", category: "Upper Body", hint: "Latissimus Dorsi" },
    { name: "Biceps", category: "Upper Body", hint: "Front Arm" },
    { name: "Triceps", category: "Upper Body", hint: "Back Arm" },
    { name: "Forearms", category: "Upper Body", hint: "Brachioradialis" },
    { name: "Wrist", category: "Upper Body", hint: "Wrist Joint & Tendons" },
    { name: "Elbow", category: "Upper Body", hint: "Elbow Joint" },
    { name: "Neck", category: "Upper Body", hint: "Cervical Spine" },
    { name: "Traps", category: "Upper Body", hint: "Upper Trapezius" },

    // Lower Body
    { name: "Knee", category: "Lower Body", hint: "Patella & Meniscus" },
    { name: "Quadriceps", category: "Lower Body", hint: "Front Thigh" },
    { name: "Hamstrings", category: "Lower Body", hint: "Back Thigh" },
    { name: "Glutes", category: "Lower Body", hint: "Gluteus Maximus" },
    { name: "Calves", category: "Lower Body", hint: "Gastrocnemius" },
    { name: "Ankle", category: "Lower Body", hint: "Ankle Joint & Achilles" },
    { name: "Hip", category: "Lower Body", hint: "Hip Joint & Flexors" },
    { name: "Groin", category: "Lower Body", hint: "Adductors" },

    // Core & Joints
    { name: "Lower Back", category: "Core & Joints", hint: "Lumbar Spine" },
    { name: "Abs", category: "Core & Joints", hint: "Rectus Abdominis" },
    { name: "Obliques", category: "Core & Joints", hint: "Side Core" },
  ];

  // Merge DB catalog muscles seamlessly
  const anatomyAreas = [
    ...baseAnatomyAreas,
    ...dynamicDbMuscles
      .filter(
        (dbM) => !baseAnatomyAreas.some((b) => b.name.toLowerCase() === dbM.name.toLowerCase()),
      )
      .map((dbM) => ({
        name: dbM.name,
        category: "Upper Body" as "Upper Body" | "Lower Body" | "Core & Joints",
        hint: "From Database Catalog",
      })),
  ];

  const filteredMuscles = anatomyAreas.filter((m) => {
    const matchesCategory = categoryFilter === "All" || m.category === categoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.hint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmitInjury = async () => {
    setIsSubmitting(true);
    setShowConfirmReport(false);
    try {
      const notesPayload = newInjury.notes.trim() || "Reported via profile";
      const res = await reportInjuryServerAction({
        muscleGroup: newInjury.muscleGroup,
        severity: newInjury.severity,
        notes: notesPayload,
      });

      const item: InjuryItem = {
        id: res.injuryId || Date.now().toString(),
        muscleGroup: newInjury.muscleGroup,
        severity: newInjury.severity,
        notes: notesPayload,
        isRecovered: false,
        reportedAt: new Date().toISOString().split("T")[0],
      };
      const updated = [...injuries, item];
      setInjuries(updated);
      onSave({ injuries: updated });
      startAIAdjustment({
        reason: "injury_reported",
        muscleGroup: newInjury.muscleGroup,
      });
      setShowReport(false);
      setNewInjury({ muscleGroup: "Shoulders", severity: "Mild", notes: "" });
    } catch (error) {
      console.error("Failed to submit injury report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecover = async () => {
    if (!confirmRecoverId) {
      return;
    }

    const targetInj = injuries.find((i) => i.id === confirmRecoverId);
    await recoverInjuryServerAction(confirmRecoverId);

    const updated = injuries.map((i) =>
      i.id === confirmRecoverId ? { ...i, isRecovered: true } : i,
    );
    setInjuries(updated);
    onSave({ injuries: updated });
    startAIAdjustment({
      reason: "injury_recovered",
      muscleGroup: targetInj?.muscleGroup,
    });
    setConfirmRecoverId(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 pr-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)] font-display">
              Injury Management
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Track pain areas so AI Coach protects you
            </p>
          </div>
        </div>
        {!showReport && (
          <button
            onClick={() => setShowReport(true)}
            className="text-xs font-bold px-3.5 py-2 rounded-[var(--radius-input)] bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] transition-colors cursor-pointer shrink-0"
          >
            + Report Injury
          </button>
        )}
      </div>

      {showReport && (
        <div className="p-4 rounded-[var(--radius-card)] mb-6 border border-[var(--color-border)] bg-[var(--color-surface-subtle)] space-y-4">
          <h3 className="text-xs font-bold text-[var(--color-text)]">Report New Injury</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Muscle Group & Joint Area
                </label>
                <span className="text-[11px] text-[var(--color-action)] font-semibold">
                  Selected: {newInjury.muscleGroup}
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap gap-1.5">
                {(["All", "Upper Body", "Lower Body", "Core & Joints"] as const).map((cat) => {
                  const isCatSelected = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-semibold rounded-[var(--radius-input)] transition-colors cursor-pointer",
                        isCatSelected
                          ? "bg-[var(--color-action)] text-[var(--color-action-contrast)]"
                          : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]",
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search muscle or joint (e.g. Biceps, Hamstrings, Elbow...)"
                className="w-full h-9 px-3 text-xs rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-body outline-none focus:border-[var(--color-action)]"
              />

              {/* Muscle Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {filteredMuscles.map((m) => {
                  const isSelected = newInjury.muscleGroup === m.name;
                  return (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setNewInjury({ ...newInjury, muscleGroup: m.name })}
                      className={cn(
                        "p-2 text-left rounded-[var(--radius-input)] transition-all cursor-pointer border-[1.5px]",
                        isSelected
                          ? "border-[var(--color-action)] bg-[var(--color-action-soft)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)]",
                      )}
                    >
                      <div
                        className={cn(
                          "text-xs font-bold",
                          isSelected ? "text-[var(--color-action)]" : "text-[var(--color-text)]",
                        )}
                      >
                        {m.name}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                        {m.hint}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                Severity & AI Protocol
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: "Mild", label: "Mild", desc: "Reduce load & sets by 30%" },
                  { id: "Moderate", label: "Moderate", desc: "Substitute compound with isolation" },
                  { id: "Severe", label: "Severe", desc: "Complete rest & exclude area" },
                ].map((s) => {
                  const isSelected = newInjury.severity === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNewInjury({ ...newInjury, severity: s.id })}
                      className={cn(
                        "p-2.5 text-left rounded-[var(--radius-input)] text-xs transition-all cursor-pointer border-[1.5px]",
                        isSelected
                          ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)]",
                      )}
                    >
                      <div
                        className={cn(
                          "font-bold",
                          isSelected ? "text-[var(--color-danger)]" : "text-[var(--color-text)]",
                        )}
                      >
                        {s.label}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                        {s.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Notes</label>
              <input
                value={newInjury.notes}
                onChange={(e) => setNewInjury({ ...newInjury, notes: e.target.value })}
                placeholder="e.g. Pain during overhead press..."
                className="w-full h-11 px-3.5 text-xs rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-body outline-none focus:border-[var(--color-action)]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowReport(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] rounded-[var(--radius-input)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmReport(true)}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 text-xs font-bold text-[var(--color-action-contrast)] bg-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_90%,black)] disabled:opacity-50 rounded-[var(--radius-input)] cursor-pointer"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {injuries.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-[var(--radius-card)] bg-[var(--color-recovery-soft)] border border-[color-mix(in_srgb,var(--color-recovery-strong)_20%,transparent)]">
            <Shield className="h-5 w-5 text-[var(--color-recovery-strong)] shrink-0" />
            <span className="text-xs font-medium text-[var(--color-recovery-strong)]">
              All clear! No active injuries reported.
            </span>
          </div>
        ) : (
          injuries.map((injury) => (
            <div
              key={injury.id}
              className={cn(
                "p-4 rounded-[var(--radius-card)] border flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                injury.isRecovered
                  ? "bg-[var(--color-surface-subtle)] border-[var(--color-border)] opacity-60"
                  : "bg-[var(--color-danger-soft)] border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)]",
              )}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      injury.isRecovered
                        ? "text-[var(--color-text-muted)] line-through"
                        : "text-[var(--color-danger)]",
                    )}
                  >
                    {injury.muscleGroup}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                      injury.isRecovered
                        ? "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                        : "bg-[var(--color-surface)] text-[var(--color-danger)] border border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)]",
                    )}
                  >
                    {injury.severity}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-xs",
                    injury.isRecovered
                      ? "text-[var(--color-text-muted)] line-through"
                      : "text-[var(--color-danger)]",
                  )}
                >
                  {injury.notes}
                </p>
              </div>

              {!injury.isRecovered && (
                <button
                  onClick={() => setConfirmRecoverId(injury.id)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-input)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-recovery-strong)] hover:bg-[var(--color-recovery-soft)] transition-colors shrink-0 cursor-pointer"
                >
                  Mark as Recovered
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showConfirmReport && (
        <ConfirmDialog
          title="Confirm Injury Report & Recalibrate"
          message={`Reporting an active injury on your ${newInjury.muscleGroup} will instruct AI Coach to immediately adjust and remove affected muscle exercises from your upcoming schedule. Past workouts stay untouched.`}
          confirmText="Confirm & Recalibrate"
          onConfirm={handleSubmitInjury}
          onCancel={() => setShowConfirmReport(false)}
        />
      )}

      {confirmRecoverId && (
        <ConfirmDialog
          title="Confirm Recovery Mode"
          message="Marking as recovered will activate a 3-session protection period. AI Coach will cap load to 50% of your PR for this muscle area."
          confirmText="Confirm Recovery"
          onConfirm={handleRecover}
          onCancel={() => setConfirmRecoverId(null)}
        />
      )}
    </>
  );
}

function FeedbackForm({ onClose }: { onClose: () => void }) {
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!feedback) {
      return;
    }
    setSent(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6 pr-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] bg-[var(--color-action-soft)] text-[var(--color-action)]">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text)] font-display">Send Feedback</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Help the FITAI team improve your experience
          </p>
        </div>
      </div>

      {sent ? (
        <div className="p-8 text-center space-y-2">
          <CheckCircle2 className="h-10 w-10 text-[var(--color-recovery-strong)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--color-text)]">Thank You!</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Your feedback has been submitted to the team.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts, suggestions, or issues..."
            className="w-full p-3.5 border border-[var(--color-border)] rounded-[var(--radius-input)] min-h-[120px] outline-none text-xs focus:border-[var(--color-action)] font-body bg-[var(--color-surface)] text-[var(--color-text)]"
          />
          <button
            onClick={handleSubmit}
            className="w-full h-12 rounded-[var(--radius-input)] bg-[var(--color-action)] hover:bg-[var(--color-action-strong)] text-[var(--color-action-contrast)] font-bold text-sm transition-colors cursor-pointer"
          >
            Submit Feedback
          </button>
        </div>
      )}
    </>
  );
}
