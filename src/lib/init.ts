import { runMigrations, seedIfEmpty } from "./db";
import { useContextStore } from "./stores/context-store";
import { useSessionStore } from "./stores/session-store";
import { useSettingsStore } from "./stores/settings-store";

export async function runStartupHooks(): Promise<void> {
  await runMigrations();
  await seedIfEmpty();
  await Promise.all([
    useSettingsStore.getState().hydrate(),
    useContextStore.getState().load(),
    useSessionStore.getState().checkForRecoveryOnLaunch(),
  ]);
}
