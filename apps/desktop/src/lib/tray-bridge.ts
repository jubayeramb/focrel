import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { useContextStore } from "./stores/context-store";
import { useMusicStore } from "./stores/music-store";
import { useSessionStore } from "./stores/session-store";

type TrayContext = { id: string; name: string };

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

// Pushes the current music-store state into the Rust-side tray menu.
// Called whenever the store changes — single source of truth.
function syncMusicMenu() {
  const { path, isPlaying } = useMusicStore.getState();
  logInvoke("tray_set_music_state", {
    available: path !== null,
    isPlaying,
  });
}

function syncSession() {
  const { state } = useSessionStore.getState();
  console.info(`[focrel/tray] syncSession: phase=${state.phase}`);

  if (state.phase === "active") {
    const ctx = useContextStore.getState().getById(state.contextId);
    const ctxName = ctx?.name ?? "Focus";

    logInvoke("tray_set_end_enabled", { enabled: true });
    // Rust-side ticker owns the 1s label refresh so it doesn't drift when
    // the webview is hidden (browsers throttle JS setInterval to ~2s when
    // the window is minimized / backgrounded).
    logInvoke("tray_start_ticker", { startedAt: state.startedAt, ctxName });
  } else {
    logInvoke("tray_stop_ticker", {});
    logInvoke("tray_set_end_enabled", { enabled: false });
    logInvoke("tray_set_session_label", { label: "No active session" });
  }
  // Music state is driven by the music-store → its own subscription handles
  // tray syncing; no need to re-sync here.
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

  // Tray music controls delegate to the shared store — toggling here flows
  // the same code path the session view uses, so both surfaces re-render in
  // lockstep.
  void listen("focrel://tray-music-toggle", () => {
    void useMusicStore.getState().toggle();
  });

  void listen("focrel://tray-music-stop", () => {
    void useMusicStore.getState().stop();
  });

  useContextStore.subscribe(syncContexts);
  useSessionStore.subscribe(syncSession);
  useMusicStore.subscribe(syncMusicMenu);

  // Zustand's subscribe only fires on subsequent changes. Init runs after
  // stores hydrate, so we wouldn't see initial state otherwise — push it
  // once explicitly.
  syncContexts();
  syncSession();
  syncMusicMenu();
}
