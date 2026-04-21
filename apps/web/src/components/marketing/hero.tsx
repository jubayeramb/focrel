import Link from "next/link";
import { Download, ArrowRight } from "lucide-react";
import { longDescription, tagline } from "@focrel/brand";
import { AppWindowMock } from "./app-window-mock";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_70%)]" />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center">
        <span className="mb-6 inline-flex items-center rounded-full border border-border bg-background/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground shadow-sm">
          v0.1 · macOS beta · free during beta
        </span>

        <h1 className="mx-auto max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl md:text-7xl">
          {tagline}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
          {longDescription}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            id="download"
            href="#download"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Download className="size-4" />
            Download for macOS
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-border px-6 text-sm font-medium text-foreground transition hover:bg-muted/60"
          >
            See how it works
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Apple Silicon · Intel · macOS 13+
        </p>

        <div className="mt-14 w-full max-w-5xl sm:mt-20">
          <AppWindowMock />
        </div>
      </div>
    </section>
  );
}
