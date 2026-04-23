import { invoke } from "@tauri-apps/api/core";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

// Two notification paths, picked at runtime:
//
//   - Bundled build (.dmg install OR `tauri build` output): use the Tauri
//     plugin → UNUserNotificationCenter. Banner is attributed to Focrel's
//     bundle id, so clicking it brings Focrel to the front.
//
//   - Dev build (`tauri dev`, raw `target/debug/Focrel`): the plugin
//     silently drops posts because macOS refuses notifications from a
//     non-bundled process. Fall back to `osascript display notification`
//     via the `notify_system` Rust command — delivers reliably, but the
//     banner click opens Script Editor (the process osascript runs under),
//     which is a dev-only annoyance we accept.
//
// The detection call (`is_bundled_app`) is cached after first use since
// the executable location doesn't change during a session.

let bundledCache: boolean | null = null;

async function isBundled(): Promise<boolean> {
  if (bundledCache !== null) return bundledCache;
  try {
    bundledCache = await invoke<boolean>("is_bundled_app");
  } catch {
    // If the bridge call fails (shouldn't happen, but belt-and-braces),
    // assume dev and take the always-delivers osascript path.
    bundledCache = false;
  }
  return bundledCache;
}

export async function ensurePermission(): Promise<boolean> {
  // Only the bundled-plugin path requires a real permission grant.
  // osascript notifications don't ask and can't be denied.
  if (!(await isBundled())) return true;
  if (await isPermissionGranted()) return true;
  const result = await requestPermission();
  return result === "granted";
}

export async function notify(title: string, body: string): Promise<void> {
  try {
    if (await isBundled()) {
      const granted = await ensurePermission();
      if (!granted) {
        console.warn(
          "[focrel] notify skipped — macOS notification permission not granted.",
          { title },
        );
        return;
      }
      sendNotification({ title, body });
      console.log("[focrel] notify sent (plugin):", title);
      return;
    }
    await invoke("notify_system", { title, body });
    console.log("[focrel] notify sent (osascript):", title);
  } catch (err) {
    console.error("[focrel] notify failed:", err);
  }
}
