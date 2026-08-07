import {
  AlertTriangle,
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
      <div className="relative w-full max-h-[90vh] max-w-xl overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-neutral-200/80 font-body">
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors z-10"
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

/* ==========================================
   CONFIRM DIALOG COMPONENT
   ========================================== */
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
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-neutral-200">
        <h3 className="text-base font-bold text-[#101214] font-display">{title}</h3>
        <p className="text-xs text-[#50565C] leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 text-[#50565C] hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#4B57F2] text-white hover:bg-[#3945DC] transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   SELECTION TILE COMPONENT
   ========================================== */
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
      className="w-full flex items-center justify-between p-4 rounded-xl text-left transition-colors cursor-pointer min-h-[64px]"
      style={{
        border: "1.5px solid",
        borderColor: selected ? "#4B57F2" : "#E5E7EB",
        backgroundColor: selected ? "#F4F5FF" : "#FFFFFF",
      }}
    >
      <div>
        <div className="text-sm font-semibold" style={{ color: selected ? "#4B57F2" : "#101214" }}>
          {label}
        </div>
        {description && (
          <div className="text-xs mt-0.5" style={{ color: "#50565C" }}>
            {description}
          </div>
        )}
      </div>
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ml-3"
        style={{
          border: "2px solid",
          borderColor: selected ? "#4B57F2" : "#D1D5DB",
          backgroundColor: selected ? "#4B57F2" : "#FFFFFF",
          color: selected ? "#FFFFFF" : "transparent",
        }}
      >
        <Check className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

/* ==========================================
   FORM 1: BODY METRICS
   ========================================== */
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
    const updatedPayload = {
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

    await updateProfileServerAction(updatedPayload);
    onSave(updatedPayload);
    setIsSaving(false);
    setShowConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6 pr-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#4B57F2]">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#101214] font-display">Body Metrics</h2>
          <p className="text-xs text-[#50565C]">Update your physical status and target goals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#50565C]">Current Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={data.currentWeightKg}
            onInvalid={(e) => e.preventDefault()}
            onChange={(e) => setData({ ...data, currentWeightKg: e.target.value })}
            className="w-full h-11 px-3.5 text-sm font-data rounded-xl border border-neutral-200 outline-none focus:border-[#4B57F2] bg-neutral-50/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#50565C]">Target Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={data.targetWeightKg}
            onInvalid={(e) => e.preventDefault()}
            onChange={(e) => setData({ ...data, targetWeightKg: e.target.value })}
            className="w-full h-11 px-3.5 text-sm font-data rounded-xl border border-neutral-200 outline-none focus:border-[#4B57F2] bg-neutral-50/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#50565C]">Height (cm)</label>
          <input
            type="number"
            value={data.heightCm}
            onInvalid={(e) => e.preventDefault()}
            onChange={(e) => setData({ ...data, heightCm: e.target.value })}
            className="w-full h-11 px-3.5 text-sm font-data rounded-xl border border-neutral-200 outline-none focus:border-[#4B57F2] bg-neutral-50/30"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#50565C]">Body Fat (%)</label>
          <input
            type="number"
            step="0.1"
            value={data.bodyFatPercent}
            onInvalid={(e) => e.preventDefault()}
            onChange={(e) => setData({ ...data, bodyFatPercent: e.target.value })}
            className="w-full h-11 px-3.5 text-sm font-data rounded-xl border border-neutral-200 outline-none focus:border-[#4B57F2] bg-neutral-50/30"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold text-[#50565C]">Target Body Fat (%)</label>
          <input
            type="number"
            step="0.1"
            value={data.targetBodyFatPercent}
            onInvalid={(e) => e.preventDefault()}
            onChange={(e) => setData({ ...data, targetBodyFatPercent: e.target.value })}
            className="w-full h-11 px-3.5 text-sm font-data rounded-xl border border-neutral-200 outline-none focus:border-[#4B57F2] bg-neutral-50/30"
          />
        </div>
      </div>

      {bmi && (
        <div className="p-3.5 rounded-xl mb-6 bg-blue-50/60 border border-blue-100 flex items-center justify-between">
          <span className="text-xs text-[#50565C]">Calculated Body Mass Index (BMI)</span>
          <span className="text-sm font-bold font-data text-[#4B57F2]">
            {bmi.bmi} <span className="text-xs font-normal text-[#50565C]">({bmi.category})</span>
          </span>
        </div>
      )}

      <button
        onClick={() => setShowConfirm(true)}
        disabled={isSaving}
        className="w-full h-12 rounded-xl bg-[#4B57F2] hover:bg-[#3945DC] text-white font-bold text-sm transition-colors cursor-pointer"
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

/* ==========================================
   FORM 2: TRAINING GOALS (Tách riêng)
   ========================================== */
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
  const [goals, setGoals] = useState<string[]>(profile.healthMetrics.goals || []);
  const [muscles, setMuscles] = useState<string[]>(
    profile.healthMetrics.preferredMuscleGroups || [],
  );
  const [showConfirm, setShowConfirm] = useState(false);

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
    const updatedPayload = {
      user: { ...profile.user, experienceLevel: experience },
      healthMetrics: { ...profile.healthMetrics, goals, preferredMuscleGroups: muscles },
    };

    await updateProfileServerAction(updatedPayload);
    onSave(updatedPayload);
    setShowConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6 pr-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Target className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#101214] font-display">Training Goals</h2>
          <p className="text-xs text-[#50565C]">
            Customize your focus, target muscles & experience level
          </p>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {/* Experience Level (Gọn gàng 1 dòng không bị tràn/bẻ chữ) */}
        <div>
          <label className="block text-xs font-semibold text-[#50565C] mb-2.5">
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
                  className="py-3 px-2 rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer min-h-[44px]"
                  style={{
                    border: "1.5px solid",
                    borderColor: isSelected ? "#4B57F2" : "#E5E7EB",
                    backgroundColor: isSelected ? "#F4F5FF" : "#FFFFFF",
                    color: isSelected ? "#4B57F2" : "#101214",
                  }}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Goals */}
        <div>
          <label className="block text-xs font-semibold text-[#50565C] mb-2.5">
            Primary Goals (Select at least 1)
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: "Build Muscle", desc: "Hypertrophy & muscle growth" },
              { id: "Lose Fat", desc: "Calorie burn & lean physique" },
            ].map((item) => (
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

        {/* Preferred Muscle Groups */}
        <div>
          <label className="block text-xs font-semibold text-[#50565C] mb-2.5">
            Preferred Muscle Groups (Optional)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"].map((mg) => {
              const isSelected = muscles.includes(mg);
              return (
                <button
                  key={mg}
                  type="button"
                  onClick={() => toggleMuscle(mg)}
                  className="flex items-center justify-center p-3 rounded-xl text-center transition-colors cursor-pointer min-h-[48px]"
                  style={{
                    border: "1.5px solid",
                    borderColor: isSelected ? "#4B57F2" : "#E5E7EB",
                    backgroundColor: isSelected ? "#F4F5FF" : "#FFFFFF",
                  }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: isSelected ? "#4B57F2" : "#101214" }}
                  >
                    {mg}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowConfirm(true)}
        className="w-full h-12 rounded-xl bg-[#4B57F2] hover:bg-[#3945DC] text-white font-bold text-sm transition-colors cursor-pointer"
      >
        Save Goal Plan
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

/* ==========================================
   FORM 3: AVAILABLE EQUIPMENT (Tách riêng)
   ========================================== */
function EquipmentForm({
  profile,
  onSave,
  onClose,
}: {
  profile: ProfileViewModel;
  onSave: (updated: Partial<ProfileViewModel>) => void;
  onClose: () => void;
}) {
  const [equipment, setEquipment] = useState<string[]>(profile.settings.availableEquipment || []);
  const [showConfirm, setShowConfirm] = useState(false);

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
    const updatedPayload = {
      settings: { ...profile.settings, availableEquipment: equipment },
    };

    await updateProfileServerAction(updatedPayload);
    onSave(updatedPayload);
    setShowConfirm(false);
    onClose();
  };

  const equipmentList = [
    { id: "Full Gym", desc: "Barbells, dumbbells, cable machines & racks" },
    { id: "Dumbbells", desc: "Adjustable or fixed dumbbells" },
    { id: "Barbell", desc: "Standard barbell & weight plates" },
    { id: "Bodyweight", desc: "No equipment required (Calisthenics)" },
    { id: "Resistance Band", desc: "Elastic resistance bands" },
  ];

  return (
    <>
      <div className="flex items-center gap-3 mb-6 pr-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#101214] font-display">Available Equipment</h2>
          <p className="text-xs text-[#50565C]">Select what gear you have access to for workouts</p>
        </div>
      </div>

      <div className="space-y-2.5 mb-8">
        {equipmentList.map((item) => (
          <SelectableTile
            key={item.id}
            label={item.id}
            description={item.desc}
            selected={equipment.includes(item.id)}
            onClick={() => toggleEquipment(item.id)}
          />
        ))}
      </div>

      <button
        onClick={() => setShowConfirm(true)}
        className="w-full h-12 rounded-xl bg-[#4B57F2] hover:bg-[#3945DC] text-white font-bold text-sm transition-colors cursor-pointer"
      >
        Save Equipment
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

/* ==========================================
   FORM 4: PERSONAL INFO
   ========================================== */
function PersonalInfoForm({
  profile,
  onSave,
  onClose,
}: {
  profile: ProfileViewModel;
  onSave: (updated: Partial<ProfileViewModel>) => void;
  onClose: () => void;
}) {
  const [dob, setDob] = useState(profile.user.dateOfBirth || "");
  const [gender, setGender] = useState(profile.user.gender === "Male" ? "Male" : "Female");
  const [times, setTimes] = useState<string[]>(profile.settings.preferredWorkoutTimes || []);
  const [coachStyle, setCoachStyle] = useState(profile.settings.coachStyle || "Motivational");

  const toggleTime = (t: string) => {
    if (times.includes(t)) {
      setTimes(times.filter((x) => x !== t));
    } else {
      setTimes([...times, t]);
    }
  };

  const handleSave = async () => {
    const updatedPayload = {
      user: { ...profile.user, dateOfBirth: dob, gender },
      settings: { ...profile.settings, preferredWorkoutTimes: times, coachStyle },
    };

    await updateProfileServerAction(updatedPayload);
    onSave(updatedPayload);
    onClose();
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6 pr-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#101214] font-display">Personal Info</h2>
          <p className="text-xs text-[#50565C]">Manage profile details & coach preferences</p>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#50565C]">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full h-11 px-3.5 text-sm rounded-xl border border-neutral-200 outline-none focus:border-[#4B57F2] bg-neutral-50/30 font-body"
            />
          </div>
          {/* Gender: Nam hoặc Nữ (Male / Female 2 segmented buttons) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#50565C]">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {["Male", "Female"].map((g) => {
                const isSelected = gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className="h-11 px-3 rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer"
                    style={{
                      border: "1.5px solid",
                      borderColor: isSelected ? "#4B57F2" : "#E5E7EB",
                      backgroundColor: isSelected ? "#F4F5FF" : "#FFFFFF",
                      color: isSelected ? "#4B57F2" : "#101214",
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#50565C] mb-2.5">
            Preferred Workout Schedule
          </label>
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/40 space-y-3">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
              {[
                { key: "Mon", label: "Mon" },
                { key: "Tue", label: "Tue" },
                { key: "Wed", label: "Wed" },
                { key: "Thu", label: "Thu" },
                { key: "Fri", label: "Fri" },
                { key: "Sat", label: "Sat" },
                { key: "Sun", label: "Sun" },
              ].map((day) => {
                const amKey = `${day.key} AM`;
                const pmKey = `${day.key} PM`;
                const isAm = times.includes(amKey);
                const isPm = times.includes(pmKey);

                return (
                  <div key={day.key} className="flex flex-col items-center space-y-2">
                    <span className="text-xs font-bold text-[#101214]">{day.label}</span>
                    <button
                      type="button"
                      onClick={() => toggleTime(amKey)}
                      className="w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      style={{
                        border: "1.5px solid",
                        borderColor: isAm ? "#4B57F2" : "#D1D5DB",
                        backgroundColor: isAm ? "#4B57F2" : "#FFFFFF",
                        color: isAm ? "#FFFFFF" : "#50565C",
                      }}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTime(pmKey)}
                      className="w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      style={{
                        border: "1.5px solid",
                        borderColor: isPm ? "#4B57F2" : "#D1D5DB",
                        backgroundColor: isPm ? "#4B57F2" : "#FFFFFF",
                        color: isPm ? "#FFFFFF" : "#50565C",
                      }}
                    >
                      PM
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-[#50565C] text-center pt-2 border-t border-neutral-200">
              Select morning (AM) or evening (PM) workout windows
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#50565C] mb-2.5">
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
        className="w-full h-12 rounded-xl bg-[#4B57F2] hover:bg-[#3945DC] text-white font-bold text-sm transition-colors cursor-pointer"
      >
        Save Personal Info
      </button>
    </>
  );
}

/* ==========================================
   FORM 5: INJURY MANAGEMENT (Clean Custom Dropdowns)
   ========================================== */
function InjuryHistoryForm({
  profile,
  onSave,
}: {
  profile: ProfileViewModel;
  onSave: (updated: Partial<ProfileViewModel>) => void;
}) {
  const [injuries, setInjuries] = useState<InjuryItem[]>(profile.injuries || []);
  const [showReport, setShowReport] = useState(false);
  const [newInjury, setNewInjury] = useState({
    muscleGroup: "Shoulders",
    severity: "Mild",
    notes: "",
  });
  const [confirmRecoverId, setConfirmRecoverId] = useState<string | null>(null);

  const handleSubmitInjury = async () => {
    if (!newInjury.notes) {
      return;
    }

    const res = await reportInjuryServerAction({
      muscleGroup: newInjury.muscleGroup,
      severity: newInjury.severity,
      notes: newInjury.notes,
    });

    const item: InjuryItem = {
      id: res.injuryId || Date.now().toString(),
      muscleGroup: newInjury.muscleGroup,
      severity: newInjury.severity,
      notes: newInjury.notes,
      isRecovered: false,
      reportedAt: new Date().toISOString().split("T")[0],
    };
    const updated = [...injuries, item];
    setInjuries(updated);
    onSave({ injuries: updated });
    setShowReport(false);
    setNewInjury({ muscleGroup: "Shoulders", severity: "Mild", notes: "" });
  };

  const handleRecover = async () => {
    if (!confirmRecoverId) {
      return;
    }

    await recoverInjuryServerAction(confirmRecoverId);

    const updated = injuries.map((i) =>
      i.id === confirmRecoverId ? { ...i, isRecovered: true } : i,
    );
    setInjuries(updated);
    onSave({ injuries: updated });
    setConfirmRecoverId(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 pr-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#101214] font-display">Injury Management</h2>
            <p className="text-xs text-[#50565C]">Track pain areas so AI Coach protects you</p>
          </div>
        </div>
        {!showReport && (
          <button
            onClick={() => setShowReport(true)}
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
          >
            + Report Injury
          </button>
        )}
      </div>

      {showReport && (
        <div className="p-4 rounded-xl mb-6 border border-neutral-200 bg-neutral-50/50 space-y-4">
          <h3 className="text-xs font-bold text-[#101214]">Report New Injury</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#50565C]">Muscle Group</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {["Shoulders", "Knee", "Lower Back", "Wrist", "Hip"].map((m) => {
                  const isSelected = newInjury.muscleGroup === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewInjury({ ...newInjury, muscleGroup: m })}
                      className="py-2 px-1 text-center rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[38px]"
                      style={{
                        border: "1.5px solid",
                        borderColor: isSelected ? "#4B57F2" : "#E5E7EB",
                        backgroundColor: isSelected ? "#F4F5FF" : "#FFFFFF",
                        color: isSelected ? "#4B57F2" : "#101214",
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#50565C]">Severity</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Mild", label: "Mild" },
                  { id: "Moderate", label: "Moderate" },
                  { id: "Severe", label: "Severe" },
                ].map((s) => {
                  const isSelected = newInjury.severity === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNewInjury({ ...newInjury, severity: s.id })}
                      className="py-2 px-2 text-center rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[38px]"
                      style={{
                        border: "1.5px solid",
                        borderColor: isSelected ? "#E11D48" : "#E5E7EB",
                        backgroundColor: isSelected ? "#FFE4E6" : "#FFFFFF",
                        color: isSelected ? "#9F1239" : "#101214",
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#50565C]">Notes</label>
              <input
                value={newInjury.notes}
                onChange={(e) => setNewInjury({ ...newInjury, notes: e.target.value })}
                placeholder="e.g. Pain during overhead press..."
                className="w-full h-11 px-3.5 text-xs rounded-xl border border-neutral-200 bg-white font-body outline-none focus:border-[#4B57F2]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowReport(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#50565C] hover:bg-neutral-200/60 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitInjury}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {injuries.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <Shield className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-medium text-emerald-800">
              All clear! No active injuries reported.
            </span>
          </div>
        ) : (
          injuries.map((injury) => (
            <div
              key={injury.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                injury.isRecovered
                  ? "bg-neutral-50/60 border-neutral-200 opacity-60"
                  : "bg-rose-50/40 border-rose-100"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-sm font-bold ${
                      injury.isRecovered ? "text-neutral-500 line-through" : "text-rose-900"
                    }`}
                  >
                    {injury.muscleGroup}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      injury.isRecovered
                        ? "bg-neutral-200 text-neutral-600"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {injury.severity}
                  </span>
                </div>
                <p
                  className={`text-xs ${
                    injury.isRecovered ? "text-neutral-400 line-through" : "text-rose-700"
                  }`}
                >
                  {injury.notes}
                </p>
              </div>

              {!injury.isRecovered && (
                <button
                  onClick={() => setConfirmRecoverId(injury.id)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0 cursor-pointer"
                >
                  Mark as Recovered
                </button>
              )}
            </div>
          ))
        )}
      </div>

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

/* ==========================================
   FORM 6: FEEDBACK FORM
   ========================================== */
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#101214] font-display">Send Feedback</h2>
          <p className="text-xs text-[#50565C]">Help the FITAI team improve your experience</p>
        </div>
      </div>

      {sent ? (
        <div className="p-8 text-center space-y-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-[#101214]">Thank You!</h3>
          <p className="text-xs text-[#50565C]">Your feedback has been submitted to the team.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share your thoughts, suggestions, or issues..."
            className="w-full p-3.5 border border-neutral-200 rounded-xl min-h-[120px] outline-none text-xs focus:border-[#4B57F2] font-body bg-neutral-50/30"
          />
          <button
            onClick={handleSubmit}
            className="w-full h-12 rounded-xl bg-[#4B57F2] hover:bg-[#3945DC] text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Submit Feedback
          </button>
        </div>
      )}
    </>
  );
}
