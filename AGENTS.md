# Focrel — agent guide

This is the source repo for **Focrel**, a context-switching focus app for macOS with a companion marketing site. One pnpm + Turborepo monorepo.

Read this before making changes so you don't trip over the conventions below.

---

## Layout

```
.
├── apps/
│   ├── desktop/                  # Tauri 2 macOS app (React 18 frontend, Rust backend)
│   │   ├── src/                  # React + TS frontend
│   │   │   ├── routes/           # TanStack Router pages (home, sessions, history, settings, onboarding, contexts)
│   │   │   ├── components/       # UI — sidebar, topbar, session views, pickers, task rows
│   │   │   ├── lib/
│   │   │   │   ├── stores/       # Zustand: session, context, task, settings, music, updater
│   │   │   │   ├── db/           # SQLite access: repos/, migrations/, schema.ts (Drizzle types only)
│   │   │   │   ├── os/           # Thin wrappers over the Rust `invoke` surface (audio, wallpaper, shortcuts, apps, notifications, snapshot)
│   │   │   │   ├── scheduler.ts  # Per-context scheduled-session watcher (localStorage-deduped)
│   │   │   │   ├── session-timeout-watcher.ts
│   │   │   │   ├── tray-bridge.ts
│   │   │   │   └── init.ts       # runStartupHooks — wires everything on boot
│   │   │   └── styles/           # globals.css (Tailwind v4 + brand tokens)
│   │   └── src-tauri/
│   │       ├── src/
│   │       │   ├── commands/     # Tauri commands: apps, audio, notify, shortcuts, tray_cmds, wallpaper
│   │       │   ├── session/      # Crash-recovery snapshot logic
│   │       │   ├── tray.rs       # Menubar tray integration
│   │       │   └── lib.rs        # Plugin registration + invoke_handler!
│   │       ├── capabilities/default.json
│   │       └── tauri.conf.json
│   └── web/                      # Next.js 16 marketing site (static export → Cloudflare Pages)
│       └── src/
│           ├── app/              # App Router: /, /download, layout.tsx, sitemap.ts, icon.svg, apple-icon.png
│           ├── components/marketing/   # Hero, features, how-it-works, FAQ, footer, navbar
│           └── lib/releases.ts   # Fetches focrel-releases public repo's GitHub API at build time
├── packages/
│   └── brand/                    # Shared tokens.css, tokens.ts, copy.ts, logo.svg
├── scripts/
│   ├── release.mjs               # Version-bump + tag + commit (pnpm release:patch/minor/major)
│   ├── release-notes.mjs         # Grouped changelog from Conventional Commits, emitted as RELEASE_NOTES.md
│   └── reset-user-data.sh        # Wipes all local user state for fresh-install testing
├── docs/
│   └── focrel-releases-README.md # Draft README for the public mirror repo
├── .github/workflows/            # ci.yml, deploy-web.yml, deploy-web-preview.yml, release-desktop.yml
├── RELEASING.md                  # How to cut a release (signing-key + mirror-repo setup)
├── PROGRESS.md                   # Cross-session source of truth (what changed, what's next)
└── README.md
```

---

## Tech stack

**Desktop (`apps/desktop`):**
- Tauri 2 with `macos-private-api`, plugins: sql (sqlite), store, shell, fs, dialog, notification, autostart, global-shortcut, updater, process
- React 18, TanStack Router, TanStack Query, Zustand stores
- Tailwind v4 + shadcn/ui primitives, Drizzle ORM (schema types only — raw SQL at runtime)
- SQLite via `tauri-plugin-sql` (sqlx-sqlite). Self-healing schema migrations in `lib/db/client.ts` via `CONTEXTS_EVOLUTIONS` spec applied every launch.

**Web (`apps/web`):**
- Next.js 16 app router, **static export** (`output: "export"`) → Cloudflare Pages
- Tailwind v4, Geist fonts, `@focrel/brand` for tokens + copy
- `fetch` runs at build time only; there is no server runtime

