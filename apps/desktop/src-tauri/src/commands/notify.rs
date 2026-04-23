use crate::error::{AppError, AppResult};

/// Reports whether the current process is running from inside a macOS `.app`
/// bundle. Used by the JS notification wrapper to decide between the
/// Tauri notification plugin (works only in a real bundle, but clicks route
/// back to Focrel) and the osascript fallback (works in dev, but clicks
/// route to Script Editor because that's the process posting).
///
/// Detection is a path-shape check — `/Applications/Focrel.app/Contents/MacOS/Focrel`
/// vs `target/debug/Focrel`. Simpler than introspecting the Info.plist and
/// accurate for both installed DMGs and `tauri build --debug` output.
#[tauri::command]
pub fn is_bundled_app() -> bool {
    std::env::current_exe()
        .ok()
        .map(|p| p.to_string_lossy().contains(".app/Contents/MacOS/"))
        .unwrap_or(false)
}

/// Displays a system notification via `osascript display notification`.
///
/// Why bypass `tauri-plugin-notification` in dev: macOS launches the raw
/// `target/debug/Focrel` binary rather than a registered `.app` bundle, so
/// `UNUserNotificationCenter` silently drops any notification we send through
/// the plugin — permission reads as granted, `sendNotification` returns OK,
/// but nothing ever appears in Notification Center. osascript runs out-of-
/// process and uses a path that actually delivers.
///
/// Caveat: osascript notifications are attributed to the osascript process
/// itself (which macOS resolves to Script Editor), so CLICKING the banner
/// opens Script Editor instead of Focrel. Acceptable trade-off in dev;
/// unacceptable in release, where the JS side switches to the Tauri
/// plugin path.
#[tauri::command]
pub async fn notify_system(title: String, body: String) -> AppResult<()> {
    // `display notification` only takes string literals — escape backslashes
    // and double quotes so `"Wrapping up"` or a title with a quote doesn't
    // blow up the AppleScript parser.
    let escape = |s: &str| s.replace('\\', "\\\\").replace('"', "\\\"");
    let script = format!(
        r#"display notification "{body}" with title "{title}""#,
        body = escape(&body),
        title = escape(&title),
    );

    let status = tokio::process::Command::new("osascript")
        .arg("-e")
        .arg(&script)
        .status()
        .await
        .map_err(|e| AppError::Other(format!("osascript spawn failed: {e}")))?;

    if !status.success() {
        log::warn!(
            "osascript display notification exited with {:?}",
            status.code()
        );
    }
    Ok(())
}
