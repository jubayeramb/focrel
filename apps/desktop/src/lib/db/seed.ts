import { getDb } from "./client";
import { contextsRepo } from "./repos/contexts";

export async function seedIfEmpty(): Promise<void> {
  const db = await getDb();
  const rows = await db.select<Array<{ count: number }>>(
    "SELECT COUNT(*) as count FROM contexts",
  );

  if (rows[0].count > 0) {
    return;
  }

  await contextsRepo.create({
    name: "Deep Work",
    description: "Single-task, no interruptions",
    color: "#7c3aed",
    icon: "brain",
    wallpaperPath: null,
    musicPath: null,
    shortcutName: null,
    revertShortcutName: null,
    appsToQuit: "[]",
    appsToStart: "[]",
    quitAllApps: 0,
    blockedSites: "[]",
    defaultDurationMinutes: 50,
    archivedAt: null,
  });

  await contextsRepo.create({
    name: "Break",
    description: "Rest, hydrate, walk",
    color: "#06b6d4",
    icon: "coffee",
    wallpaperPath: null,
    musicPath: null,
    shortcutName: null,
    revertShortcutName: null,
    appsToQuit: "[]",
    appsToStart: "[]",
    quitAllApps: 0,
    blockedSites: "[]",
    defaultDurationMinutes: 10,
    archivedAt: null,
  });
}