**Brand (`packages/brand`):**
- Single source of truth for tokens, strings, logo. Imported by both apps.

---

## Critical conventions

### Never touch git user config
Global identity is already set as `Jubayer Al Mamun <jubayeramb@gmail.com>`. **Never run `git config user.*`**, globally or per-repo, on fresh `git init`, or "just to be safe". If a commit appears to need a different identity, ask — don't reconfigure.

### Commit style
**Conventional Commits**, one commit per logical unit (no batching). Format:

```
type(scope): subject
```

Types used in this repo: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `ci`, `build`. Scopes are free-form (`desktop`, `web`, `release`, `scheduler`, `notify`, etc.).

**Never add `Co-Authored-By:` trailers** — the user opted out of co-authorship on every commit, even when the default template or tool guidance suggests otherwise.

### Conventional Commits drive the changelog
`scripts/release-notes.mjs` parses `type(scope): subject` from every commit since the previous `desktop-v*` tag and groups them under readable headings in `RELEASE_NOTES.md`. The release workflow feeds that file into both the GitHub Release body and `latest.json`'s `notes`, so the in-app Settings → Updates banner and the /download page show the same grouped changelog. **Sloppy commit subjects show up in user-facing release notes** — take them seriously.

### pnpm + lockfile
pnpm 10 with workspaces. Run `pnpm install` at root. Lockfile committed. Root `package.json` has a `pnpm.overrides` block pinning `@types/react` and `@types/react-dom` to 19.x — needed because pnpm's peer-dep resolution would otherwise split the tree (React 19 web + React 18 desktop) and break type resolution of `lucide-react` on CI. Don't remove the overrides.

### React 18 vs React 19
Desktop runs React 18 at runtime; web runs React 19. Both typecheck against `@types/react@19` thanks to the overrides. 19's types are backward-compatible with 18 runtimes in practice (additive changes), and web doesn't use any 19-only APIs.

### Tauri commands
Custom Rust commands live under `apps/desktop/src-tauri/src/commands/`. Each new command:

1. Add to the right module (or a new module in `commands/`).
2. `pub mod <name>;` in `commands/mod.rs`.
3. `use commands::<name>::<command>;` at the top of `lib.rs`.
4. Append to the `invoke_handler![…]` list.
5. Call from JS via `invoke<ReturnType>("<command_name>", { camelCaseArgs })` — Tauri auto-converts snake/camel.

### Self-healing schema
Desktop SQLite migrations are append-only via the `CONTEXTS_EVOLUTIONS` array in `lib/db/client.ts`. Every launch calls `ensureContextsColumns`, which PRAGMAs the live schema and adds any missing columns. Legacy `0001_init.sql` + `0002_add_schedule.sql` etc. still run for chronological bookkeeping but are NOT authoritative — the evolutions list is.

Also: `lib/db/repos/contexts.ts` uses an **explicit `SELECT_COLUMNS` constant** instead of `SELECT *`. sqlx-sqlite's prepared-statement cache panics ("index out of bounds") when a query prepared before an `ALTER TABLE ADD COLUMN` is re-executed; explicit names bind the prepare to the current physical schema. If you add a column, add it to `CONTEXTS_EVOLUTIONS`, `ContextRow`, `toContext`, `SELECT_COLUMNS`, the INSERT column list, the INSERT values list, and the UPDATE branch — in that order.

### Notifications
`apps/desktop/src/lib/os/notifications.ts` branches at runtime on `is_bundled_app` (Rust command):
- **Bundled build** (.dmg install, `tauri build` output) → Tauri notification plugin → clicks route to Focrel.
- **Dev build** (`tauri dev`) → osascript `display notification` → clicks route to Script Editor (dev-only annoyance).

Don't rip the branch out — in dev the plugin silently drops because `target/debug/Focrel` isn't a registered `.app` bundle.

### Theme
`apps/desktop/src/lib/theme.ts` applies the `dark` class on `<html>` before React mounts. Tailwind v4 uses `@custom-variant dark (&:is(.dark *))`. Tokens for light + dark both live in `packages/brand/src/tokens.css`.

