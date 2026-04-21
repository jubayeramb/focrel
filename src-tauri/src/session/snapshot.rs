use crate::commands::wallpaper::set_wallpaper;
use crate::commands::shortcuts::run_shortcut;
use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Snapshot {
    pub session_id: String,
    pub context_id: String,
    pub started_at: i64,
    pub original_wallpapers: Vec<String>,
    pub original_volume: Option<f32>,
    pub focus_toggled_by_us: bool,
    pub revert_shortcut_name: Option<String>,
    pub apps_quit: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconcileReport {
    pub restored_wallpapers: bool,
    pub focus_reverted: bool,
    pub session_id: String,
}

fn snapshot_path(app: &AppHandle) -> AppResult<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::TauriApi(format!("app_data_dir: {e}")))?;
    Ok(dir.join("active-session.json"))
}

fn ensure_data_dir(app: &AppHandle) -> AppResult<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::TauriApi(format!("app_data_dir: {e}")))?;
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

#[tauri::command]
pub fn snapshot_save(app: AppHandle, snapshot: Snapshot) -> AppResult<()> {
    let dir = ensure_data_dir(&app)?;
    let target = dir.join("active-session.json");
    let tmp = dir.join("active-session.json.tmp");

    let json = serde_json::to_string_pretty(&snapshot)?;
    std::fs::write(&tmp, json)?;
    std::fs::rename(&tmp, &target)?;

    Ok(())
}

#[tauri::command]
pub fn snapshot_load(app: AppHandle) -> AppResult<Option<Snapshot>> {
    let path = snapshot_path(&app)?;

    if !path.exists() {
        return Ok(None);
    }

    let bytes = std::fs::read(&path)?;
    let snapshot: Snapshot = serde_json::from_slice(&bytes)?;
    Ok(Some(snapshot))
}

#[tauri::command]
pub fn snapshot_clear(app: AppHandle) -> AppResult<()> {
    let path = snapshot_path(&app)?;
    if path.exists() {
        std::fs::remove_file(&path)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn snapshot_reconcile(app: AppHandle) -> AppResult<Option<ReconcileReport>> {
    let snapshot = match snapshot_load(app.clone())? {
        Some(s) => s,
        None => return Ok(None),
    };

    let mut restored_wallpapers = false;
    let mut focus_reverted = false;

    for path in &snapshot.original_wallpapers {
        if let Err(e) = set_wallpaper(path.clone(), None) {
            log::warn!("reconcile: failed to restore wallpaper {path}: {e}");
        } else {
            restored_wallpapers = true;
        }
    }

    if snapshot.focus_toggled_by_us {
        if let Some(ref shortcut) = snapshot.revert_shortcut_name {
            if let Err(e) = run_shortcut(shortcut.clone()).await {
                log::warn!("reconcile: failed to run revert shortcut '{shortcut}': {e}");
            } else {
                focus_reverted = true;
            }
        }
    }

    snapshot_clear(app)?;

    Ok(Some(ReconcileReport {
        restored_wallpapers,
        focus_reverted,
        session_id: snapshot.session_id,
    }))
}
