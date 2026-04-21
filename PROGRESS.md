# Progress

**Project:** Focrel — local-first macOS context-switching focus app
**Plan:** `/Users/jubayer/.claude/plans/focus-app-for-mac-abstract-candy.md`
**Stack:** Tauri 2.0 + React 18 + TS + Vite + Tailwind + shadcn/ui + SQLite (Drizzle) + Rust (`wallpaper`, `rodio`)

**Current phase:** Week 1 done → Week 2 — Context CRUD
**Current task:** Smoke-test `pnpm tauri dev` boots, DB migrations apply, seed runs; then start Week 2 editor form.
**Next action:** Run `pnpm tauri dev` on the user's Mac to confirm the window opens and `focrel.db` initializes. On first green boot, the tech lead dispatches Week 2 agents for the context editor pickers (wallpaper/music/shortcut/app).

---

## Workflow Rules (mandatory — from plan §10)

1. **Start of every session:** read this file, find current `[~]` or first `[ ]`.
2. **Starting a task:** flip `[ ]` → `[~]`.
3. **Completing a task:** flip `[~]` → `[x]`, append one-line note (files touched, gotchas).
4. **New sub-task/blocker:** add to the list in the right phase.
5. **End of session:** exactly one `[~]` (or none at a clean phase boundary). Top "Next action" must reflect reality.
6. **Never touch `git config user.*`** — global identity is already set correctly.
7. **Never add `Co-Authored-By:` trailers** to commits.

---

## Orchestration (tech-lead notes)

**Parallelization strategy:**
- Track A (scaffold) runs first — it produces `package.json`, `tauri.conf.json`, `Cargo.toml`, configs, entry points. Everything else depends on it.
- Tracks B (Rust commands), C (DB), D (UI shell), E (TS OS wrappers) run **in parallel** after A. They touch disjoint file sets.
- Phase 2 (integration — stores wired to routes, session state machine, context editor UI) runs after B/C/D/E.

**Agent reports back → CTO (me) reviews diff → updates PROGRESS.md → dispatches next task.**

---

## Week 1 — Foundation

