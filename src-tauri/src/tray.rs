use std::sync::Mutex;

use tauri::{
    menu::{MenuBuilder, MenuItem, MenuItemBuilder, Submenu, SubmenuBuilder},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager,
};

use crate::error::{AppError, AppResult};

pub type TrayState = Mutex<Option<tauri::tray::TrayIcon<tauri::Wry>>>;

pub fn tray_state() -> TrayState {
    Mutex::new(None)
}

/// Per-item handles kept alive so the JS-driven updaters
/// (`tray_set_session_label`, `tray_set_end_enabled`) can mutate the specific
/// menu items in place instead of rebuilding the whole menu. Rebuilding on the
/// 1 s label tick closed any open submenu, making "End session" unclickable.
pub struct TrayHandles {
    pub session_item: Mutex<Option<MenuItem<tauri::Wry>>>,
    pub end_item: Mutex<Option<MenuItem<tauri::Wry>>>,
    pub start_submenu: Mutex<Option<Submenu<tauri::Wry>>>,
}

pub fn tray_handles() -> TrayHandles {
    TrayHandles {
        session_item: Mutex::new(None),
        end_item: Mutex::new(None),
        start_submenu: Mutex::new(None),
    }
}

#[derive(Clone, serde::Deserialize)]
pub struct TrayContextItem {
    pub id: String,
    pub name: String,
}

/// Replaces the items inside the "Start session" submenu in place — the
/// submenu itself stays mounted in the root menu so macOS doesn't close it.
pub fn set_submenu_contexts(
    app: &AppHandle,
    submenu: &Submenu<tauri::Wry>,
    contexts: &[TrayContextItem],
) -> AppResult<()> {
    // Tauri 2's Submenu exposes items() + remove(&item); clear everything first
    // then append fresh items for the current context set.
    let existing = submenu
        .items()
        .map_err(|e| AppError::TauriApi(e.to_string()))?;
    for item in existing {
        submenu
            .remove(&item)
            .map_err(|e| AppError::TauriApi(e.to_string()))?;
    }

    if contexts.is_empty() {
        let placeholder = MenuItemBuilder::with_id("start-session-empty", "No contexts yet")
            .enabled(false)
            .build(app)
            .map_err(|e| AppError::TauriApi(e.to_string()))?;
        submenu
            .append(&placeholder)
            .map_err(|e| AppError::TauriApi(e.to_string()))?;
        return Ok(());
    }

    for ctx in contexts {
        let item_id = format!("start-session-{}", ctx.id);
        let item = MenuItemBuilder::with_id(item_id, &ctx.name)
            .build(app)
            .map_err(|e| AppError::TauriApi(e.to_string()))?;
        submenu
            .append(&item)
            .map_err(|e| AppError::TauriApi(e.to_string()))?;
    }
    Ok(())
}

pub fn init_tray(app: &AppHandle) -> tauri::Result<()> {
    // Embed the tray icon bytes at compile time. Reading from disk at runtime
    // and falling back to an empty-bytes zero-width placeholder crashed muda
    // later in the event loop (`panicked... ZeroWidth`). Embedding guarantees
    // valid bytes every launch.
    const TRAY_ICON_BYTES: &[u8] = include_bytes!("../icons/tray-icon.png");
    let icon = tauri::image::Image::from_bytes(TRAY_ICON_BYTES)
        .map_err(|e| tauri::Error::Anyhow(anyhow::anyhow!("tray icon decode failed: {e}")))?;

    // Build items once. Keep handles so we can mutate text / enabled later.
    let header = MenuItemBuilder::with_id("focrel-header", "Focrel")
        .enabled(false)
        .build(app)?;
    let session_item = MenuItemBuilder::with_id("current-session", "No active session")
        .enabled(false)
        .build(app)?;

    let start_submenu_placeholder =
        MenuItemBuilder::with_id("start-session-empty", "No contexts yet")
            .enabled(false)
            .build(app)?;
    let start_submenu = SubmenuBuilder::new(app, "Start session")
        .item(&start_submenu_placeholder)
        .build()?;

    let end_item = MenuItemBuilder::with_id("end-session", "End session")
        .enabled(false)
        .build(app)?;
    let open_item = MenuItemBuilder::with_id("open-focrel", "Open Focrel").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&header)
        .item(&session_item)
        .item(&start_submenu)
        .item(&end_item)
        .separator()
        .item(&open_item)
        .item(&quit_item)
        .build()?;

    let tray = TrayIconBuilder::with_id("focrel-tray")
        .icon(icon)
        .icon_as_template(false)
        .menu(&menu)
        .on_menu_event(|app, event| {
            let id = event.id.as_ref();
            match id {
                "open-focrel" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "quit" => app.exit(0),
                "end-session" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("focrel://tray-end-session", ());
                    }
                }
                other if other.starts_with("start-session-") && other != "start-session-empty" => {
                    let context_id = &other["start-session-".len()..];
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit(
                            "focrel://tray-start-session",
                            serde_json::json!({ "contextId": context_id }),
                        );
                    }
                }
                _ => {}
            }
        })
        .build(app)?;

    // Stash everything. Clones are Arc-backed so the originals in the menu
    // and our stored copies refer to the same underlying items.
    let tray_slot: tauri::State<TrayState> = app.state();
    *tray_slot.lock().unwrap() = Some(tray);

    let handles: tauri::State<TrayHandles> = app.state();
    *handles.session_item.lock().unwrap() = Some(session_item);
    *handles.end_item.lock().unwrap() = Some(end_item);
    *handles.start_submenu.lock().unwrap() = Some(start_submenu);

    Ok(())
}
