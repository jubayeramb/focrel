# Progress

**Project:** Focrel — local-first macOS context-switching focus app
**Plan:** `/Users/jubayer/.claude/plans/focus-app-for-mac-abstract-candy.md`
**Stack:** Tauri 2.0 + React 18 + TS + Vite + Tailwind + shadcn/ui + SQLite (Drizzle) + Rust (`wallpaper`, `rodio`)

**Current phase:** Week 4 done → Week 5 (code already shipped in Week 1 Track E; only manual tests remain) → Week 6 — Polish & Ship
**Current task:** Dispatch Week 6 — onboarding, notifications, global hotkey, autostart, theme/accent.
**Next action:** Split Week 6 into 2 parallel tracks — Track M (onboarding + notifications + accent + README draft), Track N (global hotkey + autostart + settings UI + theme override).

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
- [x] `pnpm build` green — 320 kB JS / 18 kB CSS (pre-minify on prod)
- [x] `cargo check --manifest-path src-tauri/Cargo.toml` green (one benign dead_code warn on `AudioDecode` variant)
- [x] All tracks committed with conventional-commit scopes (scaffold, rust, db, ui, stores+os, app)
- [x] `runMigrations()` + `seedIfEmpty()` called from `runStartupHooks()`
- [x] TanStack Query `QueryClientProvider` at the app root
- [ ] Manual smoke test on user's Mac: `pnpm tauri dev` opens the window, home route renders, `focrel.db` initializes in app data dir **(user-gated)**
- [ ] Replace placeholder icons in `src-tauri/icons/` before v0.1 build **(needs source art)**

---

## Week 2 — Context CRUD

**Picker prop contract (shared by all pickers — for parallel-agent isolation):**
```ts
type BasicPicker<T> = { value: T | null; onChange: (v: T | null) => void; disabled?: boolean };
type MultiPicker<T> = { value: T[]; onChange: (v: T[]) => void; disabled?: boolean };
// WallpaperPicker / MusicPicker: BasicPicker<string>  (absolute file path)
// ShortcutPicker:               BasicPicker<string>  (macOS Shortcut name)
// ColorPicker:                  BasicPicker<string>  (hex like "#7c3aed")
// IconPicker:                   BasicPicker<string>  (lucide icon name)
// AppPicker:                    MultiPicker<string>  (bundle ids)
```

### Track F — Pickers (src/components/pickers/*)
- [x] **F1** `wallpaper-picker.tsx` — file-open dialog via `@tauri-apps/plugin-dialog` filtered to images; shows thumbnail + path
- [x] **F2** `music-picker.tsx` — file-open dialog filtered to audio; shows filename
- [x] **F3** `shortcut-picker.tsx` — calls `shortcuts.listShortcuts()`, select-like combobox; allows typed custom name
- [x] **F4** `app-picker.tsx` — calls `apps.listRunningApps()`, multi-select checklist with search filter
- [x] **F5** `color-picker.tsx` — preset swatches (8 tailwind-ish hues) + hex input
- [x] **F6** `icon-picker.tsx` — grid of ~24 curated lucide icons (Brain, Coffee, Focus, Target, Book, …)

### Track G — Context editor form (src/routes/contexts/editor.tsx)
- [x] **G1** Route loader fetches context by id (edit mode) from `contextsRepo.get`
- [x] **G2** Form state via local `useState` or a simple form hook; no heavy form lib
- [x] **G3** Identity section: name, description, color (F5), icon (F6)
- [x] **G4** Environment section: wallpaper (F1), music (F2), shortcut (F3), revertShortcut (F3 again)
- [x] **G5** Behavior section: default duration minutes, appsToQuit (F4)
- [x] **G6** Save → `contextStore.create/update`; Cancel → back to /contexts
- [x] **G7** Keyboard shortcuts: `cmd+enter` save, `esc` cancel
- [x] **G8** Validation: non-empty name, valid hex color; inline errors

### Track H — Contexts list + dashboard (src/routes/contexts/index.tsx + home.tsx)
- [x] **H1** List page: loads `useContextStore.contexts`, cards with icon/name/color/duration
- [x] **H2** Row actions: Edit, Archive, Unarchive, Delete (with confirm)
- [x] **H3** Toggle "show archived"
- [x] **H4** Empty state with "Create first context" button
- [x] **H5** Home page: same grid but clicking a context navigates to `/session?contextId=…`

## Week 3 — Tasks

