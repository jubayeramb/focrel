use crate::error::{AppError, AppResult};

/// Displays a system notification via `osascript display notification`.
///
/// Why bypass `tauri-plugin-notification`: in `tauri dev`, macOS launches the
/// raw `target/debug/Focrel` binary rather than a registered `.app` bundle, so
/// `UNUserNotificationCenter` silently drops any notification we send through
/// the plugin — permission reads as granted, `sendNotification` returns OK,
/// but nothing ever appears in Notification Center. osascript runs out-of-
/// process and uses a path that actually delivers in both dev and release.
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
