"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { playSyntheticCueTone } from "@/features/workout/domain/audio-cues";
import type { CoachCue, MusicTrack, Playlist } from "@/features/workout/model/live-session.types";

/**
 * Background music + spoken coaching cues for the session.
 *
 * ux-flow-spec §5.2: the playlist plays under everything, warm-up and cooldown
 * included, and can be changed at any moment.
 * FR-WL-03 / ux-flow-spec §5.3: while a cue plays the music ducks by 70%, then
 * comes back — the coach is never fighting the music.
 *
 * Every asset is best effort. A missing mp3 leaves the session running in silence
 * instead of throwing.
 */

/** Music drops to 30% of its level while the coach talks (a 70% reduction). */
const DUCK_FACTOR = 0.3;
const DUCK_FADE_MS = 120;

const VOLUME_STORAGE_KEY = "fitai-live-music-volume";
const PLAYLIST_STORAGE_KEY = "fitai-live-playlist";

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore
  }
}

export function useAudioCoach(playlists: Playlist[]) {
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [cueText, setCueText] = useState<string | null>(null);
  /** True once an asset failed — the UI can explain the silence. */
  const [audioUnavailable, setAudioUnavailable] = useState(false);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const cueRef = useRef<HTMLAudioElement | null>(null);
  const cueQueue = useRef<CoachCue[]>([]);
  const cuePlaying = useRef(false);
  const lastCueAt = useRef<Record<string, number>>({});
  const volumeRef = useRef(volume);

  const playlist = useMemo(
    () => playlists.find((entry) => entry.id === playlistId) ?? null,
    [playlistId, playlists],
  );
  const track: MusicTrack | null = playlist?.tracks[trackIndex] ?? null;

  // Restore the user's last choice so they are not re-picking every session.
  useEffect(() => {
    const storedVolume = Number(readStored(VOLUME_STORAGE_KEY));
    if (Number.isFinite(storedVolume) && storedVolume > 0 && storedVolume <= 1) {
      setVolume(storedVolume);
      volumeRef.current = storedVolume;
    }
    const storedPlaylist = readStored(PLAYLIST_STORAGE_KEY);
    if (storedPlaylist && playlists.some((entry) => entry.id === storedPlaylist)) {
      setPlaylistId(storedPlaylist);
    }
  }, [playlists]);

  useEffect(() => {
    volumeRef.current = volume;
    if (musicRef.current && !cuePlaying.current) {
      musicRef.current.volume = volume;
    }
  }, [volume]);

  const ensureMusicElement = useCallback((): HTMLAudioElement => {
    if (musicRef.current) {
      return musicRef.current;
    }
    const element = new Audio();
    element.preload = "auto";
    element.volume = volumeRef.current;
    element.addEventListener("error", () => setAudioUnavailable(true));
    musicRef.current = element;
    return element;
  }, []);

  /** Load and play the current track. Safe to call repeatedly. */
  const startTrack = useCallback(
    (nextTrack: MusicTrack | null) => {
      if (!nextTrack) {
        return;
      }
      const element = ensureMusicElement();
      const url = new URL(nextTrack.url, window.location.origin).toString();
      if (element.src !== url) {
        element.src = url;
      }
      element.volume = cuePlaying.current ? volumeRef.current * DUCK_FACTOR : volumeRef.current;
      void element.play().then(
        () => setIsPlaying(true),
        () => {
          // Autoplay blocked or file missing — stay quiet, never block the workout.
          setIsPlaying(false);
          setAudioUnavailable(true);
        },
      );
    },
    [ensureMusicElement],
  );

  const next = useCallback(() => {
    if (!playlist || playlist.tracks.length === 0) {
      return;
    }
    setTrackIndex((current) => (current + 1) % playlist.tracks.length);
  }, [playlist]);

  const previous = useCallback(() => {
    if (!playlist || playlist.tracks.length === 0) {
      return;
    }
    setTrackIndex((current) => (current - 1 + playlist.tracks.length) % playlist.tracks.length);
  }, [playlist]);

  // Advance the playlist when a track ends so music runs for the whole session.
  useEffect(() => {
    const element = musicRef.current;
    if (!element) {
      return;
    }
    const onEnded = () => next();
    element.addEventListener("ended", onEnded);
    return () => element.removeEventListener("ended", onEnded);
  }, [next]);

  // Follow track changes while playing.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    startTrack(track);
  }, [isPlaying, startTrack, track]);

  const play = useCallback(() => {
    if (!track) {
      return;
    }
    startTrack(track);
  }, [startTrack, track]);

  const pause = useCallback(() => {
    musicRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const selectPlaylist = useCallback(
    (id: string, options?: { autoplay?: boolean }) => {
      setPlaylistId(id);
      setTrackIndex(0);
      writeStored(PLAYLIST_STORAGE_KEY, id);
      if (options?.autoplay !== false) {
        const chosen = playlists.find((entry) => entry.id === id);
        startTrack(chosen?.tracks[0] ?? null);
      }
    },
    [playlists, startTrack],
  );

  const changeVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolume(clamped);
    writeStored(VOLUME_STORAGE_KEY, String(clamped));
  }, []);

  // --- coaching cues ------------------------------------------------------

  const duckMusic = useCallback((ducked: boolean) => {
    const element = musicRef.current;
    if (!element) {
      return;
    }
    const target = ducked ? volumeRef.current * DUCK_FACTOR : volumeRef.current;
    // Short ramp so the dip does not click.
    const steps = 4;
    const from = element.volume;
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      element.volume = from + ((target - from) * step) / steps;
      if (step >= steps) {
        window.clearInterval(timer);
      }
    }, DUCK_FADE_MS / steps);
  }, []);

  const drainCueQueue = useCallback(() => {
    if (cuePlaying.current) {
      return;
    }
    const cue = cueQueue.current.shift();
    if (!cue) {
      duckMusic(false);
      setCueText(null);
      return;
    }

    cuePlaying.current = true;
    setCueText(cue.text);
    duckMusic(true);

    const element = cueRef.current ?? new Audio();
    cueRef.current = element;
    element.src = new URL(cue.audioUrl, window.location.origin).toString();
    element.volume = 1;

    const finish = () => {
      element.onended = null;
      element.onerror = null;
      cuePlaying.current = false;
      window.setTimeout(() => drainCueQueue(), 200);
    };

    element.onended = finish;
    element.onerror = () => {
      setAudioUnavailable(true);
      playSyntheticCueTone(cue.severity === 2 ? "warning" : "good");
      finish();
    };
    void element.play().catch(() => {
      setAudioUnavailable(true);
      playSyntheticCueTone(cue.severity === 2 ? "warning" : "good");
      finish();
    });
  }, [duckMusic]);

  /**
   * Queue a cue. `cooldownSec` keeps the coach from repeating the same
   * correction every rep (DialogueEngineConfig.cooldowns).
   */
  const playCue = useCallback(
    (cue: CoachCue, cooldownSec = 0) => {
      const last = lastCueAt.current[cue.code] ?? 0;
      const now = Date.now();
      if (cooldownSec > 0 && now - last < cooldownSec * 1000) {
        return;
      }
      lastCueAt.current[cue.code] = now;

      // A severe correction jumps the queue — FR-CC-04 wants it inside 500ms.
      if (cue.severity === 2) {
        cueQueue.current.unshift(cue);
      } else {
        cueQueue.current.push(cue);
      }
      drainCueQueue();
    },
    [drainCueQueue],
  );

  const stopAll = useCallback(() => {
    cueQueue.current = [];
    cuePlaying.current = false;
    musicRef.current?.pause();
    cueRef.current?.pause();
    setIsPlaying(false);
    setCueText(null);
  }, []);

  useEffect(() => stopAll, [stopAll]);

  return {
    playlists,
    playlist,
    playlistId,
    track,
    isPlaying,
    volume,
    cueText,
    audioUnavailable,
    hasMusic: playlists.length > 0,
    selectPlaylist,
    play,
    pause,
    toggle,
    next,
    previous,
    changeVolume,
    playCue,
    stopAll,
  };
}

export type AudioCoach = ReturnType<typeof useAudioCoach>;