### Track I — Task list UI + CRUD + keyboard
- [x] **I1** `src/lib/stores/task-store.ts` — Zustand store backed by `tasksRepo`; `loadByContext(contextId)`, `create`, `update`, `setStatus`, `remove`, `reorder(contextId, orderedIds)` with optimistic update; `byContext` keyed map preserves multi-context state
- [x] **I2** `src/components/task-list.tsx` — task list for a context; renders `TaskAddInput` + `<ul>` of `<li data-task-id>` + `TaskRow`; `statusFilter` prop; keyboard nav on root div
- [x] **I3** `src/components/task-row.tsx` — checkbox status toggle, inline double-click title edit (blur-to-save, empty-to-delete), priority dot, due-date badge via date-fns, hover delete button, `focused` ring
- [x] **I4** `src/components/task-add-input.tsx` — controlled input; enter adds task, esc blurs; `forwardRef + useImperativeHandle` exposes `focus()` for cmd+k
- [x] **I5** Keyboard shortcuts inside the list: `enter`/`cmd+k` to focus add input, `arrow up/down` navigate rows, `space` toggles completion, `backspace` deletes focused row (with confirm); input/textarea targets skipped
- [x] **I6** Wire `TaskList` into `src/routes/contexts/editor.tsx` Tasks section (below Behavior) — guarded by `{contextId &&}`

### Track J — Drag-reorder + pickers + filters
- [x] **J1** Add `@dnd-kit/core` + `@dnd-kit/sortable` to package.json; install
- [x] **J2** `src/components/pickers/due-date-picker.tsx` — BasicPicker<number | null> (unix millis); native `<input type="datetime-local">` wrapped with clear button
- [x] **J3** `src/components/pickers/priority-picker.tsx` — BasicPicker<number> (0..3); 4 pill buttons (None / Low / Normal / High)
- [x] **J4** Wrap `TaskList` with `DndContext` + `SortableContext`; `SortableItem` component with grip handle + `activationConstraint: { distance: 6 }`; reorder calls `taskStore.reorder` optimistically
- [x] **J5** `src/components/task-filters.tsx` — segmented control: All / Open / Done; state lifted to parent
- [x] **J6** Filter state lifted into `editor.tsx` (lift path — Track I already ships `statusFilter` as a prop); `<TaskFilters>` rendered in Card header above `<TaskList>`

### Week 3 — Integration checkpoint
- [x] `pnpm typecheck` green
- [x] `pnpm build` green
- [x] Two scoped commits landed: `feat(tasks): store + sortable list, row, add-input with keyboard nav`, `feat(tasks): due-date / priority pickers, filters, editor integration`

## Week 4 — Session Engine

### Track K — Session start flow + active session view
- [x] **K1** `src/routes/session.tsx` (replace stub) — page-level orchestrator that reads `contextId` from search params, subscribes to `useSessionStore`, and renders the correct sub-view for each phase (`idle`/`starting`/`active`/`ending`/`recovered`)
- [x] **K2** `src/components/session/pre-session-panel.tsx` — shown when `phase === 'idle'` or just before start; lists the context's pending tasks with checkboxes to pick which ones to tackle this session, duration adjuster (default from context), and a big "Start session" button
- [x] **K3** `src/components/session/active-session-view.tsx` — shown when `phase === 'active'`; full-bleed layout with:
  - Large timer (MM:SS countdown) at top center; driven by a `useSessionTimer(startedAt, plannedDurationMinutes)` hook (K4)
  - Selected tasks list with checkboxes (re-uses `TaskRow`); checking a task calls `taskStore.setStatus(id, 'done')`
  - Music mini-controls at bottom (play/pause, volume slider) wired to `src/lib/os/audio.ts`
  - Prominent "End session" button (calls `sessionStore.end('interrupted')`; if timer hit 0, treat as `'completed'` — K3 logic)
- [x] **K4** `src/lib/hooks/use-session-timer.ts` — `{ remainingSeconds, elapsedSeconds, isOvertime, progress01 }`; ticks every 1s via `setInterval`; cleans up on unmount
- [x] **K5** On timer reaching 0, emit a local event / dispatch state to Track L's break prompt (shared ephemeral state via `session-store` or a small `useBreakPrompt` hook)
- [x] **K6** Gate `Start session` button in K2 if the context has no wallpaper/music/shortcut set (warn but allow start — "minimal mode")

