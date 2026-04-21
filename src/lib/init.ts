import { useSettingsStore } from "./stores/settings-store";
import { useSessionStore } from "./stores/session-store";

export async function runStartupHooks(): Promise<void> {
  await useSettingsStore.getState().hydrate();
  await useSessionStore.getState().checkForRecoveryOnLaunch();
}
