import { getDb } from "../client";

type PeriodStats = {
  focusMinutes: number;
  sessionCount: number;
  completionRate: number;
};

type DayMinutes = {
  date: string;
  minutes: number;
};

type ContextMinutes = {
  contextId: string;
  name: string;
  color: string;
  minutes: number;
};

async function statsForRange(startMs: number, endMs: number): Promise<PeriodStats> {
  const db = await getDb();

  type Row = { focus_minutes: number | null; total: number; completed: number };
  const rows = await db.select<Row[]>(
    `SELECT
       SUM(CASE WHEN ended_at IS NOT NULL THEN actual_duration_seconds ELSE 0 END) / 60.0 AS focus_minutes,
       COUNT(*) AS total,
       COUNT(CASE WHEN end_reason = 'completed' THEN 1 END) AS completed
     FROM sessions
     WHERE started_at >= ? AND started_at < ?`,
    [startMs, endMs],
  );

  const row = rows[0];
  const total = row?.total ?? 0;
  return {
    focusMinutes: Math.round(row?.focus_minutes ?? 0),
    sessionCount: total,
    completionRate: total > 0 ? (row?.completed ?? 0) / total : 0,
  };
}

function startOfDayMs(offsetDays = 0): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.getTime();
}

export const analyticsRepo = {
  async todayStats(): Promise<PeriodStats> {
    return statsForRange(startOfDayMs(0), startOfDayMs(1));
  },

  async weekStats(): Promise<PeriodStats> {
    return statsForRange(startOfDayMs(-6), startOfDayMs(1));
  },

  async streakDays(): Promise<number> {
    const db = await getDb();

    type Row = { day: string };
    // Fetch all distinct days that have ≥1 completed session, ordered newest first.
    const rows = await db.select<Row[]>(
      `SELECT DISTINCT date(started_at / 1000, 'unixepoch', 'localtime') AS day
       FROM sessions
       WHERE end_reason = 'completed'
       ORDER BY day DESC`,
    );

    const completedDays = new Set(rows.map((r) => r.day));

    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    // Allow today with no completions yet — only break when a day has zero.
    while (true) {
      const iso = cursor.toISOString().slice(0, 10);
      if (completedDays.has(iso)) {
        streak++;
      } else if (streak === 0) {
        // Today has no completions — check yesterday before giving up.
        cursor.setDate(cursor.getDate() - 1);
        const yest = cursor.toISOString().slice(0, 10);
        if (completedDays.has(yest)) {
          streak++;
        } else {
          break;
        }
        cursor.setDate(cursor.getDate() - 1);
        continue;
      } else {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  },

  async dailyMinutes(days = 14): Promise<DayMinutes[]> {
    const db = await getDb();

    type Row = { day: string; minutes: number };
    const rows = await db.select<Row[]>(
      `SELECT
         date(started_at / 1000, 'unixepoch', 'localtime') AS day,
         SUM(CASE WHEN ended_at IS NOT NULL THEN actual_duration_seconds ELSE 0 END) / 60.0 AS minutes
       FROM sessions
       WHERE started_at >= ?
       GROUP BY day
       ORDER BY day ASC`,
      [startOfDayMs(-(days - 1))],
    );

    const byDay = new Map(rows.map((r) => [r.day, Math.round(r.minutes)]));

    // Fill in zero-minute days so the chart always has a full N-day window.
    const result: DayMinutes[] = [];
    for (let i = -(days - 1); i <= 0; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      result.push({ date: iso, minutes: byDay.get(iso) ?? 0 });
    }
    return result;
  },

  async byContext(days = 7): Promise<ContextMinutes[]> {
    const db = await getDb();
    const since = Date.now() - days * 86_400_000;

    type Row = { context_id: string; name: string; color: string; minutes: number };
    const rows = await db.select<Row[]>(
      `SELECT
         s.context_id,
         c.name,
         c.color,
         SUM(CASE WHEN s.ended_at IS NOT NULL THEN s.actual_duration_seconds ELSE 0 END) / 60.0 AS minutes
       FROM sessions s
       INNER JOIN contexts c ON c.id = s.context_id
       WHERE s.started_at >= ?
       GROUP BY s.context_id
       ORDER BY minutes DESC`,
      [since],
    );

    return rows.map((r) => ({
      contextId: r.context_id,
      name: r.name,
      color: r.color,
      minutes: Math.round(r.minutes),
    }));
  },
};
