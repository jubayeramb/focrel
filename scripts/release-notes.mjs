#!/usr/bin/env node
// Produces a user-facing changelog for a desktop-v<version> release.
//
// Runs in the release workflow AFTER the tag is pushed (so the tag itself is
// visible to git) but BEFORE softprops/action-gh-release creates the
// Release. The script:
//
//   1. Finds the previous `desktop-v*` tag (skips the current one).
//   2. Reads `git log <prev>..HEAD` for Conventional-Commit subjects.
//   3. Groups commits by type (feat, fix, perf, refactor, etc.) under
//      readable headings, scrubbing the type prefix and scope parens.
//   4. Writes the result to `RELEASE_NOTES.md` in the repo root.
//
// Why deterministic instead of LLM-summarized: the commit log is already
// the source of truth, an AI summary adds an API dependency and cost with
// no information the reader can't get from the grouped bullet list. When
// we want a nicer prose blurb later we can layer a Claude/Copilot call
// on top of this same output.
//
// Output file is consumed twice:
//   - softprops/action-gh-release reads it as the Release `body`.
//   - The latest.json generator splices its content into `notes` so the
//     in-app updater banner shows the same changelog.

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);

function run(cmd, args) {
  return execFileSync(cmd, args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();
}

// Tries to resolve the tag we're cutting (CI supplies GITHUB_REF_NAME; local
// invocations can pass `HEAD`). Falls back to whatever tag points at HEAD.
function currentTag() {
  const envTag = process.env.GITHUB_REF_NAME;
  if (envTag?.startsWith("desktop-v")) return envTag;
  try {
    return run("git", ["describe", "--tags", "--exact-match", "HEAD"]);
  } catch {
    return null;
  }
}

// Previous desktop-v* tag, walking back from the current one. Returns null
// when this is the first tag ever (then the changelog spans the whole
// project history, which is fine for the v0.1.0 release note).
function previousTag(current) {
  try {
    const anchor = current ? `${current}^` : "HEAD";
    return run("git", [
      "describe",
      "--tags",
      "--match",
      "desktop-v*",
      "--abbrev=0",
      anchor,
    ]);
  } catch {
    return null;
  }
}

// Title cases a section heading and pluralizes where it reads better.
const TYPE_TITLES = {
  feat: "New features",
  fix: "Fixes",
  perf: "Performance",
  refactor: "Under the hood",
  chore: "Maintenance",
  docs: "Documentation",
  ci: "Release pipeline",
  build: "Build",
  test: "Tests",
  style: "Style",
  revert: "Reverts",
};

// Order sections appear in — user-facing stuff first, plumbing last.
const TYPE_ORDER = [
  "feat",
  "fix",
  "perf",
  "refactor",
  "chore",
  "docs",
  "ci",
  "build",
  "test",
  "style",
  "revert",
];

// Some commit types are too noisy for end-users; collapse them into a single
// "Maintenance" bucket instead of calling out every chore/ci/build change.
const COLLAPSE_INTO_MAINTENANCE = new Set(["chore", "ci", "build", "style"]);

function parseCommit(line) {
  // Conventional Commits: `type(scope)?!: subject`. The optional ! flags
  // breaking changes — we ignore for now but can promote those later.
  const m = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?!?:\s*(?<subject>.+)$/i.exec(
    line,
  );
  if (!m?.groups) return { type: "other", scope: null, subject: line };
  return {
    type: m.groups.type.toLowerCase(),
    scope: m.groups.scope ?? null,
    subject: m.groups.subject.trim(),
  };
}

function firstSentence(s) {
  // Keep notes snappy — trim at the first sentence break or 120 chars.
  const clipped = s.split(/(?<=[.!?])\s/)[0] ?? s;
  return clipped.length > 120 ? `${clipped.slice(0, 117)}…` : clipped;
}

function main() {
  const tag = currentTag();
  const prev = previousTag(tag);
  const range = prev ? `${prev}..HEAD` : "HEAD";

  const raw = run("git", [
    "log",
    range,
    "--no-merges",
    "--pretty=format:%s",
  ]);
  const commits = raw.split("\n").filter(Boolean);

  const buckets = new Map();
  for (const line of commits) {
    const parsed = parseCommit(line);
    const bucket = COLLAPSE_INTO_MAINTENANCE.has(parsed.type)
      ? "chore"
      : parsed.type;
    if (!buckets.has(bucket)) buckets.set(bucket, []);
    buckets.get(bucket).push({
      scope: parsed.scope,
      subject: firstSentence(parsed.subject),
    });
  }

  const versionLabel = tag ? tag.replace(/^desktop-v/, "v") : "Unreleased";
  const lines = [];
  lines.push(`# ${versionLabel}`);
  if (prev) {
    lines.push(`Changes since ${prev.replace(/^desktop-v/, "v")}.`);
  } else {
    lines.push("Initial release.");
  }
  lines.push("");

  let rendered = 0;
  for (const type of TYPE_ORDER) {
    const entries = buckets.get(type);
    if (!entries || entries.length === 0) continue;
    const heading = TYPE_TITLES[type] ?? type;
    lines.push(`## ${heading}`);
    for (const { scope, subject } of entries) {
      const scopeBit = scope ? `**${scope}:** ` : "";
      lines.push(`- ${scopeBit}${subject}`);
    }
    lines.push("");
    rendered += entries.length;
  }

  // Catch-all for unrecognized types ("refactor-lite", "wip", typos, etc.).
  const other = buckets.get("other") ?? [];
  if (other.length > 0) {
    lines.push("## Other");
    for (const { subject } of other) lines.push(`- ${subject}`);
    lines.push("");
    rendered += other.length;
  }

  if (rendered === 0) {
    lines.push(
      "_No user-visible changes in this release (bumped tag only)._",
    );
    lines.push("");
  }

  const output = lines.join("\n");
  const outPath = resolve(root, "RELEASE_NOTES.md");
  writeFileSync(outPath, output, "utf8");

  console.log(`Wrote ${outPath}`);
  console.log("---");
  console.log(output);
}

main();
