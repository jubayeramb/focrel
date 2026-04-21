import { invoke } from "@tauri-apps/api/core";

export type Snapshot = {
  sessionId: string;
  contextId: string;
  startedAt: number;
  originalWallpapers: string[];
  originalVolume: number | null;
  focusToggledByUs: boolean;
  revertShortcutName: string | null;
  appsQuit: string[];
};

export type ReconcileReport = {
  restoredWallpapers: boolean;
  focusReverted: boolean;
  sessionId: string;
};

type SnapshotRaw = {
  session_id: string;
  context_id: string;
  started_at: number;
  original_wallpapers: string[];
  original_volume: number | null;
  focus_toggled_by_us: boolean;
  revert_shortcut_name: string | null;
  apps_quit: string[];
};

type ReconcileReportRaw = {
  restored_wallpapers: boolean;
  focus_reverted: boolean;
  session_id: string;
};

function toSnakeSnapshot(s: Snapshot): SnapshotRaw {
  return {
    session_id: s.sessionId,
    context_id: s.contextId,
    started_at: s.startedAt,
    original_wallpapers: s.originalWallpapers,
    original_volume: s.originalVolume,
    focus_toggled_by_us: s.focusToggledByUs,
    revert_shortcut_name: s.revertShortcutName,
    apps_quit: s.appsQuit,
  };
}

function fromSnakeSnapshot(raw: SnapshotRaw): Snapshot {
  return {
    sessionId: raw.session_id,
    contextId: raw.context_id,
    startedAt: raw.started_at,
    originalWallpapers: raw.original_wallpapers,
    originalVolume: raw.original_volume,
    focusToggledByUs: raw.focus_toggled_by_us,
    revertShortcutName: raw.revert_shortcut_name,
    appsQuit: raw.apps_quit,
  };
}

function fromSnakeReconcileReport(raw: ReconcileReportRaw): ReconcileReport {
  return {
    restoredWallpapers: raw.restored_wallpapers,
    focusReverted: raw.focus_reverted,
    sessionId: raw.session_id,
  };
}

export const saveSnapshot = (s: Snapshot) =>
  invoke<void>("snapshot_save", { snapshot: toSnakeSnapshot(s) });

export const loadSnapshot = async (): Promise<Snapshot | null> => {
  const raw = await invoke<SnapshotRaw | null>("snapshot_load");
  return raw ? fromSnakeSnapshot(raw) : null;
};

export const clearSnapshot = () => invoke<void>("snapshot_clear");

export const reconcileSnapshot = async (): Promise<ReconcileReport | null> => {
  const raw = await invoke<ReconcileReportRaw | null>("snapshot_reconcile");
  return raw ? fromSnakeReconcileReport(raw) : null;
};
