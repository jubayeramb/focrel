import * as React from "react";
import { AlertTriangle, CheckCircle2, Minus, Music, Plus, X } from "lucide-react";
import { renderIcon } from "@/components/pickers/icon-picker";
import { TaskAddInput } from "@/components/task-add-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function ReadinessRow({ label, configured, icon }: ReadinessItem) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="flex-1 text-sm text-foreground">{label}</span>
      {configured ? (
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="size-3.5" />
          Ready
        </span>
      ) : (
        <span className="text-xs font-medium text-muted-foreground">Not configured</span>
      )}
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
    <div className="flex flex-col gap-6 max-w-lg mx-auto py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="flex items-center justify-center w-10 h-10 rounded-xl text-white shrink-0"
          style={{ backgroundColor: context.color }}
        >
          {renderIcon(context.icon, "size-5")}
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground leading-tight">{context.name}</h1>
          {context.description && (
            <p className="text-sm text-muted-foreground truncate">{context.description}</p>
          )}
        </div>
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Tasks for this session
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <TaskAddInput contextId={contextId} />
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No pending tasks.</p>
          ) : (
            <ul className="space-y-1">
              {pendingTasks.map((task) => {
                const isChecked = selected.has(task.id);
                return (
                  <li key={task.id} className="group relative flex items-center">
                    <label
                      className={cn(
                        "flex flex-1 items-center gap-3 rounded-md px-2 py-1.5 text-sm cursor-pointer",
                        "hover:bg-accent/50 transition-colors",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTask(task.id)}
                        className="rounded accent-primary shrink-0"
                      />
                      <span className="flex-1 min-w-0 truncate text-foreground">{task.title}</span>
                    </label>
                    <button
                      type="button"
                      aria-label={`Delete "${task.title}"`}
                      className={cn(
                        "size-3.5 shrink-0 mr-2 opacity-0 group-hover:opacity-100 transition-opacity",
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
        </CardContent>
      </Card>

      {/* Duration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Duration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => adjustDuration(-5)}
              aria-label="Decrease by 5 minutes"
            >
              <Minus className="size-4" />
            </Button>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={effectiveDuration}
                onChange={handleDurationInput}
                min={1}
                max={480}
                className={cn(
                  "w-16 text-center text-lg font-semibold tabular-nums",
                  "rounded-md border border-input bg-transparent px-2 py-1",
                  "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                )}
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => adjustDuration(5)}
              aria-label="Increase by 5 minutes"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Readiness */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Environment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 divide-y divide-border">
          {readiness.map((item) => (
            <ReadinessRow key={item.label} {...item} />
          ))}
        </CardContent>
        {anyNotConfigured && (
          <div className="px-6 pb-4 flex items-start gap-2">
            <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              This context will run in minimal mode.
            </p>
          </div>
        )}
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          className="flex-1"
          onClick={() => void handleStart()}
          disabled={starting}
        >
          {starting ? (
            <span className="flex items-center gap-2">
              <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Starting…
            </span>
          ) : (
            "Start session"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={starting}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
