import Database from "@tauri-apps/plugin-sql";
import initSql from "./migrations/0001_init.sql?raw";
import migration2 from "./migrations/0002_add_schedule.sql?raw";
import migration3 from "./migrations/0003_music_loop.sql?raw";
import migration4 from "./migrations/0004_music_playlist.sql?raw";

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!_db) {
    _db = await Database.load("sqlite:focrel.db");
  }
  return _db;
}

// Columns that were added to `contexts` after 0001_init via ADD COLUMN
// migrations. Treated as a desired-state spec and applied on EVERY launch
// (not gated on _migrations markers) so stuck markers or manual DB edits
// can't leave the schema partially upgraded. Order matters for the create
// case only — ALTER TABLE ADD COLUMN is append-only in SQLite regardless.
const CONTEXTS_EVOLUTIONS: Array<[column: string, definition: string]> = [
  ["schedule_enabled", "INTEGER NOT NULL DEFAULT 0"],
  ["schedule_time", "TEXT"],
  ["schedule_days", "TEXT NOT NULL DEFAULT ''"],
  ["schedule_auto_start", "INTEGER NOT NULL DEFAULT 1"],
  ["music_loop", "INTEGER NOT NULL DEFAULT 1"],
  ["music_paths", "TEXT NOT NULL DEFAULT '[]'"],
  ["music_shuffle", "INTEGER NOT NULL DEFAULT 0"],
  ["apps_to_start", "TEXT NOT NULL DEFAULT '[]'"],
  ["quit_all_apps", "INTEGER NOT NULL DEFAULT 0"],
  // JSON array of "HH:MM" strings — supersedes the single `schedule_time`
  // column. The legacy column is kept in sync with the first entry so any
  // remaining single-time readers still work.
  ["schedule_times", "TEXT NOT NULL DEFAULT '[]'"],
];

async function ensureContextsColumns(db: Database): Promise<void> {
  const existing = await db.select<Array<{ name: string }>>(
    "PRAGMA table_info(contexts)",
  );
  const have = new Set(existing.map((r) => r.name));

  for (const [col, def] of CONTEXTS_EVOLUTIONS) {
    if (have.has(col)) continue;
    // SQLite doesn't allow parameter binding on DDL, but column/def values
    // here are hard-coded constants — no user input involved.
    await db.execute(`ALTER TABLE contexts ADD COLUMN ${col} ${def}`);
  }
}

export async function runMigrations(): Promise<void> {
  const db = await getDb();

  await db.execute(
    `CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )`,
  );

  const rows = await db.select<Array<{ name: string }>>(
    "SELECT name FROM _migrations WHERE name = ?",
    ["0001_init"],
  );

  if (rows.length === 0) {
    const statements = initSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await db.execute(statement);
    }

    await db.execute("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)", [
      "0001_init",
      Date.now(),
    ]);
  }

  // Ensure every column the app expects on `contexts` is present, regardless
  // of the state of the _migrations markers below. This is the safety net
  // that caught a sqlx-sqlite panic ("len is 20 but index is 20") from a DB
  // where a previous 0004 attempt recorded the marker without applying the
  // ALTER. The blocks below stay for chronological bookkeeping.
  await ensureContextsColumns(db);

  const rows2 = await db.select<Array<{ name: string }>>(
    "SELECT name FROM _migrations WHERE name = ?",
    ["0002_add_schedule"],
  );

  if (rows2.length === 0) {
    // Some early builds added the columns but failed to record the
    // _migrations marker row. Probe the live schema and skip any
    // ALTER that would re-add an existing column; this makes the
    // migration safely re-runnable against already-upgraded DBs.
    const existingCols = await db.select<Array<{ name: string }>>(
      "PRAGMA table_info(contexts)",
    );
    const colSet = new Set(existingCols.map((c) => c.name));

    const statements2 = migration2
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements2) {
      const addColMatch = statement.match(
        /ALTER\s+TABLE\s+\w+\s+ADD\s+COLUMN\s+(\w+)/i,
      );
      if (addColMatch && colSet.has(addColMatch[1])) {
        continue;
      }
      await db.execute(statement);
    }

    await db.execute("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)", [
      "0002_add_schedule",
      Date.now(),
    ]);
  }

  const rows3 = await db.select<Array<{ name: string }>>(
    "SELECT name FROM _migrations WHERE name = ?",
    ["0003_music_loop"],
  );

  if (rows3.length === 0) {
    const existingCols = await db.select<Array<{ name: string }>>(
      "PRAGMA table_info(contexts)",
    );
    const colSet = new Set(existingCols.map((c) => c.name));

    const statements3 = migration3
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements3) {
      const addColMatch = statement.match(
        /ALTER\s+TABLE\s+\w+\s+ADD\s+COLUMN\s+(\w+)/i,
      );
      if (addColMatch && colSet.has(addColMatch[1])) {
        continue;
      }
      await db.execute(statement);
    }

    await db.execute("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)", [
      "0003_music_loop",
      Date.now(),
    ]);
  }

  const rows4 = await db.select<Array<{ name: string }>>(
    "SELECT name FROM _migrations WHERE name = ?",
    ["0004_music_playlist"],
  );

  if (rows4.length === 0) {
    const existingCols = await db.select<Array<{ name: string }>>(
      "PRAGMA table_info(contexts)",
    );
    const colSet = new Set(existingCols.map((c) => c.name));

    const statements4 = migration4
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements4) {
      const addColMatch = statement.match(
        /ALTER\s+TABLE\s+\w+\s+ADD\s+COLUMN\s+(\w+)/i,
      );
      if (addColMatch && colSet.has(addColMatch[1])) {
        continue;
      }
      await db.execute(statement);
    }

    await db.execute("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)", [
      "0004_music_playlist",
      Date.now(),
    ]);
  }
}
