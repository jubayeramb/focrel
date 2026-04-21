import { getDb } from "../client";
import { newId } from "../../utils/ulid";
import type { Session, Task } from "../schema";

type SessionRow = {
  id: string;
  context_id: string;
  started_at: number;
  ended_at: number | null;
  planned_duration_minutes: number;
  actual_duration_seconds: number | null;
  end_reason: "completed" | "interrupted" | "abandoned" | null;
  notes: string | null;
};

type TaskRow = {
  id: string;
  context_id: string;
  title: string;
  notes: string | null;
  status: "pending" | "in_progress" | "done";
  priority: number;
  due_at: number | null;
  position: number;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
};

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    contextId: row.context_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    plannedDurationMinutes: row.planned_duration_minutes,
    actualDurationSeconds: row.actual_duration_seconds,
    endReason: row.end_reason,
    notes: row.notes,
  };
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    contextId: row.context_id,
    title: row.title,
    notes: row.notes,
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export const sessionsRepo = {
  async start(
    contextId: string,
    plannedDurationMinutes: number,
    taskIds: string[],
  ): Promise<Session> {
    const db = await getDb();
    const id = newId();
    const now = Date.now();

    await db.execute(
      `INSERT INTO sessions (id, context_id, started_at, planned_duration_minutes)
       VALUES (?, ?, ?, ?)`,
      [id, contextId, now, plannedDurationMinutes],
    );

    for (const taskId of taskIds) {
      await db.execute(
        "INSERT INTO session_tasks (session_id, task_id) VALUES (?, ?)",
        [id, taskId],
      );
    }

    return (await this.get(id)) as Session;
  },

  async end(
    sessionId: string,
    endReason: "completed" | "interrupted" | "abandoned",
    notes?: string,
  ): Promise<Session> {
    const db = await getDb();
    const session = await this.get(sessionId);
    const endedAt = Date.now();
    const actualDurationSeconds = session
      ? Math.floor((endedAt - session.startedAt) / 1000)
      : null;

    await db.execute(
      `UPDATE sessions SET ended_at = ?, actual_duration_seconds = ?, end_reason = ?, notes = ?
       WHERE id = ?`,
      [endedAt, actualDurationSeconds, endReason, notes ?? null, sessionId],
    );

    return (await this.get(sessionId)) as Session;
  },

  async get(id: string): Promise<Session | null> {
    const db = await getDb();
    const rows = await db.select<SessionRow[]>("SELECT * FROM sessions WHERE id = ?", [id]);
    return rows.length > 0 ? toSession(rows[0]) : null;
  },

  async recentForContext(contextId: string, limit = 20): Promise<Session[]> {
    const db = await getDb();
    const rows = await db.select<SessionRow[]>(
      "SELECT * FROM sessions WHERE context_id = ? ORDER BY started_at DESC LIMIT ?",
      [contextId, limit],
    );
    return rows.map(toSession);
  },

  async clearAll(): Promise<void> {
    const db = await getDb();
    // session_tasks rows cascade-delete with sessions via the FK constraint.
    await db.execute("DELETE FROM sessions");
  },

  async allRecent(limit = 100): Promise<Session[]> {
    const db = await getDb();
    const rows = await db.select<SessionRow[]>(
      "SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?",
      [limit],
    );
    return rows.map(toSession);
  },

  async tasksForSession(sessionId: string): Promise<Task[]> {
    const db = await getDb();
    const rows = await db.select<TaskRow[]>(
      `SELECT t.* FROM tasks t
       INNER JOIN session_tasks st ON st.task_id = t.id
       WHERE st.session_id = ?
       ORDER BY t.position ASC`,
      [sessionId],
    );
    return rows.map(toTask);
  },
};
