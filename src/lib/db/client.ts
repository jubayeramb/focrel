import Database from "@tauri-apps/plugin-sql";
import initSql from "./migrations/0001_init.sql?raw";
import migration2 from "./migrations/0002_add_schedule.sql?raw";
import migration3 from "./migrations/0003_music_loop.sql?raw";

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!_db) {
    _db = await Database.load("sqlite:focrel.db");
  }
  return _db;
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
}
