#!/usr/bin/env node
// One-shot version-bump + tag for the desktop app.
//
// Walks every file that carries the product version (root + per-app
// package.json, tauri.conf.json, Cargo.toml) and writes the next
// patch/minor/major semver to all of them in one pass. Then stages those
// files, creates a `chore(release): desktop-v<version>` commit, and tags
// `desktop-v<version>`. Push (`git push && git push --tags`) is left to
// the caller — we don't want the CI trigger to fire accidentally just
// from running the script.
//
// Usage:
//   node scripts/release.mjs patch    # 0.1.0 -> 0.1.1
//   node scripts/release.mjs minor    # 0.1.0 -> 0.2.0
//   node scripts/release.mjs major    # 0.1.0 -> 1.0.0
//   node scripts/release.mjs 0.5.3    # explicit override

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);

// Files that carry `version` fields. `kind` tells the script how to parse
// + rewrite them — package.json uses a JSON field, tauri.conf.json uses a
// JSON field under a specific key, Cargo.toml uses a TOML-ish line match.
const FILES = [
  { path: "package.json", kind: "json" },
  { path: "apps/desktop/package.json", kind: "json" },
  { path: "apps/web/package.json", kind: "json" },
  { path: "packages/brand/package.json", kind: "json" },
  { path: "apps/desktop/src-tauri/tauri.conf.json", kind: "json" },
  { path: "apps/desktop/src-tauri/Cargo.toml", kind: "cargo" },
];

function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) throw new Error(`Not a valid semver: ${v}`);
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function formatSemver({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function bumpVersion(current, level) {
  if (/^\d+\.\d+\.\d+$/.test(level)) return level; // explicit override
  const s = parseSemver(current);
  if (level === "patch") return formatSemver({ ...s, patch: s.patch + 1 });
  if (level === "minor")
    return formatSemver({ major: s.major, minor: s.minor + 1, patch: 0 });
  if (level === "major")
    return formatSemver({ major: s.major + 1, minor: 0, patch: 0 });
  throw new Error(`Unknown bump level: ${level} (use patch | minor | major | x.y.z)`);
}

function readVersionFromRootPackage() {
  const raw = readFileSync(resolve(root, "package.json"), "utf8");
  const pkg = JSON.parse(raw);
  return pkg.version;
}

function rewriteJsonVersion(path, next) {
  const full = resolve(root, path);
  const text = readFileSync(full, "utf8");
  // Match the first top-level `"version": "..."` field — the same shape
  // works for package.json and tauri.conf.json.
  const updated = text.replace(
    /"version":\s*"[^"]+"/,
    `"version": "${next}"`,
  );
  if (updated === text) {
    throw new Error(`Didn't find a version field to replace in ${path}`);
  }
  writeFileSync(full, updated);
}

function rewriteCargoVersion(path, next) {
  const full = resolve(root, path);
  const text = readFileSync(full, "utf8");
  // Only the first `version = "..."` under [package] — Cargo.toml can
  // have other `version = "..."` lines on dependencies, which we must
  // NOT touch. The [package] block's version is always the first one.
  const updated = text.replace(
    /^version\s*=\s*"[^"]+"/m,
    `version = "${next}"`,
  );
  if (updated === text) {
    throw new Error(`Didn't find a package-version line in ${path}`);
  }
  writeFileSync(full, updated);
}

function run(cmd, args) {
  return execFileSync(cmd, args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();
}

function main() {
  const [levelArg] = process.argv.slice(2);
  if (!levelArg) {
    console.error(
      "Usage: node scripts/release.mjs <patch|minor|major|x.y.z>",
    );
    process.exit(1);
  }

  // Require a clean working tree — releasing over uncommitted edits would
  // bundle them into the release commit and make the tag harder to trust.
  const status = run("git", ["status", "--porcelain"]);
  if (status.length > 0) {
    console.error(
      "Working tree is dirty. Commit or stash changes before running release.",
    );
    console.error(status);
    process.exit(1);
  }

  const current = readVersionFromRootPackage();
  const next = bumpVersion(current, levelArg);
  console.log(`Bumping ${current} → ${next}`);

  for (const f of FILES) {
    if (f.kind === "json") rewriteJsonVersion(f.path, next);
    else if (f.kind === "cargo") rewriteCargoVersion(f.path, next);
    console.log(`  updated ${f.path}`);
  }

  // `cargo` rewrites Cargo.lock automatically on the next build, but we
  // want the lockfile bumped in this commit so the release artifact
  // matches. `cargo update -p focrel --precise <version>` keeps only
  // the focrel package's version in sync without touching unrelated
  // dependency versions.
  try {
    run("cargo", [
      "update",
      "--manifest-path",
      "apps/desktop/src-tauri/Cargo.toml",
      "-p",
      "focrel",
      "--precise",
      next,
    ]);
    console.log("  updated apps/desktop/src-tauri/Cargo.lock");
  } catch (err) {
    console.warn(
      "  cargo update failed — Cargo.lock may be stale, will regenerate on next build:",
      err.message,
    );
  }

  const tag = `desktop-v${next}`;
  run("git", [
    "add",
    "package.json",
    "apps/desktop/package.json",
    "apps/web/package.json",
    "packages/brand/package.json",
    "apps/desktop/src-tauri/tauri.conf.json",
    "apps/desktop/src-tauri/Cargo.toml",
    "apps/desktop/src-tauri/Cargo.lock",
  ]);
  run("git", ["commit", "-m", `chore(release): ${tag}`]);
  run("git", ["tag", tag]);

  console.log("");
  console.log(`Tagged ${tag}. To trigger CI:`);
  console.log("  git push && git push --tags");
  console.log("");
  console.log(
    "The release-desktop workflow will build + publish the GitHub Release.",
  );
}

main();
