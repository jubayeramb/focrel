use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

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

#[tauri::command]
pub async fn list_installed_apps() -> AppResult<Vec<RunningApp>> {
    let home = std::env::var("HOME").unwrap_or_default();
    let search_dirs = [
        "/Applications".to_string(),
        "/Applications/Utilities".to_string(),
        "/System/Applications".to_string(),
        format!("{home}/Applications"),
    ];

    let mut seen: HashMap<String, RunningApp> = HashMap::new();

    for dir in &search_dirs {
        let dir_path = Path::new(dir);
        if !dir_path.exists() {
            continue;
        }
        let read_dir = match std::fs::read_dir(dir_path) {
            Ok(rd) => rd,
            Err(e) => {
                log::warn!("list_installed_apps: cannot read {dir}: {e}");
                continue;
            }
        };
        for entry in read_dir.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("app") {
                continue;
            }
            let plist_path = path.join("Contents/Info.plist");
            if !plist_path.exists() {
                continue;
            }
            match read_bundle_info(&plist_path, &path).await {
                Some(app) => {
                    seen.entry(app.bundle_id.clone()).or_insert(app);
                }
                None => {
                    log::warn!("list_installed_apps: skipping {:?} (no bundle id)", path);
                }
            }
        }
    }

    let mut apps: Vec<RunningApp> = seen.into_values().collect();
    apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(apps)
}

async fn read_bundle_info(plist_path: &Path, bundle_path: &Path) -> Option<RunningApp> {
    let output = tokio::process::Command::new("plutil")
        .args(["-convert", "json", "-o", "-"])
        .arg(plist_path)
        .output()
        .await
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let json: serde_json::Value = serde_json::from_slice(&output.stdout).ok()?;

    let bundle_id = json.get("CFBundleIdentifier")?.as_str()?.to_string();
    if bundle_id.is_empty() {
        return None;
    }

    let name = json
        .get("CFBundleName")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .or_else(|| {
            json.get("CFBundleDisplayName")
                .and_then(|v| v.as_str())
                .filter(|s| !s.is_empty())
        })
        .map(|s| s.to_string())
        .unwrap_or_else(|| {
            bundle_path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown")
                .to_string()
        });

    Some(RunningApp { bundle_id, name })
}
