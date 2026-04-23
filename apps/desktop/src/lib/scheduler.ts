import { useContextStore } from "@/lib/stores/context-store";
import { useSessionStore } from "@/lib/stores/session-store";
import { notify } from "@/lib/os/notifications";

// Tracks the ISO date ("YYYY-MM-DD") each context last fired, preventing
// duplicate fires per day. Module-level map: cleared on app restart.
const firedToday = new Map<string, string>();

// Grace window — the scheduled minute may pass while the app is launching,
// a different session is active, or the browser throttles JS interval timers.
// We still fire up to this many minutes late so a missed tick doesn't silently
// skip the whole day.
const GRACE_MINUTES = 5;

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function check(): void {
  const now = new Date();
  const dow = now.getDay();
  const today = todayIso();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const contexts = useContextStore.getState().contexts;

  for (const c of contexts) {
    if (c.scheduleEnabled !== 1 || !c.scheduleTime) continue;

    const days = c.scheduleDays.split(",").filter(Boolean).map(Number);
    if (!days.includes(dow)) continue;

    const [sh, sm] = c.scheduleTime.split(":").map(Number);
    if (Number.isNaN(sh) || Number.isNaN(sm)) continue;
    const schedMin = sh * 60 + sm;

    const delta = nowMin - schedMin;
    if (delta < 0 || delta > GRACE_MINUTES) continue;

    // Already-fired guard stays: once per day per context.
    if (firedToday.get(c.id) === today) continue;

    // Don't stomp an active session — and importantly do NOT mark fired here.
    // If we marked fired with a session active, subsequent ticks (after the
    // user ends that session but still within the grace window) would skip,
    // and the user's schedule would silently never trigger. Leaving the
    // mark unset lets the next tick fire once the current session wraps.
    if (useSessionStore.getState().state.phase === "active") continue;

    // Mark fired BEFORE firing so a re-entrant tick (unlikely but possible
    // via setInterval cadence) can't double-start the same context.
    firedToday.set(c.id, today);

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