### Track L — End-session log + break prompt + history
- [x] **L1** `src/components/session/end-session-dialog.tsx` — modal shown when user clicks End session OR timer reaches 0; fields: endReason radio (completed/interrupted/abandoned — auto-select based on how it was triggered), optional notes textarea; Save calls `sessionStore.end(reason, notes)`
- [x] **L2** `src/components/session/break-prompt.tsx` — shown when the active timer hits 0; two buttons: "Take a 5-minute break" (end current session as `completed`, start a Break context session for 5m) and "End session" (opens L1)
- [x] **L3** `src/routes/contexts/history.tsx` — per-context session history route; lists recent sessions (via `sessionsRepo.recentForContext`) in a table with started-at, duration, end reason, notes preview
- [x] **L4** Add `/contexts/$id/history` route to `src/router.tsx`; link from the context card menu in `/contexts`
- [x] **L5** `src/lib/stores/history-store.ts` — Zustand store for recent sessions per context; lazy load on the history route; invalidate after `sessionStore.end`

### Week 4 — Integration checkpoint
- [x] `pnpm typecheck` + `pnpm build` green
- [x] Two scoped commits: `feat(session): pre-session panel + active view + timer hook`, `feat(session): end dialog, break prompt, history route + page wiring`

## Week 5 — OS Bridge wire-up (code already implemented in Week 1 Track E)

Code tasks — verified via `src/lib/stores/session-store.ts`:
- [x] Full snapshot-before-mutate flow in session-store `start()` — captures wallpapers, writes snapshot, then applies mutations, then persists final snapshot with session id + apps quit
- [x] Launch-time reconciler — `checkForRecoveryOnLaunch()` dispatches `snapshot.reconcileSnapshot()` and flips phase to `'recovered'` when a stale session-file is found
- [x] Focus shortcut runs on session start (`shortcuts.runShortcut(context.shortcutName)`); revert shortcut runs on end (`shortcuts.runShortcut(snap.revertShortcutName)` when `focusToggledByUs`)
- [x] `appsToQuit` fires on start when JSON array is non-empty; silent no-op per bundle id when not running (Rust-side osascript swallows the error)
- [x] `end()` restores wallpaper, stops audio, runs revert shortcut, clears snapshot

