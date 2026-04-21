import { runMigrations, seedIfEmpty } from "./db";
import { initHotkeyBootstrap } from "./hotkey-bootstrap";
import { initScheduler } from "./scheduler";
import { useContextStore } from "./stores/context-store";
import { useSessionStore } from "./stores/session-store";
import { useSettingsStore } from "./stores/settings-store";
import { initTrayBridge } from "./tray-bridge";

export async function runStartupHooks(): Promise<void> {
  await runMigrations();
  await seedIfEmpty();
  await Promise.all([
    useSettingsStore.getState().hydrate(),
    useContextStore.getState().load(),
    useSessionStore.getState().checkForRecoveryOnLaunch(),
  ]);
  initTrayBridge();
  void initHotkeyBootstrap();
  initScheduler();
}
