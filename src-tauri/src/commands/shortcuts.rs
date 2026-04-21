use crate::error::{AppError, AppResult};

#[tauri::command]
pub async fn run_shortcut(name: String) -> AppResult<()> {
    // `shortcuts run` always exits 0 regardless of outcome — treat as fire-and-forget.
    log::info!("running shortcut: {name}");
    tokio::process::Command::new("shortcuts")
        .arg("run")
        .arg(&name)
        .status()
        .await
        .map_err(|e| AppError::ShortcutFailed(format!("failed to spawn shortcuts: {e}")))?;
    Ok(())
}

#[tauri::command]
pub async fn list_shortcuts() -> AppResult<Vec<String>> {
    let output = tokio::process::Command::new("shortcuts")
        .arg("list")
        .output()
        .await
        .map_err(|e| AppError::ShortcutFailed(format!("failed to spawn shortcuts list: {e}")))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let names: Vec<String> = stdout
        .lines()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
        .collect();

    Ok(names)
}
