import { invoke } from "@tauri-apps/api/core";

// Thin wrapper over the Rust `notify_system` command, which shells out to
// `osascript display notification`. We intentionally do NOT use
// `@tauri-apps/plugin-notification` here — in `tauri dev` the notification
// plugin reports permission granted and returns OK from `sendNotification`
// but nothing ever appears in macOS Notification Center, because the raw
// `target/debug/Focrel` binary isn't a registered .app bundle. The
// osascript path delivers reliably in both dev and release.
//
// `ensurePermission` is kept for callers that still want to probe status
// (e.g. the startup hook), but always resolves true — osascript doesn't
// require any of the UNUserNotificationCenter grants.
export async function ensurePermission(): Promise<boolean> {
  return true;
}

export async function notify(title: string, body: string): Promise<void> {
  try {
    await invoke("notify_system", { title, body });
    console.log("[focrel] notify sent:", title);
  } catch (err) {
    console.error("[focrel] notify failed:", err);
  }
}
