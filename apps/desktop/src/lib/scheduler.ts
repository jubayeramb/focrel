import type { Context } from "@/lib/db";
import { useContextStore } from "@/lib/stores/context-store";
import { useSessionStore } from "@/lib/stores/session-store";
import { notify } from "@/lib/os/notifications";

// Tracks the ISO date ("YYYY-MM-DD") each (context, time) last fired,
// preventing duplicate fires per day per scheduled slot. Module-level map:
// cleared on app restart. Key format: `${contextId}|${HH:MM}`.
const firedToday = new Map<string, string>();

// Grace window — the scheduled minute may pass while the app is launching,
// a different session is active, or macOS AppNap throttles JS timers. We
// still fire up to this many minutes late so a missed tick doesn't silently
// skip the slot. Deliberately generous so a cold-start a few minutes past
// the scheduled time still catches up; `firedToday` prevents double-fires.
const GRACE_MINUTES = 30;

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Pulls scheduled times out of the context. Prefers the JSON `scheduleTimes`
// array (post-multi-time column); falls back to the single `scheduleTime`
// for older contexts that haven't been re-saved yet.
function resolveTimes(ctx: Context): string[] {
  const hhmm = /^([01]?\d|2[0-3]):[0-5]\d$/;
  let times: string[] = [];
  if (ctx.scheduleTimes) {
    try {
      const parsed = JSON.parse(ctx.scheduleTimes) as unknown;
      if (Array.isArray(parsed)) {
        times = parsed.filter((t): t is string => typeof t === "string" && hhmm.test(t));
      }
    } catch {
      times = [];
    }
  }
  if (times.length === 0 && ctx.scheduleTime && hhmm.test(ctx.scheduleTime)) {
    times = [ctx.scheduleTime];
  }
  // Normalize + dedupe so `9:00` and `09:00` don't both fire.
  const norm = times.map((t) => {
    const [h, m] = t.split(":").map(Number);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  });
  return Array.from(new Set(norm));
}

function check(): void {
  const now = new Date();
  const dow = now.getDay();
  const today = todayIso();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const contexts = useContextStore.getState().contexts;

  for (const c of contexts) {
    if (c.scheduleEnabled !== 1) continue;

    const days = c.scheduleDays.split(",").filter(Boolean).map(Number);
    if (!days.includes(dow)) continue;

    const times = resolveTimes(c);
    if (times.length === 0) continue;

    for (const hhmm of times) {
      const [sh, sm] = hhmm.split(":").map(Number);
      const schedMin = sh * 60 + sm;

      const delta = nowMin - schedMin;
      if (delta < 0 || delta > GRACE_MINUTES) continue;

      const key = `${c.id}|${hhmm}`;
      if (firedToday.get(key) === today) continue;

      // Don't stomp an active session — and don't mark fired yet. When that
      // session ends within the grace window the next tick will fire this
      // slot as intended.
      if (useSessionStore.getState().state.phase === "active") continue;

      // Mark fired BEFORE the async start() so a re-entrant tick can't
      // double-launch the same (context, time) pair.
      firedToday.set(key, today);

      if (c.scheduleAutoStart === 1) {
        void useSessionStore.getState().start({
          contextId: c.id,
          plannedDurationMinutes: c.defaultDurationMinutes,
          taskIds: [],
        });
        // Only start one session per tick — a single tick that straddles
        // two nearby times shouldn't race two starts against each other.
        return;
      } else {
        void notify("Focus session due", c.name);
      }
    }
  }
}

export function initScheduler(): void {
  check();
  setInterval(check, 30_000);
}
