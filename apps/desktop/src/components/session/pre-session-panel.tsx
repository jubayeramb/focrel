import * as React from "react";
import { AlertTriangle, CheckCircle2, Minus, Music, Plus, X } from "lucide-react";
import { renderIcon } from "@/components/pickers/icon-picker";
import { TaskAddInput } from "@/components/task-add-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useContextStore } from "@/lib/stores/context-store";
import { useSessionStore } from "@/lib/stores/session-store";
import { useTaskStore } from "@/lib/stores/task-store";

type PreSessionPanelProps = {
  contextId: string;
  onStarted: () => void;
  onCancel: () => void;
};

type ReadinessItem = {
  label: string;
  configured: boolean;
  icon: React.ReactNode;
};

function ReadinessPill({ label, configured, icon }: ReadinessItem) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
        configured
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      <span className="[&_svg]:size-3.5">{icon}</span>
      <span className="font-medium">{label}</span>
      {configured && <CheckCircle2 className="size-3" />}
    </div>
  );
}

export function PreSessionPanel({ contextId, onStarted, onCancel }: PreSessionPanelProps) {
  const { contexts, getById, load } = useContextStore();
  const { loadByContext, tasksFor } = useTaskStore();
  const sessionStore = useSessionStore();

  const [loadAttempted, setLoadAttempted] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [duration, setDuration] = React.useState<number | null>(null);
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void loadByContext(contextId);
  }, [contextId, loadByContext]);

  React.useEffect(() => {
    if (contexts.length === 0 && !loadAttempted) {
      setLoadAttempted(true);
      void load();
    }
  }, [contexts.length, loadAttempted, load]);

  const context = getById(contextId);

  React.useEffect(() => {
    if (context && duration === null) {
      setDuration(context.defaultDurationMinutes);
    }
  }, [context, duration]);

  const tasks = tasksFor(contextId);
  const pendingTasks = tasks.filter((t) => t.status !== "done");

  React.useEffect(() => {
    if (pendingTasks.length > 0 && selected.size === 0) {
      setSelected(new Set(pendingTasks.map((t) => t.id)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTasks.length]);

  if (!context) {
    if (!loadAttempted || contexts.length > 0) {
      return (
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-muted-foreground">Context not found.</p>
        <Button variant="outline" onClick={onCancel}>
          Back
        </Button>
      </div>
    );
  }

  const effectiveDuration = duration ?? context.defaultDurationMinutes;

  function adjustDuration(delta: number) {
    setDuration(Math.min(480, Math.max(1, effectiveDuration + delta)));
  }

  function handleDurationInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) {
      setDuration(Math.min(480, Math.max(1, v)));
    }
  }

  function toggleTask(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleStart() {
    setError(null);
    setStarting(true);
    try {
      await sessionStore.start({
        contextId,
        plannedDurationMinutes: effectiveDuration,
        taskIds: Array.from(selected),
      });
      onStarted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session.");
      setStarting(false);
    }
  }

  const readiness: ReadinessItem[] = [
    {
      label: "Wallpaper",
      configured: Boolean(context.wallpaperPath),
      icon: <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>,
    },
    {
      label: "Music",
      configured: Boolean(context.musicPath),
      icon: <Music className="size-4" />,
    },
    {
      label: "macOS Shortcut",
      configured: Boolean(context.shortcutName),
      icon: <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 9H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/><path d="M19 9h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2z"/><path d="M9 3H5a2 2 0 0 0-2 2v4h8V5a2 2 0 0 0-2-2z"/><path d="M19 3h-4a2 2 0 0 0-2 2v4h8V5a2 2 0 0 0-2-2z"/></svg>,
    },
  ];

  const anyNotConfigured = readiness.some((r) => !r.configured);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-7 py-6">
      {/* Header with color-accented tile */}
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ backgroundColor: context.color }}
          aria-hidden
        >
          {renderIcon(context.icon, "size-5")}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold leading-tight tracking-tight text-foreground">
            {context.name}
          </h1>
          {context.description && (
            <p className="truncate text-sm text-muted-foreground">{context.description}</p>
          )}
        </div>
      </div>

      {/* Readiness pills — glanceable environment summary */}
      <div className="flex flex-wrap gap-2">
        {readiness.map((item) => (
          <ReadinessPill key={item.label} {...item} />
        ))}
        {anyNotConfigured && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="size-3" />
            <span className="font-medium">Minimal mode</span>
          </div>
        )}
      </div>

      {/* Tasks — primary focus of the panel */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tasks for this session
          </span>
          {pendingTasks.length > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {selected.size}/{pendingTasks.length} selected
            </span>
          )}
        </div>
        <TaskAddInput contextId={contextId} />
        {pendingTasks.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">No pending tasks.</p>
        ) : (
          <ul className="space-y-0.5">
            {pendingTasks.map((task) => {
              const isChecked = selected.has(task.id);
              return (
                <li key={task.id} className="group relative flex items-center">
                  <label
                    className={cn(
                      "flex flex-1 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors",
                      "hover:bg-accent/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTask(task.id)}
                      className="shrink-0 rounded accent-primary"
                    />
                    <span className="min-w-0 flex-1 truncate text-foreground">{task.title}</span>
                  </label>
                  <button
                    type="button"
                    aria-label={`Delete "${task.title}"`}
                    className={cn(
                      "mr-2 size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
                      "text-muted-foreground hover:text-destructive",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${task.title}"?`)) {
                        void useTaskStore.getState().remove(task.id);
                      }
                    }}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Duration — compact inline stepper */}
      <section className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Duration
          </span>
          <span className="text-xs text-muted-foreground">How long to run</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => adjustDuration(-5)}
            aria-label="Decrease by 5 minutes"
          >
            <Minus className="size-3.5" />
          </Button>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={effectiveDuration}
              onChange={handleDurationInput}
              min={1}
              max={480}
              className={cn(
                "w-12 rounded-md border-none bg-transparent p-0 text-center text-lg font-semibold tabular-nums",
                "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
              )}
            />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => adjustDuration(5)}
            aria-label="Increase by 5 minutes"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          className="h-11 flex-1 text-base"
          onClick={() => void handleStart()}
          disabled={starting}
        >
          {starting ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              Starting…
            </span>
          ) : (
            "Start session"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={onCancel}
          disabled={starting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
