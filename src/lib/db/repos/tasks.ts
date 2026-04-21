import { getDb } from "../client";
import { newId } from "../../utils/ulid";
import type { NewTask, Task } from "../schema";

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

export const tasksRepo = {
  async listByContext(
    contextId: string,
    { status }: { status?: Task["status"] } = {},
  ): Promise<Task[]> {
    const db = await getDb();
    if (status) {
      const rows = await db.select<TaskRow[]>(
        "SELECT * FROM tasks WHERE context_id = ? AND status = ? ORDER BY position ASC, created_at ASC",
        [contextId, status],
      );
      return rows.map(toTask);
    }
    const rows = await db.select<TaskRow[]>(
      "SELECT * FROM tasks WHERE context_id = ? ORDER BY position ASC, created_at ASC",
      [contextId],
    );
    return rows.map(toTask);
  },

  async get(id: string): Promise<Task | null> {
    const db = await getDb();
    const rows = await db.select<TaskRow[]>("SELECT * FROM tasks WHERE id = ?", [id]);
    return rows.length > 0 ? toTask(rows[0]) : null;
  },

  async create(input: Omit<NewTask, "id" | "createdAt" | "updatedAt">): Promise<Task> {
    const db = await getDb();
    const id = newId();
    const now = Date.now();
    await db.execute(
      `INSERT INTO tasks (
        id, context_id, title, notes, status, priority,
        due_at, position, created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.contextId,
        input.title,
        input.notes ?? null,
        input.status ?? "pending",
        input.priority ?? 0,
        input.dueAt ?? null,
        input.position ?? 0,
        now,
        now,
        input.completedAt ?? null,
      ],
    );
    return (await this.get(id)) as Task;
  },

  async update(id: string, patch: Partial<Omit<NewTask, "id" | "createdAt">>): Promise<Task> {
    const db = await getDb();
    const now = Date.now();
    const fields: string[] = ["updated_at = ?"];
    const values: unknown[] = [now];

    if (patch.title !== undefined) { fields.push("title = ?"); values.push(patch.title); }
    if (patch.notes !== undefined) { fields.push("notes = ?"); values.push(patch.notes); }
    if (patch.status !== undefined) { fields.push("status = ?"); values.push(patch.status); }
    if (patch.priority !== undefined) { fields.push("priority = ?"); values.push(patch.priority); }
    if (patch.dueAt !== undefined) { fields.push("due_at = ?"); values.push(patch.dueAt); }
    if (patch.position !== undefined) { fields.push("position = ?"); values.push(patch.position); }
    if (patch.completedAt !== undefined) { fields.push("completed_at = ?"); values.push(patch.completedAt); }

    values.push(id);
    await db.execute(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`, values);
    return (await this.get(id)) as Task;
  },

  async complete(id: string): Promise<Task> {
    return this.update(id, { status: "done", completedAt: Date.now() });
  },

  async reorder(contextId: string, orderedIds: string[]): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    for (let i = 0; i < orderedIds.length; i++) {
      await db.execute(
        "UPDATE tasks SET position = ?, updated_at = ? WHERE id = ? AND context_id = ?",
        [i, now, orderedIds[i], contextId],
      );
    }
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM tasks WHERE id = ?", [id]);
  },
};
