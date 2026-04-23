// Fetches the latest Focrel desktop release from the public mirror repo at
// build time. The web app is a Next.js static export, so every `fetch` here
// runs during `next build` and the result is baked into the HTML shipped to
// Cloudflare Pages — no runtime API calls.
//
// Why fetch from the mirror repo instead of the private source repo: the
// source repo (`jubayeramb/focrel`) stays private, so its Releases API
// returns 404 to anonymous callers. The CI publishes each release to a
// separate public repo (`jubayeramb/focrel-releases`) whose sole purpose is
// to host binaries. Same asset set, anonymous-readable, zero token plumbing
// on this side.

const GH_OWNER = "jubayeramb";
const GH_REPO = "focrel-releases";

export const GH_RELEASES_URL = `https://github.com/${GH_OWNER}/${GH_REPO}/releases`;

export type ReleaseInfo = {
  version: string; // e.g. "0.1.1" (no tag prefix)
  tagName: string; // e.g. "desktop-v0.1.1"
  publishedAt: string; // ISO
  dmgUrl: string | null;
  dmgSizeBytes: number | null;
  notes: string;
};

type GhAsset = {
  name: string;
  size: number;
  browser_download_url: string;
};

type GhRelease = {
  tag_name: string;
  body: string | null;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
  assets: GhAsset[];
};

// Grabs the newest `desktop-v*` release from the mirror. We filter by tag
// prefix rather than using `/releases/latest` so that a future `web-v*` or
// `ios-v*` tag sharing the same repo doesn't silently replace the desktop
// download.
export async function fetchLatestDesktopRelease(): Promise<ReleaseInfo | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases?per_page=20`,
      {
        headers: { Accept: "application/vnd.github+json" },
        // 5-minute revalidate so `next dev` hot-reloads don't rate-limit
        // the API; `next build` fetches fresh every time regardless.
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) {
      console.warn(
        `[focrel/web] GitHub releases fetch returned ${res.status}; rendering PendingCard`,
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
      latest.assets.find((a) => a.name.toLowerCase().endsWith(".dmg")) ?? null;

    return {
      version,
      tagName: latest.tag_name,
      publishedAt: latest.published_at,
      dmgUrl: dmg?.browser_download_url ?? null,
      dmgSizeBytes: dmg?.size ?? null,
      notes: latest.body ?? "",
    };
  } catch (err) {
    // Swallow: rather ship a "Release pending" placeholder than fail the
    // whole static build when GitHub is flaky.
    console.warn("[focrel/web] failed to load latest release:", err);
    return null;
  }
}

export function formatMB(bytes: number | null): string {
  if (!bytes) return "";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
