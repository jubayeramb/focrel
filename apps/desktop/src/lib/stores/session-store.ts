import { create } from "zustand";
import { contextsRepo, sessionsRepo } from "@/lib/db";
import type { Context } from "@/lib/db";
import { wallpaper, audio, shortcuts, apps, snapshot } from "@/lib/os";
import { notify } from "@/lib/os/notifications";
import type { ReconcileReport } from "@/lib/os/snapshot";
import { useMusicStore } from "@/lib/stores/music-store";
import { newId } from "@/lib/utils/ulid";

function resolvePlaylist(ctx: Context): string[] {
  let paths: string[] = [];
  if (ctx.musicPaths) {
    try {
      const parsed = JSON.parse(ctx.musicPaths) as unknown;
      if (Array.isArray(parsed)) paths = parsed.filter((p): p is string => typeof p === "string");
    } catch {
      paths = [];
    }
  }
  // Back-compat with the single-track musicPath that predates 0004.
  if (paths.length === 0 && ctx.musicPath) paths = [ctx.musicPath];
  return paths;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Playlist auto-advance watcher: polls rodio for sink-empty and re-queues
// the next round when loop is on. Runs only while multi-track playlists
// are active; single-track playback uses rodio's native repeat_infinite
// via the loop_forever flag on audio.play.
let playlistWatcher: ReturnType<typeof setInterval> | null = null;

function stopPlaylistWatcher(): void {
  if (playlistWatcher !== null) {
    clearInterval(playlistWatcher);
    playlistWatcher = null;
  }
}

function startPlaylistWatcher(paths: string[], shuffle: boolean, loop: boolean): void {
  stopPlaylistWatcher();
  if (!loop) return; // one-shot pass, nothing to re-queue
  if (paths.length < 2) return;

  playlistWatcher = setInterval(async () => {
    try {
      // If the user paused or stopped from the UI, the sink may be empty
      // but we must NOT re-queue — that would undo an intentional stop.
      // The watcher only re-queues when music is supposed to be playing
      // (the natural end-of-playlist case where the last track finished).
      if (!useMusicStore.getState().isPlaying) return;

      const empty = await audio.isEmpty();
      if (!empty) return;
      const next = shuffle ? shuffleInPlace([...paths]) : [...paths];
      await audio.play(next[0], false);
      for (const p of next.slice(1)) {
        await audio.queue(p);
      }
      // Keep the music store's notion of "what's playing" in sync with the
      // re-queued round so any future Pause/Resume operates on the right
      // first-track path.
      useMusicStore.getState().setPlaying(next[0], true);
    } catch (err) {
      console.warn("[focrel] playlist watcher error:", err);
    }
  }, 5000);
}

type SessionState =
  | { phase: "idle" }
  | { phase: "starting"; contextId: string }
  | { phase: "active"; sessionId: string; contextId: string; startedAt: number; plannedDurationMinutes: number; taskIds: string[] }
  | { phase: "ending"; sessionId: string }
  | { phase: "recovered"; report: ReconcileReport };

type StartParams = {
  contextId: string;
  plannedDurationMinutes: number;
  taskIds: string[];
};

type SessionStore = {
  state: SessionState;
  lastError: string | null;
  start(params: StartParams): Promise<void>;
  end(endReason: "completed" | "interrupted" | "abandoned", notes?: string): Promise<void>;
  dismissRecoveryToast(): void;
  clearError(): void;
  checkForRecoveryOnLaunch(): Promise<void>;
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  state: { phase: "idle" },
  lastError: null,

  async start({ contextId, plannedDurationMinutes, taskIds }) {
    // Starting a new session while one is active: end the current session
    // cleanly first so audio stops, its wallpaper is restored, its revert
    // shortcut runs, and its snapshot is cleared. Otherwise the new session
    // captures the old session's wallpaper as "original" and leaks audio.
    if (get().state.phase === "active") {
      try {
        await get().end("interrupted");
      } catch (e) {
        console.warn("[focrel] failed to end prior session before starting new:", e);
      }
    }

    set({ lastError: null, state: { phase: "starting", contextId } });

    const sessionId = newId();

    try {
      const context = await contextsRepo.get(contextId);
      if (!context) {
        throw new Error(`Context not found: ${contextId}`);
      }

      const originalWallpapers = await wallpaper.getAllWallpapers();

      const initialSnap: snapshot.Snapshot = {
        sessionId,
        contextId,
        startedAt: Date.now(),
        plannedDurationMinutes,
        taskIds,
        originalWallpapers,
        originalVolume: null,
        focusToggledByUs: Boolean(context.shortcutName),
        revertShortcutName: context.revertShortcutName ?? null,
        appsQuit: [],
      };
      await snapshot.saveSnapshot(initialSnap);

      const session = await sessionsRepo.start(contextId, plannedDurationMinutes, taskIds);

      let appsActuallyQuit: string[] = [];

      if (context.wallpaperPath) {
        await wallpaper.setWallpaper(context.wallpaperPath);
      }
      const playlist = resolvePlaylist(context);
      if (playlist.length > 0) {
        const order =
          context.musicShuffle === 1 ? shuffleInPlace([...playlist]) : [...playlist];
        // For a single-track playlist we can use rodio's built-in repeat
        // via loop_forever; for multi-track, queue everything serially and
        // let the watcher handle re-queueing on end when loop is on.
        if (order.length === 1) {
          await audio.play(order[0], context.musicLoop === 1);
        } else {
          await audio.play(order[0], false);
          for (const p of order.slice(1)) {
            await audio.queue(p);
          }
          startPlaylistWatcher(playlist, context.musicShuffle === 1, context.musicLoop === 1);
        }
        // Seed the shared music store so the session view and the tray read
        // the same isPlaying/sinkAlive/loop from the first frame.
        useMusicStore.getState().setPlaying(order[0], context.musicLoop === 1);
      }
      if (context.shortcutName) {
        await shortcuts.runShortcut(context.shortcutName);
      }

      let appsToQuit: string[] = [];
      try {
        appsToQuit = JSON.parse(context.appsToQuit) as string[];
      } catch {
        appsToQuit = [];
      }

      if (appsToQuit.length > 0) {
        appsActuallyQuit = await apps.quitApps(appsToQuit);
      }

      const finalSnap: snapshot.Snapshot = {
        ...initialSnap,
        sessionId: session.id,
        appsQuit: appsActuallyQuit,
      };
      await snapshot.saveSnapshot(finalSnap);

      set({
        state: {
          phase: "active",
          sessionId: session.id,
          contextId,
          startedAt: session.startedAt,
          plannedDurationMinutes,
          taskIds,
        },
      });

      void notify("Focus session started", context.name).catch(() => {});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[focrel] session.start failed:", err);
      set({ lastError: message });
      try {
        await get().end("abandoned");
      } catch (cleanupErr) {
        console.error("[focrel] cleanup after failed start also failed:", cleanupErr);
        set({ state: { phase: "idle" } });
      }
      throw err;
    }
  },

  clearError() {
    set({ lastError: null });
  },

  async end(endReason, notes) {
    const { state } = get();

    let sessionIdToEnd: string | null = null;

    if (state.phase === "active") {
      sessionIdToEnd = state.sessionId;
    } else if (state.phase === "ending") {
      sessionIdToEnd = state.sessionId;
    }

    if (sessionIdToEnd) {
      set({ state: { phase: "ending", sessionId: sessionIdToEnd } });
    }

    stopPlaylistWatcher();

    const snap = await snapshot.loadSnapshot();

    if (snap) {
      if (snap.originalWallpapers.length > 0) {
        await wallpaper.setWallpaper(snap.originalWallpapers[0]);
      }

      await audio.stop();
      useMusicStore.getState().clear();

      if (snap.focusToggledByUs && snap.revertShortcutName) {
        await shortcuts.runShortcut(snap.revertShortcutName);
      }
    }

    if (sessionIdToEnd) {
      await sessionsRepo.end(sessionIdToEnd, endReason, notes);
    }

    if (endReason === "completed" && snap?.contextId) {
      const ctx = await contextsRepo.get(snap.contextId);
      if (ctx) {
        const durationMs = snap.startedAt ? Date.now() - snap.startedAt : 0;
        const durationText = `${Math.round(durationMs / 60_000)}m`;
        void notify("Session complete", `${ctx.name} · ${durationText}`).catch(() => {});
      }
    }

    await snapshot.clearSnapshot();

    set({ state: { phase: "idle" } });
  },

  dismissRecoveryToast() {
    set({ state: { phase: "idle" } });
  },

  async checkForRecoveryOnLaunch() {
    const report = await snapshot.reconcileSnapshot();
    if (!report) return;
    if (report.kind === "resume") {
      set({
        state: {
          phase: "active",
          sessionId: report.sessionId,
          contextId: report.contextId,
          startedAt: report.startedAt,
          plannedDurationMinutes: report.plannedDurationMinutes,
          taskIds: report.taskIds,
        },
      });
      window.dispatchEvent(
        new CustomEvent("focrel:session-resumed", {
          detail: { contextId: report.contextId },
        }),
      );
    } else {
      set({ state: { phase: "recovered", report } });
    }
  },
}));

export const sessionStore = useSessionStore;
