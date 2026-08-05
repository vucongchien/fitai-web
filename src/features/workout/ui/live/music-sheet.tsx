"use client";

import { Check, Music, Pause, Play, SkipBack, SkipForward, Volume2, X } from "lucide-react";

import type { AudioCoach } from "@/features/workout/model/use-audio-coach";

/**
 * Playlist picker. Reachable before the session and at any point during it —
 * ux-flow-spec §5.2 ("bất kỳ lúc nào cũng có thể đổi bài").
 */
export function MusicSheet({ audio, onClose }: { audio: AudioCoach; onClose: () => void }) {
  return (
    <div className="live-sheet" role="dialog" aria-label="Session music">
      <div className="live-sheet__panel">
        <header className="live-sheet__header">
          <div>
            <p className="utility-label">Music</p>
            <h2>Plays under the whole session</h2>
          </div>
          <button aria-label="Close" className="workout-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={19} />
          </button>
        </header>

        <div className="live-sheet__body">
          <ul className="playlist-list">
            {audio.playlists.map((playlist) => {
              const active = playlist.id === audio.playlistId;
              return (
                <li key={playlist.id}>
                  <button
                    aria-pressed={active}
                    data-active={active || undefined}
                    onClick={() => audio.selectPlaylist(playlist.id)}
                    type="button"
                  >
                    <span className="playlist-list__mark" aria-hidden="true">
                      {active ? <Check size={16} /> : <Music size={16} />}
                    </span>
                    <span className="playlist-list__text">
                      <strong>{playlist.name}</strong>
                      <span>{playlist.mood}</span>
                    </span>
                    <span className="playlist-list__count">{playlist.tracks.length}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {audio.track ? (
            <section className="music-transport">
              <div className="music-transport__meta">
                <strong>{audio.track.title}</strong>
                <span>{audio.track.artist}</span>
              </div>
              <div className="music-transport__buttons">
                <button aria-label="Previous track" onClick={audio.previous} type="button">
                  <SkipBack aria-hidden="true" size={18} />
                </button>
                <button
                  aria-label={audio.isPlaying ? "Pause music" : "Play music"}
                  onClick={audio.toggle}
                  type="button"
                >
                  {audio.isPlaying ? (
                    <Pause aria-hidden="true" size={20} />
                  ) : (
                    <Play aria-hidden="true" size={20} />
                  )}
                </button>
                <button aria-label="Next track" onClick={audio.next} type="button">
                  <SkipForward aria-hidden="true" size={18} />
                </button>
              </div>
              <label className="music-transport__volume">
                <Volume2 aria-hidden="true" size={17} />
                <span className="sr-only">Music volume</span>
                <input
                  max={1}
                  min={0}
                  onChange={(event) => audio.changeVolume(Number(event.target.value))}
                  step={0.05}
                  type="range"
                  value={audio.volume}
                />
              </label>
            </section>
          ) : (
            <p className="detail-body detail-body--muted">
              Pick a playlist, or keep training in silence — it is entirely optional.
            </p>
          )}

          {audio.audioUnavailable ? (
            <p className="detail-body detail-body--muted">
              Some audio could not be played on this device. The session keeps running without it.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
