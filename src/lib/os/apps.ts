import { invoke } from "@tauri-apps/api/core";

export type RunningApp = {
  bundleId: string;
  name: string;
};

export const quitApps = (bundleIds: string[]) =>
  invoke<string[]>("quit_apps", { bundleIds });

export const listRunningApps = async (): Promise<RunningApp[]> => {
  const raw = await invoke<Array<{ bundle_id: string; name: string }>>(
    "list_running_apps",
  );
  return raw.map((app) => ({ bundleId: app.bundle_id, name: app.name }));
};

export const listInstalledApps = () =>
  invoke<{ bundle_id: string; name: string }[]>("list_installed_apps").then(
    (rows) => rows.map((row) => ({ bundleId: row.bundle_id, name: row.name })),
  );
