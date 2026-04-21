import { create } from "zustand";
import { audio } from "@/lib/os";

/**
 * Single source of truth for session music playback state.
 *
 * Before this store, the session view and the tray each tracked `isPlaying`
 * locally → toggling from one surface left the other stale. Now every surface
 * (session view, tray bridge, mini mode) reads the same zustand store and
 * every mutation funnels through these actions, so the UI can't diverge from
 * the actual rodio sink state.
 *
 * `sinkAlive` is the play-vs-resume distinction: after `audio.stop` the Rust
 * sink is dropped and a subsequent play needs a fresh decode. After
 * `audio.pause` the sink is preserved and `audio.resume` continues from the
 * same position. The session-store also sets this when a session's music
 * starts, so the first UI toggle after start does a Pause (not a Stop).
 */

type MusicStore = {
  path: string | null;
  isPlaying: boolean;
  sinkAlive: boolean;
  loop: boolean;
  volume: number;

  /** Called by session-store when a session with music just started. */
  setPlaying(path: string, loop: boolean): void;

  /** Called by session-store on session end — clears state after audio.stop. */
  clear(): void;

  /** Smart play/pause/resume — picks the right Rust call based on sinkAlive. */
  toggle(): Promise<void>;

  /** Drop the sink entirely. Next toggle will do a fresh decode. */
  stop(): Promise<void>;

  /** Flip loop; if playing, restart with the new loop flag (rodio can't mutate a live sink). */
  setLoop(next: boolean): Promise<void>;

  setVolume(v: number): Promise<void>;
};

export const useMusicStore = create<MusicStore>((set, get) => ({
  path: null,
  isPlaying: false,
  sinkAlive: false,
  loop: true,
  volume: 0.6,

  setPlaying(path, loop) {
    set({ path, isPlaying: true, sinkAlive: true, loop });
  },

  clear() {
    set({ path: null, isPlaying: false, sinkAlive: false });
  },

  async toggle() {
    const { path, isPlaying, sinkAlive, loop } = get();
    if (path === null) return;
    if (isPlaying) {
      await audio.pause();
      set({ isPlaying: false });
    } else if (sinkAlive) {
      await audio.resume();
      set({ isPlaying: true });
    } else {
      await audio.play(path, loop);
      set({ isPlaying: true, sinkAlive: true });
    }
  },

  async stop() {
    await audio.stop();
    set({ isPlaying: false, sinkAlive: false });
  },

  async setLoop(next) {
    const { isPlaying, path } = get();
    set({ loop: next });
    // rodio bakes loop into the source at Play time; to apply mid-play we
    // have to restart the track with the new flag. Skip if paused so the
    // user isn't surprised by a mid-pause reset.
    if (isPlaying && path !== null) {
      await audio.play(path, next);
      set({ sinkAlive: true });
    }
  },

  async setVolume(v) {
    set({ volume: v });
    await audio.setVolume(v);
  },
}));

export const musicStore = useMusicStore;
