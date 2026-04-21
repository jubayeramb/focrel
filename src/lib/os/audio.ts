import { invoke } from "@tauri-apps/api/core";

function clampVolume(volume: number): number {
  return Math.min(1, Math.max(0, volume));
}

export const play = (path: string, loopForever = false) =>
  invoke<void>("audio_play", { path, loopForever });

export const pause = () => invoke<void>("audio_pause");

export const resume = () => invoke<void>("audio_resume");

export const stop = () => invoke<void>("audio_stop");

export const setVolume = (volume: number) =>
  invoke<void>("audio_set_volume", { volume: clampVolume(volume) });

export const seek = (seconds: number) => invoke<void>("audio_seek", { seconds });
