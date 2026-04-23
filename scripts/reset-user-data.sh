#!/usr/bin/env bash
#
# scripts/reset-user-data.sh
#
# Wipes every bit of Focrel state macOS keeps on disk for the current user,
# so the next launch looks like a brand-new install. Useful when beta-
# testing the first-run onboarding flow, or when handing the release build
# to another tester on your own machine.
#
# What this removes:
#   - ~/Library/Application Support/com.focrel.app/  (SQLite DB, snapshot,
#     tauri-plugin-store JSON, cached app icons)
#   - ~/Library/WebKit/com.focrel.app/               (WKWebView localStorage,
#     IndexedDB, session cookies)
#   - ~/Library/Caches/com.focrel.app/               (HTTP cache)
#   - ~/Library/Logs/com.focrel.app/                 (logs)
#   - ~/Library/Preferences/com.focrel.app.plist     (NSUserDefaults)
#   - ~/Library/LaunchAgents/com.focrel.app.plist    (autostart, if enabled)
#   - TCC grants for com.focrel.app                  (Notifications, etc.
#     re-prompt on next launch)
#
# What this preserves:
#   - /Applications/Focrel.app                       (the binary itself)
#   - Shortcuts in Shortcuts.app that Focrel only references by name
#   - Any wallpaper / music files on disk that Focrel stored paths to
#
# Usage:
#   scripts/reset-user-data.sh            # prompts for confirmation
#   scripts/reset-user-data.sh --force    # skips the prompt (scriptable)
#
# macOS-only. Bundle identifier is read from tauri.conf.json so we don't
# drift if it ever changes.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TAURI_CONF="$REPO_ROOT/apps/desktop/src-tauri/tauri.conf.json"

# Pull identifier straight from tauri.conf.json — the source of truth. Fall
# back to the hard-coded default if the file isn't where we expect (e.g.
# someone cp'd the script outside the repo).
if [[ -r "$TAURI_CONF" ]] && command -v node >/dev/null 2>&1; then
  BUNDLE_ID="$(node -e "console.log(require('$TAURI_CONF').identifier)")"
else
  BUNDLE_ID="com.focrel.app"
fi

if [[ -z "$BUNDLE_ID" || "$BUNDLE_ID" == "undefined" ]]; then
  echo "Error: could not resolve bundle identifier." >&2
  exit 1
fi

PATHS_TO_REMOVE=(
  "$HOME/Library/Application Support/$BUNDLE_ID"
  "$HOME/Library/WebKit/$BUNDLE_ID"
  "$HOME/Library/Caches/$BUNDLE_ID"
  "$HOME/Library/Logs/$BUNDLE_ID"
  "$HOME/Library/Preferences/$BUNDLE_ID.plist"
  "$HOME/Library/LaunchAgents/$BUNDLE_ID.plist"
)

FORCE=0
for arg in "$@"; do
  case "$arg" in
    -f|--force) FORCE=1 ;;
    -h|--help)
      sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown flag: $arg (try --help)" >&2
      exit 1
      ;;
  esac
done

echo "This will remove the following for bundle id '$BUNDLE_ID':"
for p in "${PATHS_TO_REMOVE[@]}"; do
  if [[ -e "$p" ]]; then
    echo "  - $p"
  else
    echo "  - $p  (not present, will skip)"
  fi
done
echo "  - TCC grants (Notifications, Accessibility, etc.) for $BUNDLE_ID"
echo ""

if [[ "$FORCE" -ne 1 ]]; then
  read -r -p "Proceed? [y/N] " reply
  case "$reply" in
    y|Y|yes|YES) ;;
    *)
      echo "Aborted."
      exit 1
      ;;
  esac
fi

# Kill any running instance so files aren't locked while we remove them.
# `killall` exits non-zero when nothing matches; that's fine for us.
killall Focrel 2>/dev/null || true

# Unload the launch agent before deleting its plist, otherwise launchd keeps
# a stale reference until the next logout.
if [[ -e "$HOME/Library/LaunchAgents/$BUNDLE_ID.plist" ]]; then
  launchctl unload "$HOME/Library/LaunchAgents/$BUNDLE_ID.plist" 2>/dev/null || true
fi

for p in "${PATHS_TO_REMOVE[@]}"; do
  if [[ -e "$p" ]]; then
    rm -rf "$p"
    echo "  removed $p"
  fi
done

# Reset privacy grants so the next launch re-asks (Notifications, etc.).
# tccutil returns non-zero when no grants exist for the bundle; suppress.
tccutil reset All "$BUNDLE_ID" >/dev/null 2>&1 || true
echo "  reset TCC grants for $BUNDLE_ID"

echo ""
echo "Done. Launch Focrel to hit the first-run onboarding flow."
