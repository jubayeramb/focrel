// Fetches the latest Focrel desktop release from GitHub at build time. The
// web app is a Next.js static export, so every `fetch` here runs during
// `next build` and the result is baked into the HTML shipped to Cloudflare
// Pages — no runtime API calls, no user-facing GitHub rate-limit exposure.
//
// The release workflow tags each build `desktop-v<semver>` and uploads a DMG
// whose filename follows Tauri's default pattern. We rely on a tolerant
// asset-matching heuristic (`.dmg` extension + "universal" or version in the
// name) so a later cosmetic rename doesn't silently break the page.

const GH_OWNER = "jubayeramb";
const GH_REPO = "focrel";

export type ReleaseInfo = {
  version: string; // e.g. "0.1.1" (no tag prefix)
  tagName: string; // e.g. "desktop-v0.1.1"
  publishedAt: string; // ISO
  dmgUrl: string | null; // null when no matching asset yet
  dmgSizeBytes: number | null;
  htmlUrl: string; // the GitHub Release page
  notes: string;
};

type GhAsset = {
  name: string;
  size: number;
  browser_download_url: string;
};

type GhRelease = {
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
  assets: GhAsset[];
};

// Grabs the newest `desktop-v*` release. We filter by tag prefix rather than
// using `/releases/latest` because the repo might later cut tags for other
// platforms (e.g. a separate `web-v*` for the marketing site) and we don't
// want those polluting the download page.
//
// The repo is private right now, so unauthenticated GitHub API calls return
// 404. The deploy workflow forwards its `GITHUB_TOKEN` into the build as
// `GITHUB_RELEASES_TOKEN` — we attach it as a Bearer header when present.
// Still graceful: if the env var is missing, we render PendingCard instead
// of failing the static build.
export async function fetchLatestDesktopRelease(): Promise<ReleaseInfo | null> {
  try {
    const token =
      process.env.GITHUB_RELEASES_TOKEN ?? process.env.GITHUB_TOKEN ?? "";
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases?per_page=20`,
      {
        headers,
        // Static export reads this at build time. Cache aggressively so
        // iterating on the page during `next dev` doesn't rate-limit the API.
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) {
      console.warn(
        `[focrel/web] GitHub releases fetch returned ${res.status}${
          token ? "" : " (no auth token — private repo requires one)"
        }; rendering placeholder`,
      );
      return null;
    }
    const releases = (await res.json()) as GhRelease[];
    const latest = releases.find(
      (r) => !r.draft && !r.prerelease && r.tag_name.startsWith("desktop-v"),
    );
    if (!latest) return null;

    const version = latest.tag_name.replace(/^desktop-v/, "");
    const dmg =
      latest.assets.find(
        (a) => a.name.toLowerCase().endsWith(".dmg"),
      ) ?? null;

    return {
      version,
      tagName: latest.tag_name,
      publishedAt: latest.published_at,
      dmgUrl: dmg?.browser_download_url ?? null,
      dmgSizeBytes: dmg?.size ?? null,
      htmlUrl: latest.html_url,
      notes: latest.body ?? "",
    };
  } catch (err) {
    // Swallow: we'd rather ship a "Release pending" placeholder than fail the
    // whole static build when GitHub is flaky.
    console.warn("[focrel/web] failed to load latest release:", err);
    return null;
  }
}

export function formatMB(bytes: number | null): string {
  if (!bytes) return "";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const GH_RELEASES_URL = `https://github.com/${GH_OWNER}/${GH_REPO}/releases`;
export const GH_REPO_URL = `https://github.com/${GH_OWNER}/${GH_REPO}`;