Web has its own inline `themeInitScript` in `apps/web/src/app/layout.tsx` that runs pre-hydration for the same reason.

---

## Build & run

```bash
# Install
pnpm install

# Typecheck everything
pnpm typecheck

# Desktop
pnpm desktop:dev       # tauri dev
pnpm desktop:build     # tauri build (unsigned beta)

# Web
pnpm web:dev           # next dev
pnpm web:build         # next build → apps/web/out (static export)
```

Rust builds: Tauri's `generate_context!` macro validates `frontendDist` at compile time, so run `pnpm --filter @focrel/desktop build` before any `cargo check`.

---

## Release flow

1. `pnpm release:patch` (or `minor`/`major`) — bumps versions across all `package.json` + `tauri.conf.json` + `Cargo.toml` + `Cargo.lock`, commits `chore(release): desktop-v<ver>`, creates tag.
2. `git push && git push --tags` — push triggers `.github/workflows/release-desktop.yml`.
3. Workflow builds universal macOS bundle, generates `RELEASE_NOTES.md`, generates signed `latest.json`, publishes everything as a GitHub Release on the **public** mirror repo `jubayeramb/focrel-releases`, then fires `deploy-web.yml` so focrel.com rebuilds `/download`.

The source repo stays private; only the mirror is public. The Tauri updater (`apps/desktop/src-tauri/tauri.conf.json` → `plugins.updater.endpoints`) and the web's `/download` page both read from the mirror repo anonymously.

See `RELEASING.md` for the one-time signing-key + mirror-repo-PAT setup.

---

## Gotchas learned the hard way (don't redo these mistakes)

- **Onboarding `useEffect` cleanup closures** capture their deps at mount. Don't rely on them for "when this state is X" cleanup — use a ref or move the logic to a store.
- **Scheduler `firedToday` map** must persist to localStorage; in-memory only means every restart re-fires anything within the grace window.
- **GRACE_MINUTES** is tick-drift tolerance, not catch-up. 5 minutes is correct. A bigger window turned into "app launch → surprise session start".
- **lsappinfo** uses a block layout with `bundleID="..."` (no key-quotes). `lsappinfo list -all` emits a totally different flat format. Stick with `lsappinfo list` (no `-all`).
- **Tauri updater artefacts** (`.app.tar.gz` + `.sig`) are NOT produced by default — requires `bundle.createUpdaterArtifacts: true` in `tauri.conf.json`.
- **GitHub release assets on private repos** are 404 for anonymous clients. That's why releases are mirrored to a separate public repo.
- **Notifications from `osascript display notification`** click through to Script Editor because that's the calling process. Only use the Tauri plugin when we're inside a bundled `.app`.
- **JSX whitespace** between `{expression}` and an adjacent string literal collapses — use explicit `{" "}` to keep a space (cost us a "Focrelisn't" once).

---

## Where to look when

| Symptom | First file to read |
|---|---|
| Session doesn't start cleanly | `apps/desktop/src/lib/stores/session-store.ts` (`start()`) |
| Scheduler fires wrong / doesn't fire | `apps/desktop/src/lib/scheduler.ts` |
| DB panic about column counts | `apps/desktop/src/lib/db/repos/contexts.ts` (SELECT_COLUMNS) + `client.ts` (CONTEXTS_EVOLUTIONS) |
| Notification silently dropped | `apps/desktop/src/lib/os/notifications.ts` + the `is_bundled_app` branch |
| Update check fails in installed app | `tauri.conf.json` → `plugins.updater.endpoints`, then the public mirror repo |
| Web /download shows "Release pending" | `apps/web/src/lib/releases.ts` — inspect which repo it's fetching + that repo's visibility |
| Theme FOUC | `apps/desktop/src/lib/theme.ts` or `apps/web/src/app/layout.tsx` (themeInitScript) |

---

## PROGRESS.md

Cross-session source of truth for "what's actually done vs what's in flight". Update it when finishing a meaningful milestone — not for every commit, but for each distinct capability added.
