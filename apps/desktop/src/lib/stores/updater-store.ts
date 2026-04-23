import { create } from "zustand";
import { notify } from "@/lib/os/notifications";
import { checkForUpdates, runUpdate, type UpdateSummary } from "@/lib/updater";

type InstallPhase =
  | { kind: "idle" }
  | { kind: "downloading"; downloaded: number; total: number | null }
  | { kind: "installing" };

type UpdaterState = {
  summary: UpdateSummary | null;
  checking: boolean;
  installPhase: InstallPhase;
  lastError: string | null;
  lastCheckedAt: number | null;

  check(): Promise<void>;
  startInstall(): Promise<void>;
  clearError(): void;
};

export const useUpdaterStore = create<UpdaterState>((set, get) => ({
  summary: null,
  checking: false,
  installPhase: { kind: "idle" },
  lastError: null,
  lastCheckedAt: null,

  async check() {
    if (get().checking) return;
    const previous = get().summary;
    set({ checking: true, lastError: null });
    try {
      const summary = await checkForUpdates();
      set({ summary, lastCheckedAt: Date.now() });

      // First time we see a new available version (false → true on the
      // availability flag, or a newer version than the last one we
      // surfaced), nudge the user with a system notification. Without
      // this, an update landing while the user is working somewhere
      // else would only show up the next time they wandered into
      // Settings. Dedup on version so the 6-hourly tick doesn't re-fire
      // the banner for the same release.
      const justBecameAvailable =
        summary.available &&
        (!previous?.available || previous.version !== summary.version);
      if (justBecameAvailable) {
        void notify(
          "Focrel update available",
          `Version ${summary.version} is ready to install. Open Settings → Updates to install it.`,
        ).catch(() => {});
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[focrel] updater check failed:", err);
      set({ lastError: message });
    } finally {
      set({ checking: false });
    }
  },

  async startInstall() {
    const { summary, installPhase } = get();
    if (!summary?.available) return;
    if (installPhase.kind !== "idle") return;

    set({
      installPhase: { kind: "downloading", downloaded: 0, total: null },
      lastError: null,
    });
    try {
      await runUpdate((event) => {
        if (event.kind === "started") {
          set({
            installPhase: {
              kind: "downloading",
              downloaded: 0,
              total: event.contentLength,
            },
          });
        } else if (event.kind === "progress") {
          set({
            installPhase: {
              kind: "downloading",
              downloaded: event.downloaded,
              total: event.contentLength,
            },
          });
        } else if (event.kind === "finished") {
          set({ installPhase: { kind: "installing" } });
        }
      });
      // runUpdate calls `relaunch()` after install completes; control usually
      // never returns here. Leaving the state in "installing" is fine — the
      // new process starts fresh with the idle default.
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[focrel] updater install failed:", err);
      set({ lastError: message, installPhase: { kind: "idle" } });
    }
  },

  clearError() {
    set({ lastError: null });
  },
}));

// Background watcher — checks once on app init, then every 6 hours. Quietly
// populates the store; the Settings UI renders whatever it finds. Errors are
// swallowed (network failures shouldn't spam the user) but logged.
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export function initUpdaterBackgroundCheck(): void {
  void useUpdaterStore.getState().check();
  setInterval(() => {
    void useUpdaterStore.getState().check();
  }, SIX_HOURS_MS);
}
