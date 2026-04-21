use tauri::{AppHandle, Manager};

use crate::error::{AppError, AppResult};
use crate::tray::{set_submenu_contexts, TrayContextItem, TrayHandles};

#[tauri::command]
pub fn tray_set_session_label(app: AppHandle, label: String) -> AppResult<()> {
    let handles: tauri::State<TrayHandles> = app.state();
    let guard = handles.session_item.lock().unwrap();
    let item = guard
        .as_ref()
        .ok_or_else(|| AppError::TauriApi("session-label item not initialised".into()))?;
    item.set_text(label)
        .map_err(|e| AppError::TauriApi(e.to_string()))
}

#[tauri::command]
pub fn tray_set_contexts(app: AppHandle, contexts: Vec<TrayContext>) -> AppResult<()> {
    let items: Vec<TrayContextItem> = contexts
        .into_iter()
        .map(|c| TrayContextItem { id: c.id, name: c.name })
        .collect();

    let handles: tauri::State<TrayHandles> = app.state();
    let guard = handles.start_submenu.lock().unwrap();
    let submenu = guard
        .as_ref()
        .ok_or_else(|| AppError::TauriApi("start-submenu not initialised".into()))?;
    set_submenu_contexts(&app, submenu, &items)
}

#[tauri::command]
pub fn tray_set_music_state(
    app: AppHandle,
    available: bool,
    is_playing: bool,
) -> AppResult<()> {
    let handles: tauri::State<TrayHandles> = app.state();

    let play_guard = handles.music_play_item.lock().unwrap();
    if let Some(item) = play_guard.as_ref() {
        let label = if is_playing { "Pause music" } else { "Play music" };
        item.set_text(label)
            .map_err(|e| AppError::TauriApi(e.to_string()))?;
        item.set_enabled(available)
            .map_err(|e| AppError::TauriApi(e.to_string()))?;
    }

    let stop_guard = handles.music_stop_item.lock().unwrap();
    if let Some(item) = stop_guard.as_ref() {
        item.set_enabled(available && is_playing)
            .map_err(|e| AppError::TauriApi(e.to_string()))?;
    }

    Ok(())
}

#[tauri::command]
pub fn tray_set_end_enabled(app: AppHandle, enabled: bool) -> AppResult<()> {
    let handles: tauri::State<TrayHandles> = app.state();
    let guard = handles.end_item.lock().unwrap();
    let item = guard
        .as_ref()
        .ok_or_else(|| AppError::TauriApi("end-session item not initialised".into()))?;
    item.set_enabled(enabled)
        .map_err(|e| AppError::TauriApi(e.to_string()))
}

/// JS-side payload shape for `tray_set_contexts`.
#[derive(serde::Deserialize)]
pub struct TrayContext {
    pub id: String,
    pub name: String,
}
