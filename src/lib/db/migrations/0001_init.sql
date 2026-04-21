CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS contexts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  icon TEXT,
  wallpaper_path TEXT,
  music_path TEXT,
  shortcut_name TEXT,
  revert_shortcut_name TEXT,
  apps_to_quit TEXT NOT NULL DEFAULT '[]',
  blocked_sites TEXT NOT NULL DEFAULT '[]',
  default_duration_minutes INTEGER NOT NULL DEFAULT 25,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  archived_at INTEGER
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  context_id TEXT NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  priority INTEGER NOT NULL DEFAULT 0,
  due_at INTEGER,
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  context_id TEXT NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  planned_duration_minutes INTEGER NOT NULL,
  actual_duration_seconds INTEGER,
  end_reason TEXT CHECK (end_reason IN ('completed', 'interrupted', 'abandoned')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS session_tasks (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_context_position ON tasks(context_id, position);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE INDEX IF NOT EXISTS idx_sessions_context_started ON sessions(context_id, started_at DESC);
