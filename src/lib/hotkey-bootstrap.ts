import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { registerHotkey, unregisterHotkey } from "./os/hotkey";
import { useSettingsStore } from "./stores/settings-store";

const DEFAULT_HOTKEY = "CmdOrControl+Shift+F";

async function activate(): Promise<void> {
  const win = getCurrentWebviewWindow();
  await win.show();
  await win.setFocus();
  window.dispatchEvent(new CustomEvent("focrel:hotkey-activate"));
}

export async function initHotkeyBootstrap(): Promise<void> {
  let registeredKey: string | null = null;

  async function applyHotkey(key: string | null): Promise<void> {
    const next = key ?? DEFAULT_HOTKEY;

    if (registeredKey !== null && registeredKey !== next) {
      await unregisterHotkey(registeredKey);
      registeredKey = null;
    }

    if (registeredKey !== next) {
      try {
        await registerHotkey(next, () => {
          void activate();
        });
        registeredKey = next;
      } catch (err) {
        console.warn("[hotkey-bootstrap] failed to register", next, err);
      }
    }
  }

  const initial = useSettingsStore.getState().globalHotkey;
  await applyHotkey(initial);

  // Re-register whenever globalHotkey changes in settings.
  useSettingsStore.subscribe((state, prev) => {
    if (state.globalHotkey !== prev.globalHotkey) {
      void applyHotkey(state.globalHotkey);
    }
  });
}
