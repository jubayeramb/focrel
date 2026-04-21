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

/// Spawn a tokio ticker that updates the tray's session label every 1s with
/// elapsed MM:SS. Idempotent — existing ticker is aborted first.
#[tauri::command]
pub fn tray_start_ticker(app: AppHandle, started_at: i64, ctx_name: String) -> AppResult<()> {
    let handles: tauri::State<TrayHandles> = app.state();

    // Abort prior ticker before starting a new one.
    let prev = handles.ticker.lock().unwrap().take();
    if let Some(h) = prev {
        h.abort();
    }

    let app_for_task = app.clone();
    let handle = tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(1));
        // Fire immediately on first tick rather than waiting a second.
        interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);
        loop {
            interval.tick().await;
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis() as i64)
                .unwrap_or(0);
            let elapsed_sec = ((now - started_at).max(0) / 1000) as i64;
            let m = elapsed_sec / 60;
            let s = elapsed_sec % 60;
            let label = format!("{ctx_name} · {:02}:{:02}", m, s);

            let handles: tauri::State<TrayHandles> = app_for_task.state();
            let guard = handles.session_item.lock().unwrap();
            if let Some(item) = guard.as_ref() {
                let _ = item.set_text(&label);
            }
        }
    });

    *handles.ticker.lock().unwrap() = Some(handle);
    Ok(())
}

#[tauri::command]
pub fn tray_stop_ticker(app: AppHandle) -> AppResult<()> {
    let handles: tauri::State<TrayHandles> = app.state();
    let prev = handles.ticker.lock().unwrap().take();
    if let Some(h) = prev {
        h.abort();
    }
    Ok(())
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
