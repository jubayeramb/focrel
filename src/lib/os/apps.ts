import { invoke } from "@tauri-apps/api/core";

export type RunningApp = {
  bundleId: string;
  name: string;
  bundlePath?: string;
};

export const quitApps = (bundleIds: string[]) =>
  invoke<string[]>("quit_apps", { bundleIds });

type RawApp = { bundle_id: string; name: string; bundle_path?: string };

export const listRunningApps = async (): Promise<RunningApp[]> => {
  const raw = await invoke<RawApp[]>("list_running_apps");
  return raw.map((app) => ({
    bundleId: app.bundle_id,
    name: app.name,
    bundlePath: app.bundle_path,
  }));
};

export const listInstalledApps = async (): Promise<RunningApp[]> => {
  const raw = await invoke<RawApp[]>("list_installed_apps");
  return raw.map((app) => ({
    bundleId: app.bundle_id,
    name: app.name,
    bundlePath: app.bundle_path,
  }));
};

export const getAppIcon = (bundleId: string, bundlePath: string) =>
  invoke<string | null>("get_app_icon", { bundleId, bundlePath });
