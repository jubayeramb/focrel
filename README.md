# Focrel

Local-first macOS context-switching focus app.

Focus is a feeling. Focrel makes it a place. Each context — Deep Work, Break, Admin — binds its own wallpaper, music, to-do list, and macOS Focus mode. Switch the context, switch the realm.

## Status
MVP — weeks 1–4 of 6 shipped; polish & distribution underway.

## Quick start (dev)
Prereqs: macOS 13+, pnpm 10, Rust 1.77+, Xcode command-line tools.
```
pnpm install
pnpm tauri dev
```

## Architecture (one screen)
- Frontend: React 18 + TS + Vite + Tailwind + shadcn-style primitives. Routing via TanStack Router (memory history). State via Zustand. Data caching via TanStack Query.
- Data: SQLite through `tauri-plugin-sql`; schema defined via Drizzle for type inference; hand-written SQL through the plugin at runtime (no official Drizzle driver for tauri-plugin-sql).
- OS bridge (Rust): the `wallpaper` crate for NSWorkspace calls (no AppleScript / TCC prompts), `rodio` on a dedicated thread for background audio (survives window hide), `shortcuts run` for macOS Focus mode (only sanctioned path), `osascript` for quit-apps.
- Crash-safety: every session writes `active-session.json` before mutating system state. On launch, the reconciler restores original wallpaper and runs a user-configured revert Shortcut.

## Directory map
```
src/
  components/       UI (ui/ primitives, pickers/, session/, context-card, task-*, titlebar)
  lib/              db/ (schema, client, repos, seed), os/ (invoke wrappers), stores/ (zustand), hooks/, theme, init, utils
  routes/           TanStack Router declarative routes (home, session, contexts/, settings, onboarding, history)
  router.tsx        route tree + memory history
src-tauri/
  src/              Rust entry + commands/ (wallpaper, audio, shortcuts, apps) + session/snapshot + error
  Cargo.toml        tauri 2, wallpaper, rodio, plugin-* crates
  tauri.conf.json   bundle config; sql preload focrel.db
```

## What's left for v0.1 ship
Manual Mac smoke tests (dev-boot, multi-screen wallpaper, audio-over-hide, kill-9 recovery). Real icons + code signing + notarization + DMG + Sparkle.

## License
TBD.
