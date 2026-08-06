"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  onboardingDefaults,
  onboardingSchema,
  type OnboardingValues,
} from "@/features/onboarding/domain/onboarding-schema";
import { saveOnboardingProfileServerAction } from "@/features/onboarding/server/onboarding-actions";
import { Button } from "@/shared/ui/button";

const storageKey = "fitai-onboarding-draft-v1";

const steps = [
  { title: "Choose your primary goal", fields: ["goal"] },
  { title: "Set your baseline & targets", fields: ["heightCm", "weightKg", "targetWeightKg", "gender", "experienceLevel"] },
  { title: "Shape your week", fields: ["availableDays", "preferredTime"] },
  { title: "Choose your training setup", fields: ["equipment", "muscleFocus"] },
  { title: "Add safety constraints", fields: ["injuryStatus"] },
  { title: "Review & Choose coach style", fields: ["coachStyle"] },
] as const;

const goalOptions = [
  ["build-muscle", "Build Muscle", "Focus on hypertrophy, muscle growth, and progressive overload."],
  ["fat-loss", "Lose Fat", "Focus on calorie burn, high density, and lean body composition."],
] as const;

const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const equipmentOptions = ["Full Gym", "Dumbbells", "Barbell", "Bodyweight", "Resistance bands"];
const muscleOptions = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"];

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

