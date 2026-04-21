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
    let current = wallpaper::get()
        .map_err(|e| AppError::Wallpaper(format!("get failed: {e}")))?;
    Ok(vec![current])
}
