import { isRegistered, register, unregister } from "@tauri-apps/plugin-global-shortcut";

export type HotkeyHandler = () => void;

export async function registerHotkey(key: string, handler: HotkeyHandler): Promise<void> {
  if (await isRegistered(key)) await unregister(key);
  await register(key, handler);
}

export async function unregisterHotkey(key: string): Promise<void> {
  if (await isRegistered(key)) await unregister(key);
}
