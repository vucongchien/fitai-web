"use client";

import { AlertCircle, CheckCircle2, Play, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";

function parseInstructions(text: string): string[] {
  if (!text) return [];

  // Match pattern: "1. Step text 2. Step text..." or line breaks "\n"
  const hasStepNumbers = /(?:\d+\.\s+)/.test(text);

  if (hasStepNumbers) {
    const parts = text.split(/(?=\d+\.\s+)/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      return parts.map((p) => p.replace(/^\d+\.\s*/, "").trim());
    }
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return lines;
  }

  return [text];
}

/**
 * "Read the guide" — instructions, form cues and common mistakes for the current
 * movement. Same content shape as the exercise detail page so the two never drift.
 */
export function InstructionsSheet({
  exercise,
  onClose,
  onWatchVideo,
}: {
  exercise: LiveExercise;
  onClose: () => void;
  onWatchVideo?: () => void;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const startSpeech = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const steps = parseInstructions(exercise.instructions || "");
    const formattedSteps = steps.length > 0 ? steps.map((s, idx) => `Step ${idx + 1}: ${s}`).join(". ") : "";

    const textToRead = [
      `Exercise ${exercise.name}.`,
      formattedSteps ? `Instructions: ${formattedSteps}` : "",
      exercise.breathingCue ? `Breathing: ${exercise.breathingCue}` : "",
      exercise.formCues.length > 0 ? `Form cues: ${exercise.formCues.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = "en-US";
      utterance.rate = 1.0;
      utterance.volume = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  }, [exercise]);

  const toggleSpeech = useCallback(() => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      startSpeech();
    }
  }, [isSpeaking, startSpeech, stopSpeech]);

  // Read voice instructions automatically when opening the sheet
  useEffect(() => {
    startSpeech();
    return () => {
      stopSpeech();
    };
  }, [startSpeech, stopSpeech]);

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    stopSpeech();
    setTimeout(() => {
      onClose();
    }, 220);
  };

  const steps = parseInstructions(exercise.instructions || "");

  return (
    <div
      aria-label={`How to do ${exercise.name}`}
      className={`live-sheet ${isClosing ? "live-sheet--closing" : ""}`}
      role="dialog"
      onClick={handleClose}
      style={{ cursor: "pointer" }}
    >
      <div className="live-sheet__panel" onClick={(e) => e.stopPropagation()} style={{ cursor: "default" }}>
        <header className="live-sheet__header">
          <div>
            <p className="utility-label">How to do it</p>
            <h2>{exercise.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label={isSpeaking ? "Mute audio (Playing)" : "Read instructions aloud"}
              className={`live-media__control ${isSpeaking ? "bg-red-500 text-white" : ""}`}
              onClick={toggleSpeech}
              title={isSpeaking ? "Mute audio (Playing)" : "Read instructions aloud"}
              type="button"
              style={
                isSpeaking
                  ? {
                      background: "var(--color-primary-600, #2563eb)",
                      color: "#ffffff",
                      boxShadow: "0 0 10px rgba(37, 99, 235, 0.5)",
                    }
                  : undefined
              }
            >
              {isSpeaking ? <VolumeX aria-hidden="true" size={18} /> : <Volume2 aria-hidden="true" size={18} />}
            </button>
            {onWatchVideo && exercise.videoUrl ? (
              <button
                aria-label="Watch tutorial video"
                className="live-media__control"
                onClick={() => {
                  handleClose();
                  onWatchVideo();
                }}
                title="Watch demo video"
                type="button"
              >
                <Play aria-hidden="true" size={18} />
              </button>
            ) : null}
            <button aria-label="Close" className="workout-close" onClick={handleClose} type="button">
              <X aria-hidden="true" size={19} />
            </button>
          </div>
        </header>

        <div className="live-sheet__body">
          {steps.length > 1 ? (
            <div className="detail-section">
              <h3>Execution Steps</h3>
              <ol
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: 0,
                  margin: "12px 0 20px 0",
                  listStyle: "none",
                }}
              >
                {steps.map((step, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: "flex",
                      gap: "14px",
                      alignItems: "flex-start",
                      background: "var(--color-bg-subtle, #f8fafc)",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      border: "1px solid var(--color-border, #e2e8f0)",
                    }}
                  >
                    <span
                      style={{
                        minWidth: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: "var(--color-primary-600, #2563eb)",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.5", color: "var(--color-text-main, #1e293b)", fontWeight: 500 }}>
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ) : exercise.instructions ? (
            <p className="detail-body">{exercise.instructions}</p>
          ) : null}

          {exercise.notes ? (
            <section className="detail-section">
              <h3>Coach note for today</h3>
              <p className="detail-body">{exercise.notes}</p>
            </section>
          ) : null}

          {exercise.breathingCue ? (
            <section className="detail-section">
              <h3>Breathing</h3>
              <p className="detail-body">{exercise.breathingCue}</p>
            </section>
          ) : null}

          {exercise.formCues.length > 0 ? (
            <section className="detail-section">
              <h3>Form cues</h3>
              <ul className="cue-list">
                {exercise.formCues.map((cue) => (
                  <li key={cue}>
                    <CheckCircle2 aria-hidden="true" size={16} />
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {exercise.commonMistakes.length > 0 ? (
            <section className="detail-section">
              <h3>Common mistakes</h3>
              <ul className="cue-list cue-list--warn">
                {exercise.commonMistakes.map((mistake) => (
                  <li key={mistake}>
                    <AlertCircle aria-hidden="true" size={16} />
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
