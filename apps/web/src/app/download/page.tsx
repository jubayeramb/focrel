import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, Github, ShieldAlert, Terminal } from "lucide-react";
import { productName } from "@focrel/brand";
import { Footer } from "@/components/marketing/footer";
import { Navbar } from "@/components/marketing/navbar";
import {
  fetchLatestDesktopRelease,
  formatMB,
  GH_RELEASES_URL,
} from "@/lib/releases";

export const metadata: Metadata = {
  title: `Download ${productName} for macOS`,
  description: `Install ${productName}, the context-switching focus app for macOS. Unsigned beta — right-click → Open on first launch.`,
  openGraph: {
    title: `Download ${productName}`,
    description: `Install ${productName} on macOS 13+. Unsigned beta build.`,
  },
};

export default async function DownloadPage() {
  const release = await fetchLatestDesktopRelease();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24">
          <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_70%)]" />

          <div className="mx-auto flex w-full max-w-3xl flex-col px-6">
            <Link
              href="/"
              className="mb-8 inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Link>

            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Download {productName}
            </h1>
            <p className="mt-4 max-w-xl text-balance text-base leading-relaxed text-muted-foreground">
              A local-first, context-switching focus app for macOS. Free during beta.
            </p>

            <div className="mt-10">
              {release && release.dmgUrl ? (
                <ReleaseCard release={release} />
              ) : (
                <PendingCard />
              )}
            </div>

            <UnsignedInstallGuide />

            <OtherPlatforms />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ReleaseCard({
  release,
}: {
  release: NonNullable<Awaited<ReturnType<typeof fetchLatestDesktopRelease>>>;
}) {
  const size = formatMB(release.dmgSizeBytes);
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Latest release
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-2 text-foreground">
            <span className="text-2xl font-semibold tracking-tight">v{release.version}</span>
            <span className="text-xs text-muted-foreground">
              {size ? `${size} · ` : ""}macOS 13+ · Apple Silicon & Intel
            </span>
          </div>
        </div>
        <a
          href={release.dmgUrl!}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Download className="size-4" />
          Download .dmg
        </a>
      </div>
      {release.notes && (
        <div className="mt-5 rounded-md border border-border bg-muted/20 px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            What&apos;s new
          </div>
          <div className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
            {release.notes}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <a
          href={`${GH_RELEASES_URL}/tag/${release.tagName}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <Github className="size-3.5" />
          View on GitHub
        </a>
        <span>Published {new Date(release.publishedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function PendingCard() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-8 text-center">
      <div className="text-sm font-medium text-foreground">Release pending</div>
      <p className="mt-2 text-sm text-muted-foreground">
        The first public DMG hasn&apos;t shipped yet — we&apos;re finalizing the
        release pipeline. Follow along on{" "}
        <a
          href={GH_RELEASES_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          GitHub Releases
        </a>{" "}
        or check back soon.
      </p>
    </div>
  );
}

function UnsignedInstallGuide() {
  return (
    <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            Unsigned beta — one-time install step
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {productName}
            {" "}isn&apos;t yet signed with an Apple Developer ID. On macOS 15 and
            later, Gatekeeper blocks unsigned apps outright — even the classic
            right-click → Open path no longer works. Code-signing lands in v1.0
            and this step goes away; until then, you need one of the two
            workarounds below. Only needed once.
          </p>

          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-foreground">
            <li>
              Download the{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.dmg</code>{" "}
              above and drag {productName} into your{" "}
              <span className="whitespace-nowrap">Applications</span> folder.
            </li>
            <li>
              <strong>Recommended — Terminal.app, one command:</strong>
              <div className="mt-2 rounded-md border border-border bg-background/70 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Terminal className="size-3" />
                  Paste and press return
                </div>
                <code className="mt-1 block font-mono text-xs text-foreground">
                  xattr -cr /Applications/Focrel.app
                </code>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Strips the quarantine flag macOS set when you downloaded the
                DMG. Double-click {productName} after running it and it opens
                normally.
              </p>
            </li>
            <li>
              <strong>Or — System Settings:</strong> try opening {productName}
              once (it&apos;ll be blocked), then go to{" "}
              <span className="font-medium">
                System Settings → Privacy &amp; Security
              </span>
              , scroll to the &ldquo;{productName} was blocked…&rdquo; message,
              and click <strong>Open Anyway</strong>. Confirm in the prompt
              that follows.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function OtherPlatforms() {
  return (
    <div className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Other platforms
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="font-medium text-foreground">Windows</div>
          <div className="text-xs">Coming soon</div>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="font-medium text-foreground">Linux</div>
          <div className="text-xs">Coming soon</div>
        </div>
      </div>
    </div>
  );
}
