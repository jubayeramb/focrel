import { notify } from "@/lib/os/notifications";
import { useContextStore } from "@/lib/stores/context-store";
import { useSessionStore } from "@/lib/stores/session-store";

// Fires a system notification the moment an active session's planned time
// elapses, regardless of whether the session view is mounted. Previously
// this lived inside ActiveSessionView's effect — that meant minimizing the
// window, hiding the app, or simply navigating away from the session page
// would unmount the view and the user would never be alerted at time-up.
//
// This watcher runs for the life of the app, polls the session store, and
// tracks which session id it has already notified for so it never double-
// fires. It deliberately does NOT auto-end the session — the End dialog is
// still the user's confirmation point; we just surface the signal.
let notifiedForSession: string | null = null;

function tick(): void {
  const state = useSessionStore.getState().state;

  if (state.phase !== "active") {
    // Reset on any non-active phase so a subsequent session starts fresh.
    notifiedForSession = null;
    return;
  }

  if (notifiedForSession === state.sessionId) return;

  const elapsedMs = Date.now() - state.startedAt;
  const plannedMs = state.plannedDurationMinutes * 60_000;
  if (elapsedMs < plannedMs) return;

  notifiedForSession = state.sessionId;
  const ctx = useContextStore.getState().getById(state.contextId);
  const ctxName = ctx?.name ?? "Session";
  void notify(
    "Session time is over",
    `${ctxName} · ${state.plannedDurationMinutes}m planned`,
  ).catch(() => {});
}

export function initSessionTimeoutWatcher(): void {
  // 5s cadence is accurate enough for a minute-granular timer and cheap
  // enough to leave running all day.
  tick();
  setInterval(tick, 5_000);
}
