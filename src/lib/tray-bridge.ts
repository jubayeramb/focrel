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

    musicCurrentPath = ctx?.musicPath ?? null;
    musicIsPlaying = musicCurrentPath !== null;
    musicLoopForever = (ctx?.musicLoop ?? 1) === 1;

    logInvoke("tray_set_end_enabled", { enabled: true });
    // Rust-side ticker owns the 1s label refresh so it doesn't drift when
    // the webview is hidden (browsers throttle JS setInterval to ~2s when
    // the window is minimized / backgrounded).
    logInvoke("tray_start_ticker", { startedAt: state.startedAt, ctxName });
    syncMusicMenu();
  } else {
    musicCurrentPath = null;
    musicIsPlaying = false;
    logInvoke("tray_stop_ticker", {});
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
