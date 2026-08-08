"use client";

import { AlertCircle, CheckCircle2, Play, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { speakText } from "@/features/workout/domain/audio-cues";
import type { LiveExercise } from "@/features/workout/model/live-session.types";

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

  const handleSpeech = useCallback(() => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }

    const textToRead = [
      `Bài tập ${exercise.name}.`,
      exercise.instructions ? `Hướng dẫn thực hiện: ${exercise.instructions}` : "",
      exercise.breathingCue ? `Hít thở: ${exercise.breathingCue}` : "",
      exercise.formCues.length > 0 ? `Lưu ý tư thế: ${exercise.formCues.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    setIsSpeaking(true);
    speakText(textToRead);
  }, [exercise, isSpeaking, stopSpeech]);

  // Tự động phát TTS đọc hướng dẫn khi sheet vừa mở
  useEffect(() => {
    handleSpeech();
    return () => {
      stopSpeech();
    };
  }, []);

  const handleClose = () => {
    stopSpeech();
    onClose();
  };

  return (
    <div aria-label={`How to do ${exercise.name}`} className="live-sheet" role="dialog">
      <div className="live-sheet__panel">
        <header className="live-sheet__header">
          <div>
            <p className="utility-label">How to do it</p>
            <h2>{exercise.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label={isSpeaking ? "Tắt giọng nói hướng dẫn" : "Đọc hướng dẫn bằng TTS"}
              className={`live-media__control ${isSpeaking ? "bg-primary text-primary-foreground" : ""}`}
              onClick={handleSpeech}
              title={isSpeaking ? "Tắt giọng nói hướng dẫn" : "Đọc hướng dẫn bằng TTS"}
              type="button"
            >
              {isSpeaking ? <VolumeX aria-hidden="true" size={18} /> : <Volume2 aria-hidden="true" size={18} />}
            </button>
            {onWatchVideo && exercise.videoUrl ? (
              <button
                aria-label="Xem video hướng dẫn"
                className="live-media__control"
                onClick={() => {
                  handleClose();
                  onWatchVideo();
                }}
                title="Xem video demo"
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
          {exercise.instructions ? <p className="detail-body">{exercise.instructions}</p> : null}

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
