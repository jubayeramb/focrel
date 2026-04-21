import { tagline, longDescription } from "@focrel/brand";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          v0.1 · macOS beta
        </div>
        <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          {tagline}
        </h1>
        <p className="max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
          {longDescription}
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <a
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            href="#download"
          >
            Download for macOS
          </a>
          <a
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition hover:bg-muted/60"
            href="#features"
          >
            See how it works
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Free during beta · Windows, Linux, iOS, Android coming soon
        </p>
      </div>
    </main>
  );
}
