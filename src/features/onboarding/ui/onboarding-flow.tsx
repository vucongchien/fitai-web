"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  onboardingDefaults,
  onboardingSchema,
  type OnboardingValues,
} from "@/features/onboarding/domain/onboarding-schema";
import { Button } from "@/shared/ui/button";

const storageKey = "fitai-onboarding-draft-v1";

const steps = [
  { title: "Choose your goal", fields: ["goal"] },
  { title: "Set your baseline", fields: ["heightCm", "weightKg", "gender"] },
  { title: "Shape your week", fields: ["availableDays", "preferredTime"] },
  { title: "Choose your training setup", fields: ["equipment", "muscleFocus"] },
  { title: "Add safety constraints", fields: ["injuryStatus"] },
  { title: "Review your inputs", fields: ["coachStyle"] },
] as const;

const goalOptions = [
  ["consistency", "Build consistency", "Create a routine you can keep."],
  ["strength", "Get stronger", "Progress load and control gradually."],
  ["movement", "Move better", "Build confidence through quality range."],
  ["fat-loss", "Support fat loss", "Train consistently alongside nutrition."],
] as const;

const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const equipmentOptions = ["Bodyweight", "Dumbbells", "Resistance bands", "Bench", "Cable machine"];
const muscleOptions = ["Full body", "Chest", "Back", "Shoulders", "Legs", "Core"];

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

    sessionStorage.setItem("fitai-onboarding-complete", "true");
    router.push("/planning", { transitionTypes: ["nav-forward"] });
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
            <h1 id="goal-heading">What should training make easier?</h1>
            <p>Choose the outcome that matters most now. You can change it later.</p>
            <div className="choice-grid">
              {goalOptions.map(([value, label, description]) => (
                <ChoiceButton
                  active={values.goal === value}
                  key={value}
                  onClick={() => setValue("goal", value, { shouldValidate: true })}
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
            <h1 id="baseline-heading">Set a useful baseline.</h1>
            <p>These measurements help the plan choose an appropriate starting point.</p>
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
                <span>Weight</span>
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
            </div>
            <fieldset className="form-fieldset">
              <legend>Gender</legend>
              <div className="segmented-options">
                {[
                  ["female", "Female"],
                  ["male", "Male"],
                  ["nonbinary", "Nonbinary"],
                  ["prefer-not", "Prefer not to say"],
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
              <legend>Focus areas</legend>
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
                ["none", "No current limitation", "Continue with the planned starting range."],
                ["managed", "A managed limitation", "Avoid or modify a known area."],
                ["active", "New pain or injury", "Pause challenging work and prioritize recovery."],
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
          </section>
        ) : null}

        {step === 5 ? (
          <section aria-labelledby="review-heading">
            <h1 id="review-heading">Choose how the coach speaks.</h1>
            <p>This changes guidance tone, not the safety rules or training logic.</p>
            <div className="choice-grid">
              {[
                ["calm", "Calm", "Short prompts with more reassurance."],
                ["balanced", "Balanced", "Clear instruction with measured encouragement."],
                ["direct", "Direct", "Concise prompts focused on the next action."],
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
                <dd>{values.goal.replace("-", " ")}</dd>
              </div>
              <div>
                <dt>Training days</dt>
                <dd>{values.availableDays.join(", ") || "Not set"}</dd>
              </div>
              <div>
                <dt>Equipment</dt>
                <dd>{values.equipment.join(", ") || "Not set"}</dd>
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
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          size="icon"
          type="button"
          variant="secondary"
        >
          <ArrowLeft aria-hidden="true" size={19} />
        </Button>
        <Button onClick={continueFlow} size="large" type="button">
          {step === steps.length - 1 ? "Generate my plan" : "Continue"}
          <ArrowRight aria-hidden="true" size={18} />
        </Button>
      </footer>
    </div>
  );
}
