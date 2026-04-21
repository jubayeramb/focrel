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
  if (await ensurePermission()) sendNotification({ title, body });
}