Manual tests (user-gated — must run on the user's Mac):
- [ ] Wallpaper change visible across multiple screens + Spaces
- [ ] Audio survives `cmd-h` / window hide (the `rodio`-on-dedicated-thread test that would fail with HTML5 audio)
- [ ] `kill -9` on the app mid-session → relaunch → reconciler restores the original wallpaper and surfaces the "recovered" banner
- [ ] Focus indicator appears in the macOS menubar when a context with a Shortcut runs, disappears at end

## Week 6 — Polish & Ship

### Track M — Onboarding + notifications + accent + README
- [ ] **M1** `src/routes/onboarding.tsx` — first-run experience: Welcome → Permissions explainer → Shortcut template install via `shell.open('-a Shortcuts <bundled.shortcut>')` (use `@tauri-apps/plugin-shell`) → Done
- [ ] **M2** `src/lib/stores/settings-store.ts` — add `onboardingCompleted: boolean` field (persisted via plugin-store); default `false`; `markOnboardingComplete()`
- [ ] **M3** Gate onboarding in `src/router.tsx`: if `!onboardingCompleted`, force-navigate to `/onboarding` on mount
- [ ] **M4** `src/lib/os/notifications.ts` — thin wrapper over `@tauri-apps/plugin-notification` (`isPermissionGranted`, `requestPermission`, `sendNotification(title, body)`)
- [ ] **M5** Hook notifications in `session-store`: session start → "Focus session started", session end → "Session complete — {name}" with duration (auto-triggered only; skip when user abandons)
- [ ] **M6** Accent color from active context: set a CSS var `--accent-ctx` on `<html>` when `phase === 'active'`, cleared on idle; tint the timer progress bar + a few accents
- [ ] **M7** `README.md` draft: what Focrel is, quick start (dev), architecture map, build/distribution notes, status (MVP shipping)

### Track N — Global hotkey + autostart + settings UI + theme override
- [ ] **N1** `src/lib/os/hotkey.ts` — wrappers over `@tauri-apps/plugin-global-shortcut` (`register`, `unregister`, `isRegistered`)
- [ ] **N2** On app boot (after startup hooks): register `settings.globalHotkey` (default `"CmdOrControl+Shift+F"`) → brings window to front, navigates `/`
- [ ] **N3** `src/lib/os/autostart.ts` — wrappers over `@tauri-apps/plugin-autostart` (`enable`, `disable`, `isEnabled`); sync with `settings.autostart` on change
- [ ] **N4** `src/routes/settings.tsx` — replace stub with full form: Theme select (system/light/dark), Autostart toggle, Global Hotkey input (captures key combo), onboarding replay button
- [ ] **N5** Theme override: `src/lib/theme.ts` — `applyTheme(mode: 'system'|'light'|'dark')`; call from settings-store subscriber; unmount the system-preference listener when non-system is chosen
- [ ] **N6** Hotkey input component that captures `keydown` and serializes to `"CmdOrControl+Shift+F"` format; validates against duplicate system shortcuts where feasible (best-effort — Tauri surfaces the error on register)

### Week 6 — Integration checkpoint
- [ ] `pnpm typecheck` + `pnpm build` green
- [ ] Two scoped commits: `feat(onboarding): first-run flow + notifications + accent + README`, `feat(settings): global hotkey + autostart + theme override + settings UI`

### Week 6 — User-gated (deferred; needs hardware/Apple Dev account/source art)
- [ ] Menu-bar mode (tray icon + mini popover) — post-MVP polish
- [ ] Code-sign (Developer ID) + notarize + staple
- [ ] DMG build with Sparkle feed (auto-update)
- [ ] Real icons in `src-tauri/icons/` (replace placeholders)
- [ ] Screenshots in README

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
2026-04-21 — F — pickers complete: src/components/pickers/{wallpaper,music,shortcut,app,color,icon}-picker.tsx
2026-04-21 — G — context editor form complete: src/routes/contexts/editor.tsx wired to all six pickers; JSON serialization boundary for appsToQuit/blockedSites; cmd+enter save, esc cancel; archive button in edit mode.
2026-04-21 — H — contexts list + home grid complete: src/routes/contexts/index.tsx, src/routes/home.tsx, src/components/context-card.tsx
2026-04-21 — CTO — Week 2 reconcile: replaced H's inline renderIcon fallback in context-card.tsx with the import from pickers/icon-picker.tsx (which F shipped). Typecheck + build green. Committed as 2 scopes: feat(pickers), feat(contexts).
2026-04-21 — G — context editor form complete: src/routes/contexts/editor.tsx
2026-04-21 — I — task list + row + add + store + keyboard: src/lib/stores/task-store.ts, src/components/task-{list,row,add-input}.tsx, src/routes/contexts/editor.tsx (Tasks section).
2026-04-21 — J — dnd-kit + due-date/priority pickers + task filters: package.json, pnpm-lock.yaml, src/components/pickers/{due-date,priority}-picker.tsx, src/components/task-filters.tsx, src/components/task-list.tsx (DnD wrap), src/routes/contexts/editor.tsx (filter lift).
2026-04-21 — CTO — Week 3 close-out: typecheck + build green; 2 scoped commits (feat(tasks) core + feat(tasks) pickers/filters/editor integration). 14 commits on main.
2026-04-21 — K — session page + pre-session + active view + timer hook: src/routes/session.tsx, src/components/session/{pre-session-panel,active-session-view}.tsx, src/lib/hooks/use-session-timer.ts. End flow stubbed with direct sessionStore.end call pending Track L integration.
2026-04-21 — L — end-session dialog + break prompt + history route + history store: src/components/session/{end-session-dialog,break-prompt}.tsx, src/routes/contexts/history.tsx, src/router.tsx (+history route), src/routes/contexts/index.tsx (+History menu item), src/lib/stores/history-store.ts.
2026-04-21 — CTO — Week 4 close-out: replaced K's handleEndRequest TODO with real dispatch — auto-end opens BreakPrompt (Take break / Extend 10m / End), manual end opens EndSessionDialog; Take-break ends session and starts seeded Break context for 5m. Verified Week 5 wire-up is already implemented in session-store (plan §3.5 pattern). 2 scoped commits (feat(session) K + feat(session) L+integration); 17 total on main.
2026-04-21 — K — session page + pre-session + active view + timer hook: src/routes/session.tsx, src/components/session/{pre-session-panel,active-session-view}.tsx, src/lib/hooks/use-session-timer.ts. End flow stubbed with direct sessionStore.end call pending Track L integration.
2026-04-21 — L — end-session dialog + break prompt + history route + history store: src/components/session/{end-session-dialog,break-prompt}.tsx, src/routes/contexts/history.tsx, src/router.tsx (+history route), src/routes/contexts/index.tsx (+History menu item), src/lib/stores/history-store.ts.
