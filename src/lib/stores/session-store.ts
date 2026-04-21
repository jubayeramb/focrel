import { create } from "zustand";
import { contextsRepo, sessionsRepo } from "@/lib/db";
import { wallpaper, audio, shortcuts, apps, snapshot } from "@/lib/os";
import { notify } from "@/lib/os/notifications";
import type { ReconcileReport } from "@/lib/os/snapshot";
import { newId } from "@/lib/utils/ulid";

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
      if (context.musicPath) {
        await audio.play(context.musicPath);
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

    const snap = await snapshot.loadSnapshot();

    if (snap) {
      if (snap.originalWallpapers.length > 0) {
        await wallpaper.setWallpaper(snap.originalWallpapers[0]);
      }

      await audio.stop();

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
