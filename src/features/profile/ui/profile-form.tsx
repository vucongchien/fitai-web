"use client";

import { Check, Clock3 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";

import { AvailabilityScheduler } from "./availability-scheduler";
import { EquipmentSelector } from "./equipment-selector";
import { InjuryConstraintsManager } from "./injury-constraints-manager";

export function ProfileForm() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Training Setup State
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Wed", "Fri", "Sat"]);
  const [sessionDurationMin, setSessionDurationMin] = useState<number>(45);
  const [preferredTime, setPreferredTime] = useState<string>("18:30");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    "Dumbbells",
    "Bench",
    "Bodyweight",
  ]);

  // Safety & Injury State
  const [injuryReported, setInjuryReported] = useState(false);
  const [injuryAreas, setInjuryAreas] = useState<string[]>([]);

  // Coach Style State
  const [coachStyle, setCoachStyle] = useState<"Calm" | "Balanced" | "Direct">("Balanced");

  // TODO (ConnectRPC Migration):
  // 1. Fetch initial profile on mount via ConnectRPC ProfileService.getProfile({ userId })
  //    (contracts/supporting/profile/v1/service/profile_service_pb.ts)
  //    - Maps availableEquipment -> selectedEquipment (string[])
  //    - Maps preferredWorkoutTimes -> selectedDays & preferredTime (string[])
  //    - Maps coachStyle -> coachStyle ("Calm" | "Balanced" | "Direct")
  //    - Maps injuries -> injuryAreas & injuryReported (Injury[])
  // 2. Call ProfileService.updateProfile() on saveChanges():
  //    await client.updateProfile({ availableEquipment: selectedEquipment, preferredWorkoutTimes: selectedDays, coachStyle })
  // 3. Call ProfileService.reportInjury({ muscleGroup: area }) or ProfileService.recoverInjury({ injuryId }) when toggled.

  function saveChanges() {
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2800);
  }

  return (
    <div className="profile-form space-y-6">
      {saved ? (
        <p aria-live="polite" className="save-confirmation">
          <Check aria-hidden="true" size={17} />
          Changes saved successfully
        </p>
      ) : null}

      {/* 1. Training Setup & Availability Section */}
      <section className="profile-section space-y-4">
        <div className="profile-section__heading">
          <div>
            <h2>Training setup & Availability</h2>
            <p>Changes here customize your schedule and future workout sessions.</p>
          </div>
          <Button onClick={() => setEditing((current) => !current)} variant="quiet">
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>

        {editing ? (
          <div className="profile-edit-fields space-y-4">
            <AvailabilityScheduler
              onChangeDays={setSelectedDays}
              onChangeDuration={setSessionDurationMin}
              onChangePreferredTime={setPreferredTime}
              preferredTime={preferredTime}
              selectedDays={selectedDays}
              sessionDurationMin={sessionDurationMin}
            />

            <EquipmentSelector
              onChangeEquipment={setSelectedEquipment}
              selectedEquipment={selectedEquipment}
            />

            <div className="schedule-impact flex items-center gap-2 text-xs text-[var(--color-graphite,#50565C)] p-3 rounded-[10px] bg-[var(--color-soft-paper,#F7F8F6)] border border-[var(--color-mist,#ECEEF0)]">
              <Clock3 className="shrink-0 text-[var(--color-relay-blue,#4B57F2)]" size={18} />
              <p>
                Saving availability or equipment changes will ask before regenerating your 4-week
                roadmap.
              </p>
            </div>

            <Button onClick={saveChanges} size="large">
              Save changes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <AvailabilityScheduler
              disabled
              onChangeDays={setSelectedDays}
              onChangeDuration={setSessionDurationMin}
              onChangePreferredTime={setPreferredTime}
              preferredTime={preferredTime}
              selectedDays={selectedDays}
              sessionDurationMin={sessionDurationMin}
            />
            <EquipmentSelector
              disabled
              onChangeEquipment={setSelectedEquipment}
              selectedEquipment={selectedEquipment}
            />
          </div>
        )}
      </section>

      {/* 2. Coach Style Section */}
      <section className="profile-section">
        <div className="profile-section__heading">
          <div>
            <h2>Coach style</h2>
            <p>Balanced instruction with measured encouragement.</p>
          </div>
        </div>
        <div className="profile-choice-row" role="group" aria-label="Coach style">
          {(["Calm", "Balanced", "Direct"] as const).map((style) => (
            <button
              aria-pressed={coachStyle === style}
              data-active={coachStyle === style || undefined}
              key={style}
              onClick={() => setCoachStyle(style)}
              type="button"
            >
              {style}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Safety & Injury Constraints Section */}
      <section className="profile-section profile-section--safety">
        <InjuryConstraintsManager
          injuryAreas={injuryAreas}
          injuryReported={injuryReported}
          onChangeInjuryAreas={setInjuryAreas}
          onToggleInjuryReported={setInjuryReported}
        />
      </section>
    </div>
  );
}
