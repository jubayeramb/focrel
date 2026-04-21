import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contexts = sqliteTable("contexts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull(),
  icon: text("icon"),
  wallpaperPath: text("wallpaper_path"),
  musicPath: text("music_path"),
  shortcutName: text("shortcut_name"),
  revertShortcutName: text("revert_shortcut_name"),
  appsToQuit: text("apps_to_quit").notNull().default("[]"),
  blockedSites: text("blocked_sites").notNull().default("[]"),
  defaultDurationMinutes: integer("default_duration_minutes").notNull().default(25),
  scheduleEnabled: integer("schedule_enabled").notNull().default(0),
  scheduleTime: text("schedule_time"),
  scheduleDays: text("schedule_days").notNull().default(""),
  scheduleAutoStart: integer("schedule_auto_start").notNull().default(1),
  musicLoop: integer("music_loop").notNull().default(1),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  archivedAt: integer("archived_at"),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  contextId: text("context_id")
    .notNull()
    .references(() => contexts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  notes: text("notes"),
  status: text("status", { enum: ["pending", "in_progress", "done"] })
    .notNull()
    .default("pending"),
  priority: integer("priority").notNull().default(0),
  dueAt: integer("due_at"),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  completedAt: integer("completed_at"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  contextId: text("context_id")
    .notNull()
    .references(() => contexts.id, { onDelete: "cascade" }),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
  plannedDurationMinutes: integer("planned_duration_minutes").notNull(),
  actualDurationSeconds: integer("actual_duration_seconds"),
  endReason: text("end_reason", { enum: ["completed", "interrupted", "abandoned"] }),
  notes: text("notes"),
});

export const sessionTasks = sqliteTable(
  "session_tasks",
  {
    sessionId: text("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.sessionId, table.taskId] })],
);

export type Context = typeof contexts.$inferSelect;
export type NewContext = typeof contexts.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type SessionTask = typeof sessionTasks.$inferSelect;
export type NewSessionTask = typeof sessionTasks.$inferInsert;
