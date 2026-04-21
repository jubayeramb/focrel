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

export function initTrayBridge(): void {
  // Listen for tray → start-session requests.
  void listen<{ contextId: string }>("focrel://tray-start-session", (event) => {
    const { contextId } = event.payload;
    const ctx = useContextStore.getState().getById(contextId);
    void useSessionStore.getState().start({
      contextId,
      plannedDurationMinutes: ctx?.defaultDurationMinutes ?? 25,
      taskIds: [],
    });
  });

  // Listen for tray → end-session requests.
  void listen("focrel://tray-end-session", () => {
    void useSessionStore.getState().end("interrupted");
  });

  // Keep tray context list in sync with the context store.
  useContextStore.subscribe((state) => {
    const active: TrayContext[] = state.contexts
      .filter((c) => !c.archivedAt)
      .map((c) => ({ id: c.id, name: c.name }));
    void invoke("tray_set_contexts", { contexts: active });
  });

  // Keep tray session label and end-item state in sync with the session store.
  let tickInterval: ReturnType<typeof setInterval> | null = null;

  useSessionStore.subscribe((store) => {
    const { state } = store;

    if (state.phase === "active") {
      const ctx = useContextStore.getState().getById(state.contextId);
      const ctxName = ctx?.name ?? "Focus";

      void invoke("tray_set_end_enabled", { enabled: true });
      void invoke("tray_set_session_label", {
        label: `${ctxName} · ${formatElapsed(state.startedAt)}`,
      });

      if (tickInterval !== null) {
        clearInterval(tickInterval);
      }
      const capturedStartedAt = state.startedAt;
      tickInterval = setInterval(() => {
        void invoke("tray_set_session_label", {
          label: `${ctxName} · ${formatElapsed(capturedStartedAt)}`,
        });
      }, 1000);
    } else {
      if (tickInterval !== null) {
        clearInterval(tickInterval);
        tickInterval = null;
      }
      void invoke("tray_set_end_enabled", { enabled: false });
      void invoke("tray_set_session_label", { label: "No active session" });
    }
  });
}
