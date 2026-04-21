use std::sync::Mutex;

use tauri::{AppHandle, Manager};

use crate::error::{AppError, AppResult};
use crate::tray::{build_menu, TrayContextItem, TrayState};

/// Persisted tray menu state so we can rebuild the full menu when one field changes.
pub struct TrayMenuState {
    pub session_label: String,
    pub contexts: Vec<TrayContextItem>,
    pub end_enabled: bool,
}

impl Default for TrayMenuState {
    fn default() -> Self {
        Self {
            session_label: "No active session".into(),
            contexts: Vec::new(),
            end_enabled: false,
        }
    }
}

pub type TrayMenuStateHandle = Mutex<TrayMenuState>;

pub fn tray_menu_state() -> TrayMenuStateHandle {
    Mutex::new(TrayMenuState::default())
}

// Rebuilding the whole menu on each call is intentional: the tray menu is
// small and mutating specific items by id through Tauri 2's menu API requires
// main-thread round-trips with no meaningful gain.

#[tauri::command]
pub fn tray_set_session_label(app: AppHandle, label: String) -> AppResult<()> {
    let ms: tauri::State<TrayMenuStateHandle> = app.state();
    let mut guard = ms.lock().unwrap();
    guard.session_label = label;
    rebuild_menu(&app, &guard)
}

#[tauri::command]
pub fn tray_set_contexts(app: AppHandle, contexts: Vec<TrayContext>) -> AppResult<()> {
    let ms: tauri::State<TrayMenuStateHandle> = app.state();
    let mut guard = ms.lock().unwrap();
    guard.contexts = contexts
        .into_iter()
        .map(|c| TrayContextItem { id: c.id, name: c.name })
        .collect();
    rebuild_menu(&app, &guard)
}

#[tauri::command]
pub fn tray_set_end_enabled(app: AppHandle, enabled: bool) -> AppResult<()> {
    let ms: tauri::State<TrayMenuStateHandle> = app.state();
    let mut guard = ms.lock().unwrap();
    guard.end_enabled = enabled;
    rebuild_menu(&app, &guard)
}

fn rebuild_menu(app: &AppHandle, state: &TrayMenuState) -> AppResult<()> {
    let menu = build_menu(app, &state.session_label, &state.contexts, state.end_enabled)?;
    let tray_state: tauri::State<TrayState> = app.state();
    let tray_guard = tray_state.lock().unwrap();
    let tray = tray_guard
        .as_ref()
        .ok_or_else(|| AppError::TauriApi("tray not initialised".into()))?;
    tray.set_menu(Some(menu))
        .map_err(|e| AppError::TauriApi(e.to_string()))
}

/// Context item shape expected from JS.
#[derive(serde::Deserialize)]
pub struct TrayContext {
    pub id: String,
    pub name: String,
}
