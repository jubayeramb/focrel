export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <div className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-medium uppercase tracking-wider text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
          v0.1 · macOS beta
        </div>
        <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Switch contexts, switch realms.
        </h1>
        <p className="max-w-xl text-balance text-lg leading-relaxed text-black/70 dark:text-white/70">
          Focrel binds each focus context to its own wallpaper, music,
          to-do list, and macOS Focus mode — so one click puts you fully in
          Deep Work, Writing, or wherever you need to be.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <a
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition hover:opacity-90"
            href="#download"
          >
            Download for macOS
          </a>
          <a
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-6 text-sm font-medium transition hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
            href="#features"
          >
            See how it works
          </a>
        </div>
        <p className="text-xs text-black/50 dark:text-white/50">
          Free during beta · Windows, Linux, iOS, Android coming soon
        </p>
      </div>
    </main>
  );
}
