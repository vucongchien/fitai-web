"use client";

import { Music, Pause, Play, SkipForward } from "lucide-react";
import { memo } from "react";

import type { AudioCoach } from "@/features/workout/model/use-audio-coach";

export const MusicMiniControl = memo(function MusicMiniControl({
  audio,
  onOpenSheet,
}: {
  audio: AudioCoach;
  onOpenSheet: () => void;
}) {
  return (
    <div className="music-mini">
      <button className="music-mini__label" onClick={onOpenSheet} type="button">
        <Music aria-hidden="true" size={14} />
        <span>{audio.track ? audio.track.title : "Choose music"}</span>
      </button>
      {audio.track ? (
        <div className="music-mini__buttons">
          <button
            aria-label={audio.isPlaying ? "Pause music" : "Play music"}
            onClick={audio.toggle}
            type="button"
          >
            {audio.isPlaying ? (
              <Pause aria-hidden="true" size={13} />
            ) : (
              <Play aria-hidden="true" size={13} />
            )}
          </button>
          <button aria-label="Next track" onClick={audio.next} type="button">
            <SkipForward aria-hidden="true" size={13} />
          </button>
        </div>
      ) : null}
    </div>
  );
});
