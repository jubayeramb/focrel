import { invoke } from "@tauri-apps/api/core";

export const runShortcut = (name: string) =>
  invoke<void>("run_shortcut", { name });

export const listShortcuts = () => invoke<string[]>("list_shortcuts");

export const openShortcutsApp = () => invoke<void>("open_shortcuts_app");
