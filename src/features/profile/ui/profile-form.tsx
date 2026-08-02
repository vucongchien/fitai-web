"use client";

import { AlertTriangle, Check, Clock3, Dumbbell, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";

export function ProfileForm() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [injuryReported, setInjuryReported] = useState(false);

  function saveChanges() {
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2800);
  }

  return (
    <div className="profile-form">
      {saved ? (
        <p aria-live="polite" className="save-confirmation">
          <Check aria-hidden="true" size={17} />
          Changes saved
        </p>
      ) : null}

      <section className="profile-section">
        <div className="profile-section__heading">
          <div>
            <h2>Training setup</h2>
            <p>Changes here can affect future sessions.</p>
          </div>
          <Button onClick={() => setEditing((current) => !current)} variant="quiet">
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>

        {editing ? (
          <div className="profile-edit-fields">
            <label className="form-field">
              <span>Preferred training time</span>
              <input defaultValue="18:30" type="time" />
            </label>
            <label className="form-field">
              <span>Available equipment</span>
              <input defaultValue="Dumbbells, bench, bodyweight" type="text" />
            </label>
            <div className="schedule-impact">
              <Clock3 aria-hidden="true" size={19} />
              <p>
                Saving availability or equipment changes will ask before regenerating your schedule.
              </p>
            </div>
            <Button onClick={saveChanges} size="large">
              Save changes
            </Button>
          </div>
        ) : (
          <dl className="profile-data-list">
            <div>
              <dt>
                <Clock3 aria-hidden="true" size={18} /> Preferred time
              </dt>
              <dd>18:30</dd>
            </div>
            <div>
              <dt>
                <Dumbbell aria-hidden="true" size={18} /> Equipment
              </dt>
              <dd>Dumbbells, bench, bodyweight</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="profile-section">
        <div className="profile-section__heading">
          <div>
            <h2>Coach style</h2>
            <p>Balanced instruction with measured encouragement.</p>
          </div>
        </div>
        <div className="profile-choice-row" role="group" aria-label="Coach style">
          <button type="button">Calm</button>
          <button aria-pressed="true" data-active="true" type="button">
            Balanced
          </button>
          <button type="button">Direct</button>
        </div>
      </section>

      <section className="profile-section profile-section--safety">
        <div className="profile-section__heading">
          <div>
            <h2>Safety and recovery</h2>
            <p>FITAI uses this to avoid or modify affected movement.</p>
          </div>
        </div>
        {injuryReported ? (
          <div className="injury-reported" role="status">
            <ShieldCheck aria-hidden="true" size={20} />
            <div>
              <strong>Injury reported</strong>
              <span>Future sessions will stay conservative until you mark recovery.</span>
            </div>
          </div>
        ) : (
          <div className="safety-status">
            <ShieldCheck aria-hidden="true" size={20} />
            <div>
              <strong>No active injury constraints</strong>
              <span>Your current roadmap can continue as planned.</span>
            </div>
          </div>
        )}
        <Button
          onClick={() => setInjuryReported((current) => !current)}
          variant={injuryReported ? "secondary" : "danger"}
        >
          {injuryReported ? (
            "Mark as recovered"
          ) : (
            <>
              <AlertTriangle aria-hidden="true" size={17} />
              Report injury
            </>
          )}
        </Button>
      </section>
    </div>
  );
}
