mod commands;
mod error;
mod session;

use commands::apps::{list_installed_apps, list_running_apps, quit_apps};
use commands::audio::{audio_pause, audio_play, audio_resume, audio_seek, audio_set_volume, audio_stop};
use commands::shortcuts::{list_shortcuts, open_shortcuts_app, run_shortcut};
use commands::wallpaper::{get_wallpaper_all, set_wallpaper};
use session::snapshot::{snapshot_clear, snapshot_load, snapshot_reconcile, snapshot_save};
use tauri::{AppHandle, Emitter, Manager, RunEvent};
use tauri_plugin_autostart::MacosLauncher;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let handle: AppHandle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match snapshot_reconcile(handle.clone()).await {
                    Ok(Some(report)) => {
                        log::info!(
                            "launch reconciler: recovered session {}; wallpapers_restored={} focus_reverted={}",
                            report.session_id,
                            report.restored_wallpapers,
                            report.focus_reverted,
                        );
                        if let Some(window) = handle.get_webview_window("main") {
                            let _ = window.emit("focrel://session-recovered", &report);
                        }
                    }
                    Ok(None) => {}
                    Err(e) => {
                        log::warn!("launch reconciler failed: {e}");
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_wallpaper,
            get_wallpaper_all,
            audio_play,
            audio_pause,
            audio_resume,
            audio_stop,
            audio_set_volume,
            audio_seek,
            run_shortcut,
            list_shortcuts,
            open_shortcuts_app,
            quit_apps,
            list_running_apps,
            list_installed_apps,
            snapshot_save,
            snapshot_load,
            snapshot_clear,
            snapshot_reconcile,
        ])
        .build(tauri::generate_context!())
        .expect("failed to build Tauri application")
        .run(|_app, event| {
            if let RunEvent::ExitRequested { .. } = event {
                // Launch-time reconciler is the crash-safety net — no cleanup needed here.
                log::info!("exit requested; relying on launch-time reconciler for recovery");
            }
        });
}
