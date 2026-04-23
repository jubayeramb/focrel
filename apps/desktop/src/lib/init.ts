import { runMigrations, seedIfEmpty } from "./db";
import { initHotkeyBootstrap } from "./hotkey-bootstrap";
import { ensurePermission as ensureNotifyPermission } from "./os/notifications";
import { initScheduler } from "./scheduler";
import { initSessionTimeoutWatcher } from "./session-timeout-watcher";
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
  initSessionTimeoutWatcher();
  // Kick off the notification permission prompt on first launch instead of
  // lazily at session-end — if the user is AFK when the timer hits zero and
  // permission was never granted, `notify` would silently no-op. Fire-and-
  // forget: we don't block startup on the outcome.
  void ensureNotifyPermission().catch((err) =>
    console.warn("[focrel] notification permission probe failed:", err),
  );
}
