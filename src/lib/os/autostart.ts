import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

export const autostart = {
  enable,
  disable,
  isEnabled,
  async sync(desired: boolean): Promise<void> {
    const current = await isEnabled();
    if (desired && !current) await enable();
    if (!desired && current) await disable();
  },
};
