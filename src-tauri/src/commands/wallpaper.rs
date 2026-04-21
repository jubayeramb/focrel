use crate::error::{AppError, AppResult};

#[tauri::command]
pub fn set_wallpaper(path: String, screen: Option<usize>) -> AppResult<()> {
    // Touch the file mtime before setting — macOS caches wallpapers by path, so setting the
    // same path with a swapped file won't refresh unless the mtime changes.
    std::process::Command::new("touch")
        .arg(&path)
        .status()
        .map_err(|e| AppError::Wallpaper(format!("failed to touch mtime: {e}")))?;

    // TODO: the `wallpaper` crate does not expose a per-screen API yet.
    // `screen` index is accepted as a forward-compat hint but is ignored for now.
    // Track https://github.com/nickcoutsos/wallpaper-rs when they add per-screen support.
    let _ = screen;

    wallpaper::set_from_path(&path)
        .map_err(|e| AppError::Wallpaper(format!("set_from_path failed: {e}")))?;

    Ok(())
}

#[tauri::command]
pub fn get_wallpaper_all() -> AppResult<Vec<String>> {
    // The `wallpaper` crate's `get` goes through osascript on macOS and fails with
    // "osascript exited with status code 1" on macOS 14+ without a TCC automation
    // prompt. We don't want to block session-start on this — if we can't read the
    // original wallpaper, we return empty and accept that the crash reconciler
    // won't be able to restore it.
    match wallpaper::get() {
        Ok(current) => Ok(vec![current]),
        Err(e) => {
            log::warn!("wallpaper::get failed ({e}); returning empty list");
            Ok(Vec::new())
        }
    }
}
