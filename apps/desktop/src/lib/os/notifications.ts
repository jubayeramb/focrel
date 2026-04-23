import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

export async function ensurePermission(): Promise<boolean> {
  if (await isPermissionGranted()) return true;
  const result = await requestPermission();
  return result === "granted";
}

export async function notify(title: string, body: string): Promise<void> {
  try {
    const granted = await ensurePermission();
    if (!granted) {
      console.warn(
        "[focrel] notify skipped — macOS notification permission not granted.",
        { title },
      );
      return;
    }
    sendNotification({ title, body });
    console.log("[focrel] notify sent:", title);
  } catch (err) {
    console.error("[focrel] notify failed:", err);
  }
}
