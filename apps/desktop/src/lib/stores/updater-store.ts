import { create } from "zustand";
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
    set({ checking: true, lastError: null });
    try {
      const summary = await checkForUpdates();
      set({ summary, lastCheckedAt: Date.now() });
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