/* Custom Dropdown UI for Onboarding */
function CustomOnboardingDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative w-full font-body">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3.5 flex items-center justify-between text-xs font-semibold rounded-xl bg-white border border-neutral-300 transition-colors cursor-pointer"
        style={{ borderColor: isOpen ? "#4B57F2" : "#D1D5DB" }}
      >
        <span>{selectedOption ? selectedOption.label : "Select..."}</span>
        <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${isOpen ? "rotate-180 text-[#4B57F2]" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-48 overflow-y-auto rounded-xl bg-white border border-neutral-200 shadow-xl py-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs text-left font-medium flex items-center justify-between transition-colors cursor-pointer hover:bg-blue-50/60"
                  style={{ color: isSelected ? "#4B57F2" : "#101214", fontWeight: isSelected ? 600 : 500 }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#4B57F2]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    mode: "onBlur",
    resolver: zodResolver(onboardingSchema),
  });

  const values = watch();

  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const parsed = onboardingSchema.partial().safeParse(JSON.parse(stored));
      if (parsed.success) reset({ ...onboardingDefaults, ...parsed.data });
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [reset]);

  useEffect(() => {
    const subscription = watch((draft) => {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  function toggleList(field: "availableDays" | "equipment" | "muscleFocus", item: string) {
    const current = getValues(field);
    const next = current.includes(item)
      ? current.filter((value) => value !== item)
      : [...current, item];
    setValue(field, next, { shouldDirty: true, shouldValidate: true });
  }

  async function continueFlow() {
    const currentFields = steps[step].fields;
    const valid = await trigger([...currentFields]);
    if (!valid) return;

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      window.scrollTo({ behavior: "smooth", top: 0 });
      return;
    }

    setIsSubmitting(true);
    try {
      await saveOnboardingProfileServerAction(values);
      sessionStorage.setItem("fitai-onboarding-complete", "true");
      router.push("/planning", { transitionTypes: ["nav-forward"] });
    } catch (err) {
      console.error("Failed to submit onboarding via gRPC:", err);
      sessionStorage.setItem("fitai-onboarding-complete", "true");
      router.push("/planning", { transitionTypes: ["nav-forward"] });
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
        {step === 0 ? (
          <section aria-labelledby="goal-heading">
            <h1 id="goal-heading">What is your primary focus?</h1>
            <p>Choose your target. You can adjust your training parameters later.</p>
            <div className="choice-grid">
              {goalOptions.map(([value, label, description]) => (
                <ChoiceButton
                  active={values.goal === value}
                  key={value}
                  onClick={() => setValue("goal", value as OnboardingValues["goal"], { shouldValidate: true })}
                >
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </ChoiceButton>
              ))}
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section aria-labelledby="baseline-heading">
            <h1 id="baseline-heading">Set your baseline & targets.</h1>
            <p>These measurements help the AI Coach calculate starting weights and progression.</p>
            <div className="field-grid">
              <label className="form-field">
                <span>Height</span>
                <span className="input-with-unit">
                  <input
                    inputMode="numeric"
                    type="number"
                    {...register("heightCm", { valueAsNumber: true })}
                  />
                  <span>cm</span>
                </span>
                {errors.heightCm ? <small role="alert">{errors.heightCm.message}</small> : null}
              </label>
              <label className="form-field">
                <span>Current Weight</span>
                <span className="input-with-unit">
                  <input
                    inputMode="decimal"
                    step="0.1"
                    type="number"
                    {...register("weightKg", { valueAsNumber: true })}
                  />
                  <span>kg</span>
                </span>
                {errors.weightKg ? <small role="alert">{errors.weightKg.message}</small> : null}
              </label>
              <label className="form-field">
                <span>Target Weight</span>
                <span className="input-with-unit">
                  <input
                    inputMode="decimal"
                    step="0.1"
                    type="number"
                    {...register("targetWeightKg", { valueAsNumber: true })}
                  />
                  <span>kg</span>
                </span>
                {errors.targetWeightKg ? <small role="alert">{errors.targetWeightKg.message}</small> : null}
              </label>
            </div>

            {/* Experience Level: Beginner, Intermediate, Advanced (Clean 1 line labels) */}
            <fieldset className="form-fieldset mt-4">
              <legend>Experience Level</legend>
              <div className="segmented-options">
                {[
                  ["beginner", "Beginner"],
                  ["intermediate", "Intermediate"],
                  ["advanced", "Advanced"],
                ].map(([value, label]) => (
                  <ChoiceButton
                    active={values.experienceLevel === value}
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

            {/* Gender: Female, Male (Only 2 choices) */}
            <fieldset className="form-fieldset mt-4">
              <legend>Gender</legend>
              <div className="segmented-options">
                {[
                  ["female", "Female"],
                  ["male", "Male"],
                ].map(([value, label]) => (
                  <ChoiceButton
                    active={values.gender === value}
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

        {step === 2 ? (
          <section aria-labelledby="week-heading">
            <h1 id="week-heading">Shape a week you can keep.</h1>
            <p>Choose up to six realistic training days, not an idealized week.</p>
            <div className="day-picker">
              {dayOptions.map((day) => (
                <ChoiceButton
                  active={values.availableDays.includes(day)}
                  key={day}
                  onClick={() => toggleList("availableDays", day)}
                >
                  <span>{day}</span>
                </ChoiceButton>
              ))}
            </div>
            <label className="form-field form-field--time">
              <span>Preferred training time</span>
              <input type="time" {...register("preferredTime")} />
            </label>
          </section>
        ) : null}

        {step === 3 ? (
          <section aria-labelledby="setup-heading">
            <h1 id="setup-heading">Build around what you have.</h1>
            <p>The plan will only prescribe exercises that match your setup.</p>
            <fieldset className="form-fieldset">
              <legend>Available equipment</legend>
              <div className="chip-options">
                {equipmentOptions.map((item) => (
                  <ChoiceButton
                    active={values.equipment.includes(item)}
                    key={item}
                    onClick={() => toggleList("equipment", item)}
                  >
                    <span>{item}</span>
                  </ChoiceButton>
                ))}
              </div>
            </fieldset>
            <fieldset className="form-fieldset">
              <legend>Focus areas (Optional)</legend>
              <div className="chip-options">
                {muscleOptions.map((item) => (
                  <ChoiceButton
                    active={values.muscleFocus.includes(item)}
                    key={item}
                    onClick={() => toggleList("muscleFocus", item)}
                  >
                    <span>{item}</span>
                  </ChoiceButton>
                ))}
              </div>
            </fieldset>
          </section>
        ) : null}

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
                ["active", "Report pain or injury", "Specify muscle area so AI Coach adjusts prescribed exercises."],
              ].map(([value, label, description]) => (
                <ChoiceButton
                  active={values.injuryStatus === value}
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

            {values.injuryStatus !== "none" && (
              <div className="mt-4 p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3 text-left">
                <label className="block text-xs font-semibold text-rose-900">
                  Target Injury Muscle Area
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {["Shoulders", "Knee", "Lower Back", "Wrist", "Hip"].map((m) => {
                    const isSelected = (values.injuryMuscleGroup || "Shoulders") === m;
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
                <label className="block text-xs font-semibold text-rose-900">Notes for AI Coach</label>
                <input
                  value={values.injuryNotes || ""}
                  onChange={(e) => setValue("injuryNotes", e.target.value)}
                  placeholder="e.g. Avoid heavy overhead presses..."
                  className="w-full h-10 px-3 text-xs rounded-xl border border-neutral-200 bg-white"
                />
              </div>
            )}
          </section>
        ) : null}

        {step === 5 ? (
          <section aria-labelledby="review-heading">
            <h1 id="review-heading">Choose your AI Coach tone.</h1>
            <p>This changes guidance tone, not the safety rules or training logic.</p>
            <div className="choice-grid">
              {[
                ["motivational", "Motivational", "Encouraging prompts with positive reinforcement."],
                ["strict", "Strict", "Concise, direct prompts focused on immediate action."],
                ["scientific", "Scientific", "Data-focused explanations with joint mechanics."],
              ].map(([value, label, description]) => (
                <ChoiceButton
                  active={values.coachStyle === value}
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
            <dl className="review-list">
              <div>
                <dt>Goal</dt>
                <dd>{values.goal === "build-muscle" ? "Build Muscle" : "Lose Fat"}</dd>
              </div>
              <div>
                <dt>Target Weight</dt>
                <dd>{values.targetWeightKg} kg</dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>{values.experienceLevel}</dd>
              </div>
              <div>
                <dt>Training days</dt>
                <dd>{values.availableDays.join(", ") || "Not set"}</dd>
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
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          size="icon"
          type="button"
          variant="secondary"
        >
          <ArrowLeft aria-hidden="true" size={19} />
        </Button>
        <Button onClick={continueFlow} disabled={isSubmitting} size="large" type="button">
          {step === steps.length - 1
            ? isSubmitting
              ? "Generating via gRPC..."
              : "Generate my plan"
            : "Continue"}
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
      </footer>
    </div>
  );
}
