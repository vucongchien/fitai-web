"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { getCatalogMetadataServerAction } from '@/features/exercise/server/catalog-actions';
import type { CatalogEquipmentItem, CatalogMuscleItem } from '@/features/exercise/server/catalog-actions';
import {
  onboardingDefaults,
  onboardingSchema,
} from "@/features/onboarding/domain/onboarding-schema";
import type { OnboardingValues } from "@/features/onboarding/domain/onboarding-schema";
import { calculateWeeklyScheduleStats } from "@/features/onboarding/domain/workout-times-normalizer";
import { WorkoutSchedulePicker } from "@/features/onboarding/ui/components/workout-schedule-picker";
import { saveOnboardingProfileServerAction } from "@/features/onboarding/server/onboarding-actions";
import { calculateBMI } from "@/features/profile/model/profile.mapper";
import { Button } from "@/shared/ui/button";

const storageKey = "fitai-onboarding-draft-v2";

const steps = [
  { title: "Choose your primary goals", fields: ["goals"] },
  {
    title: "Set your baseline & targets",
    fields: [
      "heightCm",
      "weightKg",
      "targetWeightKg",
      "bodyFatPercent",
      "dateOfBirth",
      "gender",
      "experienceLevel",
    ],
  },
  { title: "Shape your week", fields: ["preferredWorkoutTimes"] },
  { title: "Choose your training setup", fields: ["equipment", "muscleFocus"] },
  { title: "Add safety constraints", fields: ["injuryStatus"] },
  { title: "Review & Choose coach style", fields: ["coachStyle"] },
] as const;

const goalOptions = [
  [
    "build-muscle",
    "Build Muscle",
    "Focus on hypertrophy, muscle growth, and progressive overload.",
  ],
  [
    "fat-loss",
    "Lose Fat",
    "Focus on calorie burn, metabolic density, and lean body composition.",
  ],
  [
    "strength",
    "Strength",
    "Focus on maximal power output, neuromuscular adaptation, and heavier compound lifts.",
  ],
  [
    "endurance",
    "Endurance",
    "Focus on stamina, cardiovascular longevity, and high-density work capacity.",
  ],
] as const;

function ChoiceButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className="choice-button"
      data-active={active || undefined}
      onClick={onClick}
      type="button"
    >
      {children}
      {active ? <Check aria-hidden="true" size={18} /> : null}
    </button>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catalogEquipments, setCatalogEquipments] = useState<CatalogEquipmentItem[]>([]);
  const [catalogMuscles, setCatalogMuscles] = useState<CatalogMuscleItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchCatalog() {
      try {
        const res = await getCatalogMetadataServerAction();
        if (mounted && res.success) {
          setCatalogEquipments(res.equipments);
          setCatalogMuscles(res.muscles);
        }
      } catch (error) {
        console.error("Failed to load catalog metadata in onboarding:", error);
      } finally {
        if (mounted) {setIsLoadingCatalog(false);}
      }
    }
    fetchCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  const {
    formState: { errors },
    getValues,
    register,
    reset,
    setValue,
    trigger,
    watch,
  } = useForm<OnboardingValues>({
    defaultValues: onboardingDefaults,
    mode: "onChange",
    resolver: zodResolver(onboardingSchema),
  });

  // Watch chỉ đúng các field cần thiết — tránh re-render toàn bộ component
  const [
    goals,
    heightCm,
    weightKg,
    targetWeightKg,
    bodyFatPercent,
    gender,
    experienceLevel,
    preferredWorkoutTimes,
    equipment,
    muscleFocus,
    injuryStatus,
    injuryMuscleGroup,
    injuryNotes,
    coachStyle,
    dateOfBirth,
  ] = watch([
    "goals",
    "heightCm",
    "weightKg",
    "targetWeightKg",
    "bodyFatPercent",
    "gender",
    "experienceLevel",
    "preferredWorkoutTimes",
    "equipment",
    "muscleFocus",
    "injuryStatus",
    "injuryMuscleGroup",
    "injuryNotes",
    "coachStyle",
    "dateOfBirth",
  ]);

  // Instant calculated BMI preview
  const bmiInfo = useMemo(() => {
    if (weightKg && heightCm) {
      return calculateBMI(Number(weightKg), Number(heightCm));
    }
    return null;
  }, [weightKg, heightCm]);

  // Load draft from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) {
      return;
    }

    try {
      const parsedRaw = JSON.parse(stored);
      // Migrate old single goal to goals array if present
      if (parsedRaw.goal && !parsedRaw.goals) {
        parsedRaw.goals = [parsedRaw.goal];
      }
      if (parsedRaw.availableDays && !parsedRaw.preferredWorkoutTimes) {
        const time = parsedRaw.preferredTime || "PM";
        parsedRaw.preferredWorkoutTimes = parsedRaw.availableDays.map((d: string) => `${d} ${time}`);
      }

      const parsed = onboardingSchema.partial().safeParse(parsedRaw);
      if (parsed.success) {
        reset({ ...onboardingDefaults, ...parsed.data });
      }
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [reset]);

  // Auto save draft to session storage (subscribe riêng để không ảnh hưởng render)
  useEffect(() => {
    const subscription = watch((draft) => {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle goals (multi-select: support 1 or multiple goals)
  const toggleGoal = (goalVal: "build-muscle" | "fat-loss") => {
    const current = getValues("goals") || [];
    const next = current.includes(goalVal)
      ? (current.length > 1
        ? current.filter((g) => g !== goalVal)
        : current)
      : [...current, goalVal];
    setValue("goals", next as [("build-muscle" | "fat-loss"), ...("build-muscle" | "fat-loss")[]], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  // Toggle equipment or muscle focus
  function toggleList(field: "equipment" | "muscleFocus", item: string) {
    const current = getValues(field);
    const next = current.includes(item as any)
      ? current.filter((value) => value !== item)
      : [...current, item];
    setValue(field, next as any, { shouldDirty: true, shouldValidate: true });
  }

  const goBack = useCallback(() => setStep((current) => Math.max(0, current - 1)), []);

  async function continueFlow() {
    const currentFields = steps[step].fields;
    const valid = await trigger(currentFields as any);
    if (!valid) {
      return;
    }

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      window.scrollTo({ behavior: "smooth", top: 0 });
      return;
    }

    // Bước cuối: validate toàn bộ form trước khi gửi
    const allFields = steps.flatMap((s) => s.fields);
    const allValid = await trigger(allFields as any);
    if (!allValid) {
      // Tìm step đầu tiên có lỗi và nhảy về đó
      const errorFields = Object.keys(errors);
      const firstErrorStepIndex = steps.findIndex((s) =>
        s.fields.some((f) => errorFields.includes(f)),
      );
      if (firstErrorStepIndex !== -1 && firstErrorStepIndex !== step) {
        setStep(firstErrorStepIndex);
        window.scrollTo({ behavior: "smooth", top: 0 });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Dùng getValues() để lấy snapshot đầy đủ tại thời điểm submit
      const result = await saveOnboardingProfileServerAction(getValues());
      if (!result.success) {
        console.error("[OnboardingFlow] Server returned error:", result.message);
      }
      sessionStorage.setItem("fitai-onboarding-complete", "true");
      router.push("/home", { transitionTypes: ["nav-forward"] });
    } catch (error) {
      console.error("Failed to submit onboarding via gRPC:", error);
      sessionStorage.setItem("fitai-onboarding-complete", "true");
      router.push("/home", { transitionTypes: ["nav-forward"] });
    } finally {
      setIsSubmitting(false);
    }
  }

  const errorMessage = Object.values(errors)[0]?.message;

  return (
    <div className="onboarding-flow">
      <header className="onboarding-progress">
        <div className="onboarding-progress__meta">
          <span>
            Step {step + 1} of {steps.length}
          </span>
          <strong>{steps[step].title}</strong>
        </div>
        <div
          aria-label={`${step + 1} of ${steps.length} steps complete`}
          className="onboarding-progress__rail"
        >
          <span style={{ transform: `scaleX(${(step + 1) / steps.length})` }} />
        </div>
      </header>

      <div className="onboarding-stage">
        {/* STEP 1: GOALS (Multi-select) */}
        {step === 0 ? (
          <section aria-labelledby="goal-heading">
            <h1 id="goal-heading">What are your primary goals?</h1>
            <p>Select one or both goals. Your AI coach will optimize training volume accordingly.</p>
            <div className="choice-grid">
              {goalOptions.map(([value, label, description]) => {
                const isSelected = (goals || []).includes(value as any);
                return (
                  <ChoiceButton
                    active={isSelected}
                    key={value}
                    onClick={() => toggleGoal(value as "build-muscle" | "fat-loss")}
                  >
                    <span>
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                  </ChoiceButton>
                );
              })}
            </div>
            {errors.goals ? (
              <p className="mt-3 text-xs font-semibold text-rose-600" role="alert">
                {errors.goals.message}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* STEP 2: BASELINE & TARGETS (DOB, BodyFat, Instant BMI) */}
        {step === 1 ? (
          <section aria-labelledby="baseline-heading">
            <h1 id="baseline-heading">Set your baseline & physical targets.</h1>
            <p>These biometric parameters tune starting resistance and calorie expenditure.</p>

            <div className="field-grid">
              {/* Height */}
              <label className="form-field">
                <span>Height</span>
                <span className="input-with-unit">
                  <input
                    inputMode="numeric"
                    type="number"
                    onInvalid={(e) => e.preventDefault()}
                    {...register("heightCm", { valueAsNumber: true })}
                  />
                  <span>cm</span>
                </span>
                {errors.heightCm ? <small role="alert">{errors.heightCm.message}</small> : null}
              </label>

              {/* Current Weight */}
              <label className="form-field">
                <span>Current Weight</span>
                <span className="input-with-unit">
                  <input
                    inputMode="decimal"
                    step="0.1"
                    type="number"
                    onInvalid={(e) => e.preventDefault()}
                    {...register("weightKg", { valueAsNumber: true })}
                  />
                  <span>kg</span>
                </span>
                {errors.weightKg ? <small role="alert">{errors.weightKg.message}</small> : null}
              </label>

              {/* Target Weight */}
              <label className="form-field">
                <span>Target Weight</span>
                <span className="input-with-unit">
                  <input
                    inputMode="decimal"
                    step="0.1"
                    type="number"
                    onInvalid={(e) => e.preventDefault()}
                    {...register("targetWeightKg", { valueAsNumber: true })}
                  />
                  <span>kg</span>
                </span>
                {errors.targetWeightKg ? (
                  <small role="alert">{errors.targetWeightKg.message}</small>
                ) : null}
              </label>

              {/* Body Fat (%) */}
              <label className="form-field">
                <span>Body Fat (%)</span>
                <span className="input-with-unit">
                  <input
                    inputMode="decimal"
                    step="0.1"
                    type="number"
                    placeholder="e.g. 18.5"
                    onInvalid={(e) => e.preventDefault()}
                    {...register("bodyFatPercent", { valueAsNumber: true })}
                  />
                  <span>%</span>
                </span>
                {errors.bodyFatPercent ? (
                  <small role="alert">{errors.bodyFatPercent.message}</small>
                ) : null}
              </label>

              {/* Date of Birth */}
              <label className="form-field sm:col-span-2">
                <span>Date of Birth (Ages 14-90)</span>
                <input
                  type="date"
                  className="w-full h-11 px-3.5 text-sm rounded-xl border border-neutral-200 bg-white"
                  onInvalid={(e) => e.preventDefault()}
                  {...register("dateOfBirth")}
                />
                {errors.dateOfBirth ? (
                  <small role="alert">{errors.dateOfBirth.message}</small>
                ) : null}
              </label>
            </div>

            {/* Live BMI Calculation Badge */}
            {bmiInfo && (
              <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[#4B57F2]" />
                  <span className="text-xs font-semibold text-[#50565C]">
                    Calculated Body Mass Index (BMI)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono text-[#4B57F2]">
                    {bmiInfo.bmi}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-blue-200 text-[#4B57F2]">
                    {bmiInfo.category}
                  </span>
                </div>
              </div>
            )}

            {/* Experience Level */}
            <fieldset className="form-fieldset mt-4">
              <legend>Experience Level</legend>
              <div className="segmented-options">
                {[
                  ["beginner", "Beginner"],
                  ["intermediate", "Intermediate"],
                  ["advanced", "Advanced"],
                ].map(([value, label]) => (
                  <ChoiceButton
                    active={experienceLevel === value}
                    key={value}
                    onClick={() =>
                      setValue("experienceLevel", value as OnboardingValues["experienceLevel"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <span>{label}</span>
                  </ChoiceButton>
                ))}
              </div>
            </fieldset>

            {/* Gender */}
            <fieldset className="form-fieldset mt-4">
              <legend>Gender</legend>
              <div className="segmented-options">
                {[
                  ["female", "Female"],
                  ["male", "Male"],
                ].map(([value, label]) => (
                  <ChoiceButton
                    active={gender === value}
                    key={value}
                    onClick={() =>
                      setValue("gender", value as OnboardingValues["gender"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <span>{label}</span>
                  </ChoiceButton>
                ))}
              </div>
            </fieldset>
          </section>
        ) : null}

        {/* STEP 3: SHAPE YOUR WEEK (Workout Schedule Picker with Clean iOS Style) */}
        {step === 2 ? (
          <section aria-labelledby="week-heading" className="space-y-4">
            <div>
              <h1 id="week-heading">Shape your weekly schedule.</h1>
              <p>
                Select your workout hours. Unselected days remain rest days.
              </p>
            </div>

            <WorkoutSchedulePicker
              value={preferredWorkoutTimes}
              onChange={(map) =>
                setValue("preferredWorkoutTimes", map as any, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={errors.preferredWorkoutTimes?.message}
            />
          </section>
        ) : null}

        {/* STEP 4: TRAINING SETUP (Equipment & Muscle Focus) */}
        {step === 3 ? (
          <section aria-labelledby="setup-heading">
            <h1 id="setup-heading">Build around what you have.</h1>
            <p>The plan will only prescribe exercises matching your equipment setup.</p>
            
            {isLoadingCatalog ? (
              <div className="py-8 text-center text-xs font-semibold text-[#50565C] animate-pulse space-y-2">
                <div className="h-6 w-32 bg-neutral-200 rounded mx-auto" />
                <p>Loading real equipment & muscle catalog from server...</p>
              </div>
            ) : (
              <>
                <fieldset className="form-fieldset">
                  <legend>Available equipment</legend>
                  <div className="chip-options">
                    {catalogEquipments.map((eq) => (
                      <ChoiceButton
                        active={(equipment || []).includes(eq.name as any)}
                        key={eq.id}
                        onClick={() => toggleList("equipment", eq.name)}
                      >
                        <span>{eq.name}</span>
                      </ChoiceButton>
                    ))}
                  </div>
                  {errors.equipment ? (
                    <p className="mt-2 text-xs font-semibold text-rose-600" role="alert">
                      {errors.equipment.message}
                    </p>
                  ) : null}
                </fieldset>

                <fieldset className="form-fieldset mt-6">
                  <legend>Focus areas (Optional)</legend>
                  <div className="chip-options">
                    {catalogMuscles.map((m) => (
                      <ChoiceButton
                        active={(muscleFocus || []).includes(m.name)}
                        key={m.id}
                        onClick={() => toggleList("muscleFocus", m.name)}
                      >
                        <span>{m.name}</span>
                      </ChoiceButton>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
          </section>
        ) : null}

        {/* STEP 5: SAFETY CONSTRAINTS */}
        {step === 4 ? (
          <section aria-labelledby="safety-heading">
            <span aria-hidden="true" className="safety-symbol">
              <ShieldAlert size={25} />
            </span>
            <h1 id="safety-heading">Is anything limiting movement now?</h1>
            <p>FITAI adjusts exercise choices. It does not diagnose or replace medical advice.</p>
            <div className="choice-grid">
              {[
                ["none", "No current limitation", "Continue with planned starting range."],
                [
                  "active",
                  "Report pain or injury",
                  "Specify muscle area so AI Coach adjusts prescribed exercises.",
                ],
              ].map(([value, label, description]) => (
                <ChoiceButton
                  active={injuryStatus === value}
                  key={value}
                  onClick={() =>
                    setValue("injuryStatus", value as OnboardingValues["injuryStatus"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </ChoiceButton>
              ))}
            </div>

            {injuryStatus !== "none" && (
              <div className="mt-4 p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3 text-left">
                <label className="block text-xs font-semibold text-rose-900">
                  Target Injury Muscle Area
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {["Shoulders", "Knee", "Lower Back", "Wrist", "Hip"].map((m) => {
                    const isSelected = (injuryMuscleGroup || "Shoulders") === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setValue("injuryMuscleGroup", m)}
                        className="py-2 px-1 text-center rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[38px]"
                        style={{
                          border: "1.5px solid",
                          borderColor: isSelected ? "#E11D48" : "#E5E7EB",
                          backgroundColor: isSelected ? "#FFE4E6" : "#FFFFFF",
                          color: isSelected ? "#9F1239" : "#101214",
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
                <label className="block text-xs font-semibold text-rose-900">
                  Notes for AI Coach
                </label>
                <input
                  value={injuryNotes || ""}
                  onChange={(e) => setValue("injuryNotes", e.target.value)}
                  placeholder="e.g. Avoid heavy overhead presses..."
                  className="w-full h-10 px-3 text-xs rounded-xl border border-neutral-200 bg-white"
                />
              </div>
            )}
          </section>
        ) : null}

        {/* STEP 6: COACH STYLE & REVIEW SUMMARY */}
        {step === 5 ? (
          <section aria-labelledby="review-heading">
            <h1 id="review-heading">Choose your AI Coach tone.</h1>
            <p>This changes guidance tone, not the safety rules or training logic.</p>
            <div className="choice-grid">
              {[
                [
                  "motivational",
                  "Motivational",
                  "Encouraging prompts with positive reinforcement.",
                ],
                ["strict", "Strict", "Concise, direct prompts focused on immediate action."],
                ["scientific", "Scientific", "Data-focused explanations with joint mechanics."],
              ].map(([value, label, description]) => (
                <ChoiceButton
                  active={coachStyle === value}
                  key={value}
                  onClick={() =>
                    setValue("coachStyle", value as OnboardingValues["coachStyle"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </ChoiceButton>
              ))}
            </div>

            <dl className="review-list mt-6">
              <div>
                <dt>Primary Goals</dt>
                <dd>
                  {(goals || [])
                    .map((g) => (g === "build-muscle" ? "Build Muscle" : "Lose Fat"))
                    .join(" & ") || "Build Muscle"}
                </dd>
              </div>
              <div>
                <dt>Date of Birth</dt>
                <dd>{dateOfBirth || "1998-05-15"}</dd>
              </div>
              <div>
                <dt>Body Fat / Target</dt>
                <dd>
                  {bodyFatPercent ?? 18.5}% (Target: {targetWeightKg} kg)
                </dd>
              </div>
              {bmiInfo && (
                <div>
                  <dt>BMI</dt>
                  <dd>
                    {bmiInfo.bmi} ({bmiInfo.category})
                  </dd>
                </div>
              )}
              <div>
                <dt>Experience</dt>
                <dd className="capitalize">{experienceLevel}</dd>
              </div>
              <div>
                <dt>Workout Schedule</dt>
                <dd>
                  {(() => {
                    const stats = calculateWeeklyScheduleStats(preferredWorkoutTimes as any);
                    if (stats.activeDaysCount === 0) {return "No schedule selected";}
                    return `${stats.activeDaysCount} days / week (${stats.totalSlotsCount} sessions) • ~${stats.avgDurationMinutes}m avg`;
                  })()}
                </dd>
              </div>
              <div>
                <dt>Equipment</dt>
                <dd>{(equipment || []).join(", ")}</dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="onboarding-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <footer className="onboarding-actions">
        <Button
          aria-label="Go to previous step"
          disabled={step === 0 || isSubmitting}
          onClick={goBack}
          size="icon"
          type="button"
          variant="secondary"
        >
          <ArrowLeft aria-hidden="true" size={19} />
        </Button>
        <Button onClick={continueFlow} disabled={isSubmitting} size="large" type="button">
          {step === steps.length - 1
            ? (isSubmitting
              ? "Generating via gRPC..."
              : "Generate my plan")
            : "Continue"}
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
      </footer>
    </div>
  );
}
