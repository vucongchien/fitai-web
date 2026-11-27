"use client";

import { useId } from "react";

import {
  InjurySeverity,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import { cn } from "@/shared/lib/cn";
import {
  BODY_SIDE_OPTIONS,
  INJURY_SEVERITY_OPTIONS,
  JOINT_REGION_OPTIONS,
  MUSCLE_GROUP_OPTIONS,
} from "@/shared/lib/taxonomy";

import type { InjuryDraft } from "../model/injury";

const SEVERITY_HINT: Record<InjurySeverity, string> = {
  [InjurySeverity.UNSPECIFIED]: "",
  [InjurySeverity.MILD]: "Keep training, avoid high-impact work",
  [InjurySeverity.MODERATE]: "Skip moves that load this area",
  [InjurySeverity.SEVERE]: "Exclude every move touching this area",
};

const CHIP_CLASS =
  "py-2 px-2 text-center rounded-[var(--radius-input)] text-xs font-semibold transition-colors cursor-pointer min-h-[38px] border-[1.5px]";
const CHIP_ON = "border-[var(--color-danger)] bg-[var(--color-surface)] text-[var(--color-danger)]";
const CHIP_OFF =
  "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]";

interface InjuryFieldsProps {
  value: InjuryDraft;
  onChange: (next: InjuryDraft) => void;
  regionError?: string;
}

/** Region, optional muscle, side and severity picker for onboarding and profile. */
export function InjuryFields({ value, onChange, regionError }: InjuryFieldsProps) {
  const muscleId = useId();

  return (
    <div className="space-y-3 text-left">
      <fieldset>
        <legend className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
          Painful area *
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {JOINT_REGION_OPTIONS.map((option) => {
            const active = value.region === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...value, region: option.value })}
                className={cn(CHIP_CLASS, active ? CHIP_ON : CHIP_OFF)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {regionError ? (
          <p className="mt-1.5 text-xs font-semibold text-[var(--color-danger)]" role="alert">
            {regionError}
          </p>
        ) : null}
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label
            className="block text-xs font-semibold text-[var(--color-text-muted)]"
            htmlFor={muscleId}
          >
            Specific muscle (optional)
          </label>
          <select
            id={muscleId}
            value={value.muscle}
            onChange={(e) => onChange({ ...value, muscle: Number(e.target.value) as MuscleGroup })}
            className="w-full h-10 px-3 text-xs rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none focus:border-[var(--color-action)] cursor-pointer"
          >
            <option value={MuscleGroup.UNSPECIFIED}>Not sure</option>
            {MUSCLE_GROUP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="block text-xs font-semibold text-[var(--color-text-muted)]">
            Side
          </legend>
          <div className="grid grid-cols-3 gap-1.5">
            {BODY_SIDE_OPTIONS.map((option) => {
              const active = value.side === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ ...value, side: option.value })}
                  className={cn(CHIP_CLASS, active ? CHIP_ON : CHIP_OFF)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="block text-xs font-semibold text-[var(--color-text-muted)]">
          Severity
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {INJURY_SEVERITY_OPTIONS.map((option) => {
            const active = value.severity === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...value, severity: option.value })}
                className={cn(CHIP_CLASS, "text-left", active ? CHIP_ON : CHIP_OFF)}
              >
                <span className="block font-bold">{option.label}</span>
                <span className="block text-[10px] font-normal text-[var(--color-text-muted)]">
                  {SEVERITY_HINT[option.value]}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
