import { useSettingsStore } from "./stores/settings-store";

type ThemeMode = "system" | "light" | "dark";

let _systemMql: MediaQueryList | null = null;
let _systemListener: ((e: MediaQueryListEvent) => void) | null = null;

function removeSystemListener(): void {
  if (_systemMql !== null && _systemListener !== null) {
    _systemMql.removeEventListener("change", _systemListener);
    _systemListener = null;
  }
}

function installSystemListener(mql: MediaQueryList): void {
  removeSystemListener();
  _systemMql = mql;
  _systemListener = (e) => {
    document.documentElement.classList.toggle("dark", e.matches);
  };
  _systemMql.addEventListener("change", _systemListener);
}

export function applyTheme(mode: ThemeMode): void {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  if (mode === "system") {
    installSystemListener(mql);
    document.documentElement.classList.toggle("dark", mql.matches);
  } else if (mode === "light") {
    removeSystemListener();
    document.documentElement.classList.remove("dark");
  } else {
    removeSystemListener();
    document.documentElement.classList.add("dark");
  }
}

export function initSystemTheme(): void {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  document.documentElement.classList.toggle("dark", mql.matches);
  installSystemListener(mql);

  // Module-level subscription: theme tracks settings globally across all component lifetimes.
  useSettingsStore.subscribe((state) => {
    applyTheme(state.theme);
  });
}
