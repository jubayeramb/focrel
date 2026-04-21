import { invoke } from "@tauri-apps/api/core";

export const setWallpaper = (path: string, screen?: number) =>
  invoke<void>("set_wallpaper", { path, screen });

export const getAllWallpapers = () => invoke<string[]>("get_wallpaper_all");
