use std::sync::Mutex;

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager,
};

use crate::error::{AppError, AppResult};

pub type TrayState = Mutex<Option<tauri::tray::TrayIcon<tauri::Wry>>>;

pub fn tray_state() -> TrayState {
    Mutex::new(None)
}

#[derive(Clone, serde::Deserialize)]
pub struct TrayContextItem {
    pub id: String,
    pub name: String,
}

/// Builds the full tray menu from the current logical state.  Called both at
/// startup and on every dynamic update — the menu is small so a full rebuild
/// is cleaner than per-item mutation through Tauri 2's main-thread wrappers.
pub fn build_menu(
    app: &AppHandle,
    session_label: &str,
    contexts: &[TrayContextItem],
    end_enabled: bool,
) -> AppResult<tauri::menu::Menu<tauri::Wry>> {
    let header = MenuItemBuilder::with_id("focrel-header", "Focrel")
        .enabled(false)
        .build(app)
        .map_err(|e| AppError::TauriApi(e.to_string()))?;

    let session_item = MenuItemBuilder::with_id("current-session", session_label)
        .enabled(false)
        .build(app)
        .map_err(|e| AppError::TauriApi(e.to_string()))?;

    let mut start_submenu_builder = SubmenuBuilder::new(app, "Start session");
    for ctx in contexts {
        let item_id = format!("start-session-{}", ctx.id);
        let item = MenuItemBuilder::with_id(item_id, &ctx.name)
            .build(app)
            .map_err(|e| AppError::TauriApi(e.to_string()))?;
        start_submenu_builder = start_submenu_builder.item(&item);
    }
    let start_submenu = start_submenu_builder
        .build()
        .map_err(|e| AppError::TauriApi(e.to_string()))?;

    let end_item = MenuItemBuilder::with_id("end-session", "End session")
        .enabled(end_enabled)
        .build(app)
        .map_err(|e| AppError::TauriApi(e.to_string()))?;

    let open_item = MenuItemBuilder::with_id("open-focrel", "Open Focrel")
        .build(app)
        .map_err(|e| AppError::TauriApi(e.to_string()))?;

    let quit_item = MenuItemBuilder::with_id("quit", "Quit")
        .build(app)
        .map_err(|e| AppError::TauriApi(e.to_string()))?;

    MenuBuilder::new(app)
        .item(&header)
        .item(&session_item)
        .item(&start_submenu)
        .item(&end_item)
        .separator()
        .item(&open_item)
        .item(&quit_item)
        .build()
        .map_err(|e| AppError::TauriApi(e.to_string()))
}

pub fn init_tray(app: &AppHandle) -> tauri::Result<()> {
    // During development the icon lives in the manifest directory; in a bundle
    // it is placed in the resource directory by the bundler.
    let dev_path = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("icons")
        .join("tray-icon.png");

    let icon = if dev_path.exists() {
        tauri::image::Image::from_path(&dev_path).unwrap_or_else(|_| tauri::image::Image::new(&[], 0, 0))
    } else {
        app.path()
            .resolve("icons/tray-icon.png", tauri::path::BaseDirectory::Resource)
            .ok()
            .and_then(|p| tauri::image::Image::from_path(p).ok())
            .unwrap_or_else(|| tauri::image::Image::new(&[], 0, 0))
    };

    let menu = build_menu(app, "No active session", &[], false)
        .map_err(|e| tauri::Error::Anyhow(e.into()))?;

    let tray = TrayIconBuilder::with_id("focrel-tray")
        .icon(icon)
        // Our icon is a full-color gradient squircle, not a monochrome
        // glyph. `icon_as_template(true)` would flatten it to a white/black
        // mask (macOS's menubar template style) — that looked like a blank
        // white square. Render as color instead.
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
                "quit" => {
                    app.exit(0);
                }
                "end-session" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("focrel://tray-end-session", ());
                    }
                }
                other if other.starts_with("start-session-") => {
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

    let state: tauri::State<TrayState> = app.state();
    *state.lock().unwrap() = Some(tray);

    Ok(())
}
