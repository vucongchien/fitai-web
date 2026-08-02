"use client";

import { AlertTriangle, Check, Minus, Pause, Plus, WifiOff, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { exercises } from "@/shared/lib/demo-data";
import { BrandMark } from "@/shared/ui/brand-mark";
import { Button } from "@/shared/ui/button";
import { TripleLane } from "@/shared/ui/triple-lane";

const draftKey = "fitai-live-workout-draft-v1";
const rpeLabels: Record<number, string> = {
  4: "Easy and controlled",
  5: "Comfortable",
  6: "Working, with room",
  7: "Challenging, still clean",
  8: "Hard, two reps left",
};

export function LiveWorkout({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(8);
  const [rpe, setRpe] = useState(6);
  const [loggedSets, setLoggedSets] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [online, setOnline] = useState(true);
  const [injuryMode, setInjuryMode] = useState(false);
  const exercise = exercises[exerciseIndex];

  const totalSets = exercises.length * 3;
  const progress = Math.min(loggedSets / totalSets, 1);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      draftKey,
      JSON.stringify({ exerciseIndex, loggedSets, reps, rpe, sessionId, weight }),
    );
  }, [exerciseIndex, loggedSets, reps, rpe, sessionId, weight]);

  useEffect(() => {
    if (restSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRestSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restSeconds]);

  const restTime = useMemo(() => {
    const minutes = Math.floor(restSeconds / 60);
    const seconds = String(restSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [restSeconds]);

  function logSet() {
    if (!online) return;
    const nextLogged = loggedSets + 1;
    setLoggedSets(nextLogged);
    setRestSeconds(60);
    if (nextLogged % 3 === 0 && exerciseIndex < exercises.length - 1) {
      setExerciseIndex((current) => current + 1);
      setReps(8);
    }
  }

  function finishSession() {
    sessionStorage.removeItem(draftKey);
    router.push(`/workouts/live/${sessionId}/summary`, {
      transitionTypes: ["workout-complete"],
    });
  }

  if (injuryMode) {
    return (
      <main className="injury-stop">
        <div className="injury-stop__symbol">
          <AlertTriangle aria-hidden="true" size={28} />
        </div>
        <h1>Stop the session first.</h1>
        <p>
          Do not continue through new or sharp pain. Ending this workout will keep today out of your
          completed load and flag the next plan review.
        </p>
        <div className="injury-stop__actions">
          <Button onClick={finishSession} size="large" variant="danger">
            End and report injury
          </Button>
          <Button onClick={() => setInjuryMode(false)} size="large" variant="secondary">
            Return to session
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="live-workout">
      <header className="live-workout__header">
        <BrandMark />
        <span className="live-workout__phase">
          Exercise {exerciseIndex + 1} of {exercises.length}
        </span>
        <button
          aria-label="End session"
          className="workout-close"
          onClick={finishSession}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </header>

      {!online ? (
        <div className="network-notice" role="status">
          <WifiOff aria-hidden="true" size={18} />
          You’re offline. This set stays on screen and will not be submitted yet.
        </div>
      ) : null}

      <main className="live-workout__main">
        <div className="workout-progress" aria-label={`${loggedSets} of ${totalSets} sets logged`}>
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>

        <section className="exercise-stage">
          <TripleLane active={restSeconds > 0 ? "recover" : "move"} compact morph />
          <div className="exercise-stage__heading">
            <p className="utility-label">Set {(loggedSets % 3) + 1} of 3</p>
            <h1>{exercise.name}</h1>
            <p>{exercise.note}</p>
          </div>

          {restSeconds > 0 ? (
            <div aria-live="polite" className="rest-instrument">
              <span>Recovery</span>
              <strong className="data-value">{restTime}</strong>
              <Button onClick={() => setRestSeconds(0)} variant="secondary">
                <Pause aria-hidden="true" size={17} />
                End rest
              </Button>
            </div>
          ) : (
            <div className="set-composer">
              <div className="set-composer__control">
                <span>Reps</span>
                <div>
                  <button
                    aria-label="Decrease reps"
                    onClick={() => setReps((value) => Math.max(1, value - 1))}
                    type="button"
                  >
                    <Minus aria-hidden="true" size={20} />
                  </button>
                  <strong className="data-value">{reps}</strong>
                  <button
                    aria-label="Increase reps"
                    onClick={() => setReps((value) => value + 1)}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={20} />
                  </button>
                </div>
              </div>

              <div className="set-composer__control">
                <span>Weight</span>
                <div>
                  <button
                    aria-label="Decrease weight"
                    onClick={() => setWeight((value) => Math.max(0, value - 0.5))}
                    type="button"
                  >
                    <Minus aria-hidden="true" size={20} />
                  </button>
                  <strong className="data-value">{weight} kg</strong>
                  <button
                    aria-label="Increase weight"
                    onClick={() => setWeight((value) => value + 0.5)}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={20} />
                  </button>
                </div>
              </div>

              <fieldset className="rpe-picker">
                <legend>How hard was that set?</legend>
                <div>
                  {[4, 5, 6, 7, 8].map((value) => (
                    <button
                      aria-label={`RPE ${value}: ${rpeLabels[value]}`}
                      aria-pressed={rpe === value}
                      data-active={rpe === value || undefined}
                      key={value}
                      onClick={() => setRpe(value)}
                      type="button"
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <p>{rpeLabels[rpe]}</p>
              </fieldset>
            </div>
          )}
        </section>
      </main>

      <footer className="workout-actions">
        {restSeconds > 0 ? (
          <Button onClick={() => setRestSeconds(0)} size="large">
            Next set
          </Button>
        ) : (
          <Button disabled={!online} onClick={logSet} size="large">
            <Check aria-hidden="true" size={19} />
            Log set
          </Button>
        )}
        <button className="injury-link" onClick={() => setInjuryMode(true)} type="button">
          Report pain or injury
        </button>
      </footer>
    </div>
  );
}
