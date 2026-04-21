import { create } from "zustand";
import { load } from "@tauri-apps/plugin-store";

type Theme = "system" | "light" | "dark";

type Settings = {
  theme: Theme;
  autostart: boolean;
  globalHotkey: string | null;
  onboardingCompleted: boolean;
  sidebarCollapsed: boolean;
};

type SettingsStore = Settings & {
  hotkeyError: string | null;
  hydrated: boolean;
  setTheme(theme: Theme): void;
  setAutostart(autostart: boolean): void;
  setGlobalHotkey(hotkey: string | null): void;
  markOnboardingComplete(): void;
  resetOnboarding(): void;
  clearHotkeyError(): void;
  toggleSidebar(): void;
  setSidebarCollapsed(collapsed: boolean): void;
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
  onboardingCompleted: false,
  sidebarCollapsed: false,
  hotkeyError: null,
  hydrated: false,

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

  markOnboardingComplete() {
    set({ onboardingCompleted: true });
    get().persist();
  },

  resetOnboarding() {
    set({ onboardingCompleted: false });
    get().persist();
  },

  clearHotkeyError() {
    set({ hotkeyError: null });
  },

  toggleSidebar() {
    set({ sidebarCollapsed: !get().sidebarCollapsed });
    get().persist();
  },

  setSidebarCollapsed(sidebarCollapsed) {
    set({ sidebarCollapsed });
    get().persist();
  },

  async hydrate() {
    const store = await getStore();
    const theme = await store.get<Theme>("theme");
    const autostart = await store.get<boolean>("autostart");
    const globalHotkey = await store.get<string | null>("globalHotkey");
    const onboardingCompleted = await store.get<boolean>("onboardingCompleted");
    const sidebarCollapsed = await store.get<boolean>("sidebarCollapsed");
    set({
      theme: theme ?? "system",
      autostart: autostart ?? false,
      globalHotkey: globalHotkey ?? null,
      onboardingCompleted: onboardingCompleted ?? false,
      sidebarCollapsed: sidebarCollapsed ?? false,
      hydrated: true,
    });
  },

  persist() {
    if (_persistTimer !== null) {
      clearTimeout(_persistTimer);
    }
    _persistTimer = setTimeout(async () => {
      _persistTimer = null;
      const { theme, autostart, globalHotkey, onboardingCompleted, sidebarCollapsed } = get();
      const store = await getStore();
      await store.set("theme", theme);
      await store.set("autostart", autostart);
      await store.set("globalHotkey", globalHotkey);
      await store.set("onboardingCompleted", onboardingCompleted);
      await store.set("sidebarCollapsed", sidebarCollapsed);
      await store.save();
    }, 500);
  },
}));
