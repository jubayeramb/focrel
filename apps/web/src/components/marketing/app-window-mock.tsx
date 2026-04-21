import { Circle, Home, List, Music, Play, Settings, Timer } from "lucide-react";
import logoUrl from "@focrel/brand/assets/logo.svg";
import { cn } from "@/lib/cn";

/**
 * Faux macOS window showing the Focrel UI. Div-based, fully responsive,
 * no runtime JS. The frame uses the brand tokens so dark mode flips cleanly.
 */
export function AppWindowMock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 dark:shadow-black/40",
        className,
      )}
      aria-hidden
    >
      {/* title bar */}
      <div className="flex h-9 items-center gap-2 border-b border-border/70 bg-muted/40 px-4">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-4 text-xs font-medium text-muted-foreground">Focrel</div>
      </div>

      <div className="grid grid-cols-[180px_1fr]">
        {/* sidebar */}
        <aside className="flex flex-col gap-1 border-r border-border/70 bg-muted/20 p-3">
          <div className="mb-3 flex items-center gap-2 px-2 text-xs font-semibold text-foreground">
            <img src={logoUrl.src} alt="" aria-hidden className="size-6 rounded-md" />
            Focrel
          </div>
          <NavRow icon={<Home className="size-4" />} label="Home" active />
          <NavRow icon={<List className="size-4" />} label="Contexts" />
          <NavRow icon={<Timer className="size-4" />} label="History" />
          <NavRow icon={<Settings className="size-4" />} label="Settings" />

          <div className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contexts
          </div>
          <ContextRow dotClass="bg-violet-500" label="Deep Work" active />
          <ContextRow dotClass="bg-emerald-500" label="Writing" />
          <ContextRow dotClass="bg-amber-500" label="Review" />
        </aside>

        {/* main */}
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-violet-500" />
                Deep Work
              </div>
              <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-foreground">
                28:42
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-medium text-background"
            >
              <Play className="size-3 fill-current" />
              Running
            </button>
          </div>

          <div className="relative h-24 overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/80 via-indigo-600/70 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
            <div className="absolute bottom-2 left-3 text-[10px] font-medium uppercase tracking-wider text-white/70">
              Wallpaper · nebula
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 text-foreground">
              <Music className="size-3.5 text-muted-foreground" />
              <span className="font-medium">Ambient mix</span>
              <span className="text-muted-foreground">track 2 / 5</span>
            </div>
            <div className="text-muted-foreground">Loop · on</div>
          </div>

          <div className="space-y-1.5">
            <TaskRow text="Ship landing page" done />
            <TaskRow text="Draft Q2 roadmap" />
            <TaskRow text="Review PR #128" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavRow({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
        active
          ? "bg-foreground/10 font-medium text-foreground"
          : "text-muted-foreground",
      )}
    >
      {icon}
      {label}
    </div>
  );
}

function ContextRow({
  dotClass,
  label,
  active,
}: {
  dotClass: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 text-xs",
        active ? "bg-foreground/10 font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      <span className={cn("size-2 rounded-full", dotClass)} />
      {label}
    </div>
  );
}

function TaskRow({ text, done }: { text: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Circle
        className={cn(
          "size-3.5",
          done ? "fill-foreground text-foreground" : "text-muted-foreground",
        )}
      />
      <span
        className={cn(
          done
            ? "text-muted-foreground line-through decoration-muted-foreground/60"
            : "text-foreground",
        )}
      >
        {text}
      </span>
    </div>
  );
}
