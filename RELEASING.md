# Releasing Focrel

How to ship a new version of the macOS desktop app. Beta-posture notes are called out inline so you can swap them for the v1.0 signed path later.

---

## One-time setup

### 1. Generate the update-signing keypair

Run once, ever. Back up the private key somewhere safe (password manager, encrypted drive) — losing it means existing installs can no longer verify update manifests and will reject every subsequent release.

```bash
mkdir -p ~/.focrel
pnpm --filter @focrel/desktop tauri signer generate \
  --ci -p "" -w ~/.focrel/update-signing.key
```

This produces:

- `~/.focrel/update-signing.key` — private key. **Never commit.**
- `~/.focrel/update-signing.key.pub` — public key. Already pasted into `apps/desktop/src-tauri/tauri.conf.json` → `plugins.updater.pubkey`.

### 2. Add GitHub secrets

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Name                                 | Value                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `TAURI_SIGNING_PRIVATE_KEY`          | Entire contents of `~/.focrel/update-signing.key` (including BEGIN/END). |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Empty string (we generated the key with no password).                    |

If you rotate the key later, you must ship an update to existing users containing the new pubkey *before* publishing any release signed with the new private key — otherwise older clients will reject the new signature and be stranded.

---

## Cutting a release

From a clean `main`:

```bash
# Choose one:
pnpm release:patch   # 0.1.0 → 0.1.1
pnpm release:minor   # 0.1.0 → 0.2.0
pnpm release:major   # 0.1.0 → 1.0.0

# Then push — this is the CI trigger:
git push && git push --tags
```

The release script (`scripts/release.mjs`):

1. Refuses to run on a dirty tree.
2. Bumps the version in every version-carrying file (root + per-app `package.json`, `packages/brand/package.json`, `apps/desktop/src-tauri/tauri.conf.json`, `apps/desktop/src-tauri/Cargo.toml`, lockfile).
3. Commits as `chore(release): desktop-v<version>`.
4. Tags `desktop-v<version>`.
5. **Does not push.** You push manually so the CI trigger is never accidental.

Pushing the tag fires `.github/workflows/release-desktop.yml`, which:

1. Builds a universal (arm64 + Intel) macOS bundle via `tauri build --target universal-apple-darwin`.
2. Signs the `.app.tar.gz` with your private key.
3. Generates `latest.json` (the updater manifest).
4. Publishes a GitHub Release with the DMG, tar.gz, sig, and manifest.
5. Fires a `workflow_dispatch` at `deploy-web.yml` so focrel.com rebuilds and the `/download` page picks up the new version.

End-to-end takes ~10 minutes on the `macos-14` runner the first time, faster once `Swatinem/rust-cache` has a hit.

---

## Verification checklist

After the workflow goes green:

- [ ] GitHub Release page for the tag shows four files: `Focrel_<ver>_universal.dmg`, `Focrel.app.tar.gz`, `Focrel.app.tar.gz.sig`, `latest.json`.
- [ ] `https://focrel.com/download` shows the new version (Cloudflare Pages redeploy may lag by a minute or two).
- [ ] Download the DMG on a clean Mac, right-click → Open, verify the app launches and notifications fire.
- [ ] On an existing older install, open Settings → Updates → **Check now**. Expect "Update available · v<new>", click **Install & restart**, and confirm the app relaunches at the new version with all contexts/sessions intact.

---

## Beta posture (current)

- The DMG is **unsigned**. Users must right-click → Open once on first launch. This is documented on `/download`.
- **Mac App Store is off the table** as long as `tauri.conf.json.app.macOSPrivateApi` is `true` (the wallpaper-per-space APIs rely on it). If we ever drop that capability we could revisit MAS.
- **Homebrew Cask is deferred.** Unsigned casks install but trip quarantine warnings — not worth shipping until Apple Developer enrollment lands.
- **Windows/Linux/iOS/Android** — each gets its own workflow + bundle strategy. Windows is the next logical add.

---

## Upgrading to signed + notarized (v1.0)

When the Apple Developer Program enrollment lands:

1. Store the Developer ID Application cert as `APPLE_CERTIFICATE` (base64-encoded p12) + `APPLE_CERTIFICATE_PASSWORD`.
2. Add `APPLE_SIGNING_IDENTITY` (e.g. `Developer ID Application: Your Name (TEAMID)`).
3. Add `APPLE_ID`, `APPLE_PASSWORD` (app-specific password from appleid.apple.com), `APPLE_TEAM_ID`.
4. In `release-desktop.yml`, drop those secrets into the `Build universal macOS DMG` step's `env:` block — `tauri build` detects them and handles signing + notarization automatically.
5. Flip `bundle.macOS.signingIdentity` in `tauri.conf.json` from `null` to `"-"` (Tauri reads from the env var) or to the actual identity string.
6. Remove the unsigned-install guide from `/download`; replace with a "Just open the DMG" section.
7. Submit Focrel to Homebrew Cask — now that it's signed, the PR to `homebrew-cask` is straightforward.
