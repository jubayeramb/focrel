import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateSummary = {
  available: boolean;
  version: string;
  currentVersion: string;
  notes: string;
  date: string | null;
};

export type UpdateProgress =
  | { kind: "started"; contentLength: number | null }
  | { kind: "progress"; downloaded: number; contentLength: number | null }
  | { kind: "finished" };

// Caches the Update handle between `checkForUpdates` and `runUpdate` so the
// caller doesn't have to hold the ref themselves — the store passes the
// summary around and the download step looks up by version.
let pendingUpdate: Update | null = null;

// Wraps `@tauri-apps/plugin-updater`'s `check()` so the rest of the app deals
// in a plain JSON shape instead of the plugin's Update instance. Returns a
// summary describing whether an update is available; the heavy Update handle
// is squirreled away at module scope so `runUpdate` can pick it up without
// threading it through React state.
export async function checkForUpdates(): Promise<UpdateSummary> {
  const update = await check();
  pendingUpdate = update;
  if (!update) {
    return {
      available: false,
      version: "",
      currentVersion: "",
      notes: "",
      date: null,
    };
  }
  return {
    available: true,
    version: update.version,
    currentVersion: update.currentVersion,
    notes: update.body ?? "",
    date: update.date ?? null,
  };
}

// Downloads + installs the previously-checked update and relaunches the app.
// Must be called after `checkForUpdates` returned `available: true` — we
// hold onto the Update handle because the plugin tightly couples the
// metadata query and the install step.
export async function runUpdate(
  onProgress?: (p: UpdateProgress) => void,
): Promise<void> {
  if (!pendingUpdate) {
    throw new Error(
      "runUpdate called before checkForUpdates produced an available update",
    );
  }

  let downloaded = 0;
  let total: number | null = null;

  await pendingUpdate.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started": {
        total = event.data.contentLength ?? null;
        onProgress?.({ kind: "started", contentLength: total });
        break;
      }
      case "Progress": {
        downloaded += event.data.chunkLength;
        onProgress?.({ kind: "progress", downloaded, contentLength: total });
        break;
      }
      case "Finished": {
        onProgress?.({ kind: "finished" });
        break;
      }
    }
  });

  // Relaunch so the new binary takes over; without this the user would keep
  // running the old in-memory app until next manual start.
  await relaunch();
}
