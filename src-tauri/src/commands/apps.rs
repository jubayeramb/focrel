use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunningApp {
    pub bundle_id: String,
    pub name: String,
}

#[tauri::command]
pub async fn quit_apps(bundle_ids: Vec<String>) -> AppResult<Vec<String>> {
    let mut succeeded = Vec::new();

    for id in &bundle_ids {
        let script = format!(r#"tell application id "{id}" to quit"#);
        let status = tokio::process::Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .status()
            .await
            .map_err(|e| AppError::AppQuitFailed(format!("failed to spawn osascript: {e}")))?;

        if status.success() {
            succeeded.push(id.clone());
        }
    }

    Ok(succeeded)
}

#[tauri::command]
pub async fn list_running_apps() -> AppResult<Vec<RunningApp>> {
    let output = tokio::process::Command::new("lsappinfo")
        .arg("list")
        .arg("-all")
        .output()
        .await
        .map_err(|e| AppError::Other(format!("failed to spawn lsappinfo: {e}")))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let apps = parse_lsappinfo(&stdout);
    Ok(apps)
}

fn parse_lsappinfo(output: &str) -> Vec<RunningApp> {
    // lsappinfo outputs blocks per app; lines of interest look like:
    //   "bundleID"="com.apple.Safari"
    //   "name"="Safari"
    // We collect pairs by scanning each block sequentially.
    let mut apps = Vec::new();
    let mut current_name: Option<String> = None;
    let mut current_bundle: Option<String> = None;

    for line in output.lines() {
        let line = line.trim();

        if let Some(val) = extract_quoted_value(line, "bundleID") {
            current_bundle = Some(val);
        } else if let Some(val) = extract_quoted_value(line, "name") {
            current_name = Some(val);
        }

        // A blank line separates app blocks; emit when we have both fields.
        if line.is_empty() {
            if let (Some(bundle_id), Some(name)) = (current_bundle.take(), current_name.take()) {
                if !bundle_id.is_empty() {
                    apps.push(RunningApp { bundle_id, name });
                }
            }
        }
    }

    // Flush last block (no trailing blank line).
    if let (Some(bundle_id), Some(name)) = (current_bundle, current_name) {
        if !bundle_id.is_empty() {
            apps.push(RunningApp { bundle_id, name });
        }
    }

    apps
}

fn extract_quoted_value<'a>(line: &'a str, key: &str) -> Option<String> {
    // Matches: "key"="value"
    let prefix = format!(r#""{key}"=""#);
    if let Some(rest) = line.strip_prefix(&prefix) {
        let val = rest.trim_end_matches('"');
        return Some(val.to_string());
    }
    None
}
