import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";

type Theme = "system" | "light" | "dark";

type Settings = {
  theme: Theme;
  autostart: boolean;
  globalHotkey: string | null;
};

type SettingsStore = Settings & {
  setTheme(theme: Theme): void;
  setAutostart(autostart: boolean): void;
  setGlobalHotkey(hotkey: string | null): void;
  hydrate(): Promise<void>;
  persist(): void;
};

const STORE_FILE = "settings.json";

let _persistTimer: ReturnType<typeof setTimeout> | null = null;

async function getStore() {
  return load(STORE_FILE);
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  theme: "system",
  autostart: false,
  globalHotkey: null,

  setTheme(theme) {
    set({ theme });
    get().persist();
  },

  setAutostart(autostart) {
    set({ autostart });
    get().persist();
  },

  setGlobalHotkey(globalHotkey) {
    set({ globalHotkey });
    get().persist();
  },

  async hydrate() {
    const store = await getStore();
    const theme = await store.get<Theme>("theme");
    const autostart = await store.get<boolean>("autostart");
    const globalHotkey = await store.get<string | null>("globalHotkey");
    set({
      theme: theme ?? "system",
      autostart: autostart ?? false,
      globalHotkey: globalHotkey ?? null,
    });
  },

  persist() {
    if (_persistTimer !== null) {
      clearTimeout(_persistTimer);
    }
    _persistTimer = setTimeout(async () => {
      _persistTimer = null;
      const { theme, autostart, globalHotkey } = get();
      const store = await getStore();
      await store.set("theme", theme);
      await store.set("autostart", autostart);
      await store.set("globalHotkey", globalHotkey);
      await store.save();
    }, 500);
  },
}));
