import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Clock, Home, LayoutGrid, Play, Plus, Settings } from "lucide-react";
import logoUrl from "@focrel/brand/assets/logo.svg";
import { useContextStore } from "@/lib/stores/context-store";
import { useSessionStore } from "@/lib/stores/session-store";
import { useSessionTimer } from "@/lib/hooks/use-session-timer";
import { cn } from "@/lib/utils";

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ActiveSessionPill() {
  const navigate = useNavigate();
  const state = useSessionStore((s) => s.state);
  const getById = useContextStore((s) => s.getById);

  // Hooks must always run in the same order. Pull the timer fields with safe
  // defaults so we can early-return below without changing hook-call count.
  const isActive = state.phase === "active";
  const startedAt = isActive ? state.startedAt : 0;
  const plannedDurationMinutes = isActive ? state.plannedDurationMinutes : 0;
  const { remainingSeconds } = useSessionTimer(startedAt, plannedDurationMinutes);

  if (!isActive) return null;

  const context = getById(state.contextId);

  return (
    <button
      onClick={() => void navigate({ to: "/session", search: { contextId: state.contextId } })}
      className={cn(
        "mx-3 mb-2 flex items-center gap-2 rounded-lg border border-border",
        "bg-accent/30 px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50",
      )}
    >
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: context?.color ?? "#7c3aed" }}
      />
      <span className="min-w-0 flex-1 truncate font-medium">{context?.name ?? "Session"}</span>
      <span className="shrink-0 tabular-nums text-muted-foreground text-xs">
        {formatMmSs(remainingSeconds)}
      </span>
    </button>
  );
}

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  path: string;
};

function NavItem({ icon, label, path }: NavItemProps) {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const isActive = location.pathname === path;

  return (
    <button
      onClick={() => void navigate({ to: path })}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        // `bg-accent` is only 2% darker than `--sidebar` in light mode, which
        // made the active row invisible. A primary-tinted background works in
        // both modes and matches standard macOS sidebar conventions.
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground hover:bg-accent",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside
      className="fixed top-8 left-0 bottom-0 w-60 border-r border-border flex flex-col z-40"
      style={{ backgroundColor: "hsl(var(--sidebar))" }}
    >
      {/* Wordmark — real app logo + product name */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 select-none">
        <img src={logoUrl} alt="" aria-hidden className="size-6 rounded-md" />
        <span className="text-base font-semibold tracking-tight">Focrel</span>
      </div>

      {/* Active session pill */}
      <ActiveSessionPill />

      {/* Nav items */}
      <nav className="app-scroll flex-1 overflow-y-auto px-3 space-y-0.5">
        <NavItem icon={<Home className="size-4 shrink-0" />} label="Home" path="/" />
        <NavItem icon={<Play className="size-4 shrink-0" />} label="Sessions" path="/sessions" />
        <NavItem icon={<LayoutGrid className="size-4 shrink-0" />} label="Contexts" path="/contexts" />
        <NavItem icon={<Clock className="size-4 shrink-0" />} label="History" path="/history" />
        <NavItem icon={<Settings className="size-4 shrink-0" />} label="Settings" path="/settings" />
      </nav>

      {/* New context quick-action */}
      <div className="px-3 pb-4 pt-2 border-t border-border">
        <button
          onClick={() => void navigate({ to: "/contexts/new" })}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Plus className="size-4 shrink-0" />
          New context
        </button>
      </div>
    </aside>
  );
}
