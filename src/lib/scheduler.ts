import { useContextStore } from "@/lib/stores/context-store";
import { useSessionStore } from "@/lib/stores/session-store";
import { notify } from "@/lib/os/notifications";

// Tracks the ISO date ("YYYY-MM-DD") each context last fired, preventing duplicate fires per day.
const firedToday = new Map<string, string>();

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function currentHhmm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function check(): void {
  const hhmm = currentHhmm();
  const dow = new Date().getDay();
  const today = todayIso();

  const contexts = useContextStore.getState().contexts;
  const due = contexts.filter(
    (c) =>
      c.scheduleEnabled === 1 &&
      c.scheduleTime &&
      c.scheduleDays
        .split(",")
        .filter(Boolean)
        .map(Number)
        .includes(dow),
  );

  for (const c of due) {
    if (c.scheduleTime !== hhmm) continue;

    // Mark fired regardless of whether we actually start, so we don't re-attempt within the minute.
    if (firedToday.get(c.id) === today) continue;
    firedToday.set(c.id, today);

    // Don't stomp an already-active session.
    if (useSessionStore.getState().state.phase === "active") continue;

    if (c.scheduleAutoStart === 1) {
      void useSessionStore.getState().start({
        contextId: c.id,
        plannedDurationMinutes: c.defaultDurationMinutes,
        taskIds: [],
      });
    } else {
      void notify("Focus session due", c.name);
    }
  }
}

export function initScheduler(): void {
  check();
  setInterval(check, 30_000);
}