### Track A — Scaffold (blocking; unblocks B/C/D/E)
- [x] **A1** `package.json` — react 18, vite, tauri-cli v2, tauri-plugin-sql, drizzle-orm, zustand, @tanstack/react-router, @tanstack/react-query, date-fns, tailwind, biome, ulid
- [x] **A2** `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `biome.json`, `drizzle.config.ts`
- [x] **A3** `src/main.tsx`, `src/styles/globals.css` (Tailwind + CSS vars for light/dark); App.tsx added in Track D
- [x] **A4** `src-tauri/Cargo.toml` — tauri 2, wallpaper, rodio, tokio, serde, + plugins (sql/store/shell/fs/dialog/notification/autostart/global-shortcut)
- [x] **A5** `src-tauri/tauri.conf.json` — Focrel / com.focrel.app / Overlay titlebar / sql preload focrel.db
- [x] **A6** `src-tauri/src/main.rs` — thin entry delegating to `focrel_lib::run()`; lib.rs wired in Track B
- [x] **A7** `src-tauri/capabilities/default.json` — permissions for every plugin used
- [x] **A8** `src-tauri/build.rs` — standard tauri-build
- [x] **A9** `index.html` — Vite entry
- [x] **A10** `.gitignore` — node_modules, dist, target, .DS_Store
- [x] **A11** `pnpm install` — lockfile committed (pnpm 10.28.2)
- [ ] **A12** Smoke test `pnpm tauri dev` boots a blank window on user's Mac (manual verify)

### Track B — Rust OS Bridge
- [x] **B1** `src-tauri/src/error.rs` — unified `AppError` with `thiserror`, serializable for Tauri
- [x] **B2** `src-tauri/src/commands/wallpaper.rs` — `set_wallpaper(path, screen_index?)` + `get_wallpaper_all()` using `wallpaper` crate; unique-path mtime workaround per plan §3.1
- [x] **B3** `src-tauri/src/commands/audio.rs` — `rodio` on dedicated thread; commands: `audio_play(path)`, `audio_pause`, `audio_resume`, `audio_stop`, `audio_set_volume(f32)`, `audio_seek(secs)` — survives window-hide (plan §3.3)
- [x] **B4** `src-tauri/src/commands/shortcuts.rs` — `run_shortcut(name)` via `tokio::process::Command` (fire-and-forget; don't trust exit code — plan §3.2)
- [x] **B5** `src-tauri/src/commands/apps.rs` — `quit_apps(bundle_ids: Vec<String>)` via AppleScript `tell application id "…" to quit` or `osascript`; non-blocking
- [x] **B6** `src-tauri/src/session/snapshot.rs` — write/read/delete `active-session.json` in app data dir; reconcile-on-launch (plan §3.5)
- [x] **B7** Wire all commands + `RunEvent::ExitRequested` hook in `lib.rs`
- [x] **B8** Verify `cargo check --manifest-path src-tauri/Cargo.toml` passes

### Track C — Database (Drizzle + tauri-plugin-sql)
- [x] **C1** `src/lib/db/schema.ts` — Drizzle schema per plan §4 (contexts, tasks, sessions, session_tasks) with ULID pks
- [x] **C2** `src/lib/db/migrations/0001_init.sql` — initial schema DDL
- [x] **C3** `src/lib/db/client.ts` — Drizzle adapter over `tauri-plugin-sql`; single exported `db` instance + migration runner
- [x] **C4** `src/lib/db/seed.ts` — seed two stock contexts (Deep Work + Break), idempotent
- [x] **C5** `src/lib/utils/ulid.ts` — ULID generator (use `ulid` npm package)
- [x] **C6** Type-safe CRUD helpers: `contextsRepo`, `tasksRepo`, `sessionsRepo` in `src/lib/db/repos/*.ts`

### Track D — UI Shell (React + Tailwind + shadcn)
- [x] **D1** Hand-written shadcn/ui primitives (no CLI/Radix): button (5 variants, 4 sizes), card, input, label, textarea — `src/components/ui/`
- [x] **D2** `src/routes/home.tsx` — context picker grid (stub with empty state + ContextCard)
- [x] **D3** `src/routes/session.tsx` — active session view (timer placeholder, task list, music controls, End session)
- [x] **D4** `src/routes/contexts/index.tsx` — list + manage (stub with two placeholder items)
- [x] **D5** `src/routes/contexts/editor.tsx` — create/edit form (identity, environment, behavior sections)
- [x] **D6** `src/routes/settings.tsx` — settings (Theme, Autostart, Global Hotkey sections)
- [x] **D7** `src/components/titlebar.tsx` — custom draggable titlebar with 80px traffic-light spacer, breadcrumb, actions
- [x] **D8** `src/App.tsx` + `src/router.tsx` — TanStack Router memory history wiring all routes
- [x] **D9** `src/lib/theme.ts` — `initSystemTheme()` wired in `main.tsx` before ReactDOM.createRoot; also fixed pre-existing `vite.config.ts` type errors + added @types/node

### Track E — TS OS wrappers + Zustand stores
- [x] **E1** `src/lib/os/wallpaper.ts` — typed `invoke()` wrappers for Track B commands
- [x] **E2** `src/lib/os/audio.ts` — typed wrappers; volume clamped [0,1] at boundary
- [x] **E3** `src/lib/os/shortcuts.ts` — typed wrappers
- [x] **E4** `src/lib/os/apps.ts` — typed wrappers; snake_case → camelCase at boundary
- [x] **E5** `src/lib/stores/context-store.ts` — Zustand store backed by contextsRepo; refresh-after-mutate pattern
- [x] **E6** `src/lib/stores/session-store.ts` — full state machine (idle/starting/active/ending/recovered); snapshot-before-mutate + best-effort cleanup on failure
- [x] **E7** `src/lib/stores/settings-store.ts` — theme/autostart/hotkey; plugin-store backed; debounced 500ms persist
- [x] **E8** `src/lib/utils.ts` — cn() helper (authored by Track D, shared use)
- [x] `src/lib/os/snapshot.ts` — typed snapshot wrappers with explicit snake↔camelCase converters
- [x] `src/lib/os/index.ts` — namespace re-exports
- [x] `src/lib/init.ts` — `runStartupHooks()` called from main.tsx after `initSystemTheme()`

### Week 1 — Integration checkpoint
- [x] `pnpm typecheck` green across entire project
- [x] `cargo check --manifest-path src-tauri/Cargo.toml` green (one benign dead_code warn on `AudioDecode` variant)
- [x] All tracks committed with conventional-commit scopes (scaffold, rust, db, ui, stores+os, app)
- [ ] Manual smoke test: `pnpm tauri dev` opens the window, home route renders
- [ ] Call `runMigrations()` + `seedIfEmpty()` from startup — wire into `runStartupHooks()`
- [ ] TanStack Query `QueryClientProvider` at the app root (per tech-lead directive 2026-04-21)
- [ ] Replace placeholder icons in `src-tauri/icons/` before v0.1 build

---

## Week 2 — Context CRUD
- [ ] Build full context editor form (name/color/icon/wallpaper/music/shortcut/appsToQuit/duration)
- [ ] Wallpaper picker with file-picker dialog
- [ ] Music picker
- [ ] Shortcut name binder (list macOS Shortcuts via `shortcuts list` and pick one)
- [ ] App picker (running apps list, multi-select)
- [ ] Archive/unarchive flow
- [ ] Keyboard shortcuts within editor

## Week 3 — Tasks
- [ ] Per-context task list UI with drag-reorder (dnd-kit)
- [ ] Add/edit/complete/delete tasks
- [ ] Keyboard shortcuts (enter to add, cmd+k quick add, arrow nav)
- [ ] Due date + priority pickers
- [ ] Filters (done/open/all)

## Week 4 — Session Engine
- [ ] Pre-session task picker (choose which tasks to tackle)
- [ ] Active session view: timer + tasks + music controls + exit button
- [ ] Pomodoro-style break prompt at duration end
- [ ] End-session log (endReason, notes)
- [ ] Session history view per context

## Week 5 — OS Bridge wire-up
- [ ] Full snapshot-before-mutate flow in session-store start path
- [ ] Launch-time reconciler (stale session-file detection + restore + prompt)
- [ ] Wallpaper change verified across multiple screens + Spaces
- [ ] Audio survives `cmd-h` (manual test)
- [ ] Focus shortcut runs on session start, revert shortcut on end
- [ ] appsToQuit runs on start, doesn't nag if app not running
- [ ] `kill -9` recovery test passes

## Week 6 — Polish & Ship
- [ ] Onboarding flow: permissions explainer + template Shortcut install via `open -a Shortcuts`
- [ ] Notifications (session-start, break prompt, session-end)
- [ ] Global hotkey (cmd+shift+f → toggle quick-start)
- [ ] Menu-bar mode (tray icon + mini popover)
- [ ] Autostart
- [ ] Light/dark + custom accent from active context color
- [ ] Code-sign (Developer ID) + notarize + staple
- [ ] DMG build with Sparkle feed (auto-update)
- [ ] README + screenshots

## v1.1 — Deferred
- [ ] Network Extension content filter (Swift sidecar) for site blocking
- [ ] Pricing/licensing plan

---

## Task Log (append as agents complete)

<!-- Each line: `YYYY-MM-DD HH:MM — <TrackID> — <one-line result + files touched>` -->
2026-04-21 — A — Scaffold done: configs (ts/vite/tailwind/postcss/biome/drizzle), package.json, Cargo.toml, tauri.conf.json, capabilities/default.json, build.rs, main.rs, index.html, gitignore, globals.css. pnpm install green.
2026-04-21 04:30 — B — B1-B8 complete: error.rs, commands/{wallpaper,audio,shortcuts,apps,mod}.rs, session/{snapshot,mod}.rs, lib.rs; cargo check passes (1 expected dead_code warn on AudioDecode variant); placeholder icons/resources/dist created for generate_context! macro.
2026-04-21 — C — All C1–C6 complete: schema.ts, migrations/0001_init.sql, client.ts (migration runner + ?raw embed), repos/{contexts,tasks,sessions}.ts, seed.ts, index.ts, utils/ulid.ts, vite-env.d.ts (raw import types).
2026-04-21 — D — UI shell complete (D1–D9): src/lib/utils.ts, src/lib/theme.ts, src/components/ui/{button,card,input,label,textarea}.tsx, src/components/titlebar.tsx, src/routes/{root,home,session,settings}.tsx, src/routes/contexts/{index,editor}.tsx, src/router.tsx, src/App.tsx, src/main.tsx; also fixed vite.config.ts type errors + added @types/node; typecheck green, vite build green.
2026-04-21 — E — OS wrappers (wallpaper/audio/shortcuts/apps/snapshot) + Zustand stores (settings/context/session state machine) + init.ts; src/lib/* typecheck clean.
2026-04-21 — CTO — Integration: wired runStartupHooks() + initSystemTheme() into main.tsx; `pnpm typecheck` fully green; 6 scoped commits (scaffold, rust, db, ui, stores+os, app).
