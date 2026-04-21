import { useEffect } from "react";

export function useHotkeyNavigation(onActivate: () => void): void {
  useEffect(() => {
    const listener = () => onActivate();
    window.addEventListener("focrel:hotkey-activate", listener);
    return () => window.removeEventListener("focrel:hotkey-activate", listener);
  }, [onActivate]);
}
