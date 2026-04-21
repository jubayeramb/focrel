import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { useContextStore } from "./stores/context-store";
import { useSessionStore } from "./stores/session-store";

type TrayContext = { id: string; name: string };

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

function syncSession() {
  const { state } = useSessionStore.getState();
  console.info(`[focrel/tray] syncSession: phase=${state.phase}`);

  if (state.phase === "active") {
    const ctx = useContextStore.getState().getById(state.contextId);
    const ctxName = ctx?.name ?? "Focus";
    const capturedStartedAt = state.startedAt;

    logInvoke("tray_set_end_enabled", { enabled: true });
    logInvoke("tray_set_session_label", {
      label: `${ctxName} · ${formatElapsed(capturedStartedAt)}`,
    });

    clearTick();
    tickInterval = setInterval(() => {
      logInvoke("tray_set_session_label", {
        label: `${ctxName} · ${formatElapsed(capturedStartedAt)}`,
      });
    }, 1000);
  } else {
    clearTick();
    logInvoke("tray_set_end_enabled", { enabled: false });
    logInvoke("tray_set_session_label", { label: "No active session" });
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

  useContextStore.subscribe(syncContexts);
  useSessionStore.subscribe(syncSession);

  // Zustand's subscribe only fires on subsequent changes. Because init runs
  // AFTER contexts load and AFTER the resume-on-launch path can flip session
  // to 'active', the subscriptions would never see the initial state.
  // Invoke once explicitly so the tray menu reflects reality at startup.
  syncContexts();
  syncSession();
}
