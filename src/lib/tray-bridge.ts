import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { audio } from "./os";
import { useContextStore } from "./stores/context-store";
import { useSessionStore } from "./stores/session-store";

type TrayContext = { id: string; name: string };

// Module-level music playback state that lives alongside the active session
// so the tray can reflect play/pause without the UI mounting a component.
let musicIsPlaying = false;
let musicCurrentPath: string | null = null;
let musicLoopForever = true;

function formatElapsed(startedAt: number): string {
  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const m = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

let tickInterval: ReturnType<typeof setInterval> | null = null;

function clearTick() {
  if (tickInterval !== null) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function logInvoke(cmd: string, args: Record<string, unknown>) {
  invoke(cmd, args).catch((err) => {
    console.error(`[focrel/tray] invoke ${cmd} failed:`, err, "args:", args);
  });
}

function syncContexts() {
  const active: TrayContext[] = useContextStore
    .getState()
    .contexts.filter((c) => !c.archivedAt)
    .map((c) => ({ id: c.id, name: c.name }));
  console.info(`[focrel/tray] syncContexts: ${active.length} items`);
  logInvoke("tray_set_contexts", { contexts: active });
}

function syncMusicMenu() {
  logInvoke("tray_set_music_state", {
    available: musicCurrentPath !== null,
    isPlaying: musicIsPlaying,
  });
}

function syncSession() {
  const { state } = useSessionStore.getState();
  console.info(`[focrel/tray] syncSession: phase=${state.phase}`);

  if (state.phase === "active") {
    const ctx = useContextStore.getState().getById(state.contextId);
    const ctxName = ctx?.name ?? "Focus";
    const capturedStartedAt = state.startedAt;

    // Music availability follows the session's configured track; audio.play
    // is already fired from session-store.start. We mirror that belief here.
    musicCurrentPath = ctx?.musicPath ?? null;
    musicIsPlaying = musicCurrentPath !== null;
    musicLoopForever = (ctx?.musicLoop ?? 1) === 1;

    logInvoke("tray_set_end_enabled", { enabled: true });
    logInvoke("tray_set_session_label", {
      label: `${ctxName} · ${formatElapsed(capturedStartedAt)}`,
    });
    syncMusicMenu();

    clearTick();
    tickInterval = setInterval(() => {
      logInvoke("tray_set_session_label", {
        label: `${ctxName} · ${formatElapsed(capturedStartedAt)}`,
      });
    }, 1000);
  } else {
    clearTick();
    musicCurrentPath = null;
    musicIsPlaying = false;
    logInvoke("tray_set_end_enabled", { enabled: false });
    logInvoke("tray_set_session_label", { label: "No active session" });
    syncMusicMenu();
  }
}

export function initTrayBridge(): void {
  void listen<{ contextId: string }>("focrel://tray-start-session", (event) => {
    const { contextId } = event.payload;
    const ctx = useContextStore.getState().getById(contextId);
    void useSessionStore.getState().start({
      contextId,
      plannedDurationMinutes: ctx?.defaultDurationMinutes ?? 25,
      taskIds: [],
    });
  });

  void listen("focrel://tray-end-session", () => {
    void useSessionStore.getState().end("interrupted");
  });

  void listen("focrel://tray-music-toggle", () => {
    if (musicCurrentPath === null) return;
    if (musicIsPlaying) {
      void audio.pause();
      musicIsPlaying = false;
    } else {
      // Sink was dropped on pause/stop — play() with the current path re-creates it.
      void audio.play(musicCurrentPath, musicLoopForever);
      musicIsPlaying = true;
    }
    syncMusicMenu();
  });

  void listen("focrel://tray-music-stop", () => {
    void audio.stop();
    musicIsPlaying = false;
    syncMusicMenu();
  });

  useContextStore.subscribe(syncContexts);
  useSessionStore.subscribe(syncSession);

  // Zustand's subscribe only fires on subsequent changes. Because init runs
  // AFTER contexts load and AFTER the resume-on-launch path can flip session
  // to 'active', the subscriptions would never see the initial state.
  // Invoke once explicitly so the tray menu reflects reality at startup.
  syncContexts();
  syncSession();
}
