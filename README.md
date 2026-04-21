# Focrel

Local-first macOS context-switching focus app — plus the marketing website that ships it.

Focus is a feeling. Focrel makes it a place. Each context — Deep Work, Break, Admin — binds its own wallpaper, music, to-do list, and macOS Focus mode. Switch the context, switch the realm.

## Repo layout
```
focrel/                   ← pnpm workspace root + turborepo orchestration
├── apps/
│   ├── desktop/          ← Tauri 2 app (macOS today; Windows/Linux/iOS/Android roadmapped)
│   └── web/              ← Next.js 16 marketing site + blog (→ focrel.com)
├── packages/
│   └── brand/            ← shared tokens, copy, logo SVGs — single source of truth
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Quick start (desktop)
Prereqs: macOS 13+, pnpm 10, Rust 1.77+, Xcode command-line tools.
```
pnpm install
pnpm desktop:dev          # starts Tauri dev (Vite at :1420 + Rust watch)
```

## Quick start (web)
```
pnpm install
pnpm web:dev              # Next.js dev at :3000
pnpm web:build            # static export → apps/web/out/
```

## Monorepo commands (from repo root)
| Command | What it does |
|---|---|
| `pnpm dev` | turbo dev across all packages |
| `pnpm build` | turbo build across all packages |
| `pnpm typecheck` | turbo typecheck across all packages |
| `pnpm desktop:dev` | tauri dev for apps/desktop |
| `pnpm desktop:build` | tauri build for apps/desktop |
| `pnpm web:dev` | next dev for apps/web |
| `pnpm web:build` | next build (static export) for apps/web |

## Desktop architecture (one screen)
- **Frontend:** React 18 + TS + Vite + Tailwind v4 + shadcn-style primitives. Routing via TanStack Router (memory history). State via Zustand. Data caching via TanStack Query.
- **Data:** SQLite through `tauri-plugin-sql`; Drizzle for schema types; hand-written SQL at runtime. Self-healing migrations (PRAGMA-probed ADD COLUMN).
- **OS bridge (Rust):** `wallpaper` crate for NSWorkspace (no TCC prompts), `rodio` on a dedicated thread for background audio (survives window hide), `shortcuts run` for macOS Focus mode, `osascript` for quit-apps.
- **Crash-safety:** every session writes `active-session.json` before mutating system state. On launch, the reconciler restores the original wallpaper and runs a user-configured revert Shortcut.

## Web architecture
- **Stack:** Next.js 16 App Router + Tailwind v4 + RSC-first (near-zero client JS). Metadata API, dynamic OG via `next/og`, sitemap + robots + JSON-LD `SoftwareApplication` schema.
- **Theming:** consumes `@focrel/brand` tokens — same HSL vars the desktop app uses, so marketing and product never drift.
- **Deploy target:** static export to Cloudflare Pages (see below).

## Deploying the web
The `apps/web` marketing site deploys to Cloudflare Pages via GitHub Actions:
- `.github/workflows/ci.yml` — typecheck + lint + build on every PR
- `.github/workflows/deploy-web-preview.yml` — unique preview URL per PR
- `.github/workflows/deploy-web.yml` — production deploy on push to `main` affecting `apps/web/` or `packages/brand/`

### One-time setup
1. Create the Cloudflare Pages project:
   ```
   pnpm dlx wrangler pages project create focrel-web --production-branch=main
   ```
2. Add two secrets to the GitHub repo (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN` — API token with scope `Account → Cloudflare Pages → Edit`
   - `CLOUDFLARE_ACCOUNT_ID` — 32-char hex from the Cloudflare dashboard
3. After the first successful deploy, bind the custom domain (`focrel.com`) in Cloudflare → Pages → `focrel-web` → Custom domains.

After setup, every merge to `main` touching web or brand auto-ships to production.

## Roadmap (in brief)
- **Now:** macOS beta (free), marketing site, blog, organic-SEO push
- **Next:** Windows + Linux builds
- **Then:** user accounts + device sync + iOS + Android
- **Later:** paid tier (MRR tracking), dashboard app at `app.focrel.com`

## License
TBD.
