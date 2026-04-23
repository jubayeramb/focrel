// Fetches the latest Focrel desktop release from our R2-hosted update
// manifest at build time. The web app is a Next.js static export, so every
// `fetch` here runs during `next build` and the result is baked into the
// HTML shipped to Cloudflare Pages — no runtime API calls.
//
// We deliberately hit the same `latest.json` the Tauri updater reads, not
// the GitHub Releases API. Two reasons:
//   1. The GitHub repo is private; unauthenticated fetches 404.
//   2. Keeping the updater and /download on the same manifest means what
//      users see as "Latest release" on the site is exactly what installed
//      apps will offer as an update. One source of truth.

export const UPDATES_BASE_URL = "https://updates.focrel.com";

export type ReleaseInfo = {
  version: string; // e.g. "0.1.1" (no tag prefix)
  tagName: string; // e.g. "desktop-v0.1.1"
  publishedAt: string; // ISO
  dmgUrl: string | null;
  dmgSizeBytes: number | null;
  notes: string;
};

// Shape emitted by `.github/workflows/release-desktop.yml` → `latest.json`.
// Tauri's updater spec covers `version`, `notes`, `pub_date`, `platforms`;
// we tack on `dmg` + `tag_name` for our own /download page and the updater
// ignores those extras.
type LatestManifest = {
  version: string;
  tag_name?: string;
  pub_date: string;
  notes?: string;
  platforms?: Record<string, { signature: string; url: string }>;
  dmg?: { url: string; size_bytes: number };
};

export async function fetchLatestDesktopRelease(): Promise<ReleaseInfo | null> {
  try {
    const res = await fetch(`${UPDATES_BASE_URL}/latest.json`, {
      headers: { Accept: "application/json" },
      // Static export reads this at build time. A 5-minute revalidate
      // lines up with the short Cache-Control we set on the R2 object
      // (`public, max-age=60`) — `next dev` reuses the response between
      // hot reloads without re-fetching each time.
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.warn(
        `[focrel/web] ${UPDATES_BASE_URL}/latest.json returned ${res.status}; rendering PendingCard`,
      );
      return null;
    }
    const manifest = (await res.json()) as LatestManifest;
    if (!manifest.version || !manifest.tag_name) return null;

    return {
      version: manifest.version,
      tagName: manifest.tag_name,
      publishedAt: manifest.pub_date,
      dmgUrl: manifest.dmg?.url ?? null,
      dmgSizeBytes: manifest.dmg?.size_bytes ?? null,
      notes: manifest.notes ?? "",
    };
  } catch (err) {
    // Swallow: we'd rather ship a "Release pending" placeholder than fail
    // the whole static build when the bucket is unreachable.
    console.warn("[focrel/web] failed to load latest.json:", err);
    return null;
  }
}

export function formatMB(bytes: number | null): string {
  if (!bytes) return "";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
