import { getDb } from "../client";
import { newId } from "../../utils/ulid";
import type { Context, NewContext } from "../schema";

type ContextRow = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  wallpaper_path: string | null;
  music_path: string | null;
  shortcut_name: string | null;
  revert_shortcut_name: string | null;
  apps_to_quit: string;
  blocked_sites: string;
  default_duration_minutes: number;
  schedule_enabled: number;
  schedule_time: string | null;
  schedule_times: string;
  schedule_days: string;
  schedule_auto_start: number;
  music_loop: number;
  music_paths: string;
  music_shuffle: number;
  apps_to_start: string;
  quit_all_apps: number;
  created_at: number;
  updated_at: number;
  archived_at: number | null;
};

function toContext(row: ContextRow): Context {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    wallpaperPath: row.wallpaper_path,
    musicPath: row.music_path,
    shortcutName: row.shortcut_name,
    revertShortcutName: row.revert_shortcut_name,
    appsToQuit: row.apps_to_quit,
    blockedSites: row.blocked_sites,
    defaultDurationMinutes: row.default_duration_minutes,
    scheduleEnabled: row.schedule_enabled,
    scheduleTime: row.schedule_time,
    scheduleTimes: row.schedule_times,
    scheduleDays: row.schedule_days,
    scheduleAutoStart: row.schedule_auto_start,
    musicLoop: row.music_loop,
    musicPaths: row.music_paths,
    musicShuffle: row.music_shuffle,
    appsToStart: row.apps_to_start,
    quitAllApps: row.quit_all_apps,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

// Explicit column list, in a fixed order. We avoid `SELECT *` here because
// sqlx-sqlite's prepared-statement cache can panic ("index out of bounds:
// len is N but index is N") when a query prepared before an ALTER TABLE ADD
// COLUMN is re-executed in the same session. Explicit names bind the prepare
// to the current physical schema, which stays stable after `ensureContextsColumns`.
const SELECT_COLUMNS = `
  id, name, description, color, icon,
  wallpaper_path, music_path, shortcut_name, revert_shortcut_name,
  apps_to_quit, apps_to_start, quit_all_apps, blocked_sites, default_duration_minutes,
  schedule_enabled, schedule_time, schedule_times, schedule_days, schedule_auto_start,
  music_loop, music_paths, music_shuffle,
  created_at, updated_at, archived_at
`;

export const contextsRepo = {
  async list({ includeArchived = false }: { includeArchived?: boolean } = {}): Promise<Context[]> {
    const db = await getDb();
    const sql = includeArchived
      ? `SELECT ${SELECT_COLUMNS} FROM contexts ORDER BY created_at ASC`
      : `SELECT ${SELECT_COLUMNS} FROM contexts WHERE archived_at IS NULL ORDER BY created_at ASC`;
    const rows = await db.select<ContextRow[]>(sql);
    return rows.map(toContext);
  },

  async get(id: string): Promise<Context | null> {
    const db = await getDb();
    const rows = await db.select<ContextRow[]>(
      `SELECT ${SELECT_COLUMNS} FROM contexts WHERE id = ?`,
      [id],
    );
    return rows.length > 0 ? toContext(rows[0]) : null;
  },

  async create(
    input: Omit<NewContext, "id" | "createdAt" | "updatedAt">,
  ): Promise<Context> {
    const db = await getDb();
    const id = newId();
    const now = Date.now();
    await db.execute(
      `INSERT INTO contexts (
        id, name, description, color, icon,
        wallpaper_path, music_path, shortcut_name, revert_shortcut_name,
        apps_to_quit, blocked_sites, default_duration_minutes,
        schedule_enabled, schedule_time, schedule_times, schedule_days, schedule_auto_start,
        music_loop, music_paths, music_shuffle, apps_to_start, quit_all_apps,
        created_at, updated_at, archived_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.name,
        input.description ?? null,
        input.color,
        input.icon ?? null,
        input.wallpaperPath ?? null,
        input.musicPath ?? null,
        input.shortcutName ?? null,
        input.revertShortcutName ?? null,
        input.appsToQuit ?? "[]",
        input.blockedSites ?? "[]",
        input.defaultDurationMinutes ?? 25,
        input.scheduleEnabled ?? 0,
        input.scheduleTime ?? null,
        input.scheduleTimes ?? "[]",
        input.scheduleDays ?? "",
        input.scheduleAutoStart ?? 1,
        input.musicLoop ?? 1,
        input.musicPaths ?? "[]",
        input.musicShuffle ?? 0,
        input.appsToStart ?? "[]",
        input.quitAllApps ?? 0,
        now,
        now,
        input.archivedAt ?? null,
      ],
    );
    return (await this.get(id)) as Context;
  },

  async update(id: string, patch: Partial<Omit<NewContext, "id" | "createdAt">>): Promise<Context> {
    const db = await getDb();
    const now = Date.now();
    const fields: string[] = ["updated_at = ?"];
    const values: unknown[] = [now];

    if (patch.name !== undefined) { fields.push("name = ?"); values.push(patch.name); }
    if (patch.description !== undefined) { fields.push("description = ?"); values.push(patch.description); }
    if (patch.color !== undefined) { fields.push("color = ?"); values.push(patch.color); }
    if (patch.icon !== undefined) { fields.push("icon = ?"); values.push(patch.icon); }
    if (patch.wallpaperPath !== undefined) { fields.push("wallpaper_path = ?"); values.push(patch.wallpaperPath); }
    if (patch.musicPath !== undefined) { fields.push("music_path = ?"); values.push(patch.musicPath); }
    if (patch.shortcutName !== undefined) { fields.push("shortcut_name = ?"); values.push(patch.shortcutName); }
    if (patch.revertShortcutName !== undefined) { fields.push("revert_shortcut_name = ?"); values.push(patch.revertShortcutName); }
    if (patch.appsToQuit !== undefined) { fields.push("apps_to_quit = ?"); values.push(patch.appsToQuit); }
    if (patch.blockedSites !== undefined) { fields.push("blocked_sites = ?"); values.push(patch.blockedSites); }
    if (patch.defaultDurationMinutes !== undefined) { fields.push("default_duration_minutes = ?"); values.push(patch.defaultDurationMinutes); }
    if (patch.scheduleEnabled !== undefined) { fields.push("schedule_enabled = ?"); values.push(patch.scheduleEnabled); }
    if (patch.scheduleTime !== undefined) { fields.push("schedule_time = ?"); values.push(patch.scheduleTime); }
    if (patch.scheduleTimes !== undefined) { fields.push("schedule_times = ?"); values.push(patch.scheduleTimes); }
    if (patch.scheduleDays !== undefined) { fields.push("schedule_days = ?"); values.push(patch.scheduleDays); }
    if (patch.scheduleAutoStart !== undefined) { fields.push("schedule_auto_start = ?"); values.push(patch.scheduleAutoStart); }
    if (patch.musicLoop !== undefined) { fields.push("music_loop = ?"); values.push(patch.musicLoop); }
    if (patch.musicPaths !== undefined) { fields.push("music_paths = ?"); values.push(patch.musicPaths); }
    if (patch.musicShuffle !== undefined) { fields.push("music_shuffle = ?"); values.push(patch.musicShuffle); }
    if (patch.appsToStart !== undefined) { fields.push("apps_to_start = ?"); values.push(patch.appsToStart); }
    if (patch.quitAllApps !== undefined) { fields.push("quit_all_apps = ?"); values.push(patch.quitAllApps); }
    if (patch.archivedAt !== undefined) { fields.push("archived_at = ?"); values.push(patch.archivedAt); }

    values.push(id);
    await db.execute(`UPDATE contexts SET ${fields.join(", ")} WHERE id = ?`, values);
    return (await this.get(id)) as Context;
  },

  async archive(id: string): Promise<Context> {
    return this.update(id, { archivedAt: Date.now() });
  },

  async unarchive(id: string): Promise<Context> {
    return this.update(id, { archivedAt: null });
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.execute("DELETE FROM contexts WHERE id = ?", [id]);
  },
};
