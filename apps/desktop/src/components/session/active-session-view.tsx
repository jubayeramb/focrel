import * as React from "react";
import {
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  Repeat,
  Square,
} from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { TaskRow } from "@/components/task-row";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/os/notifications";
import { useTaskStore } from "@/lib/stores/task-store";
import { useContextStore } from "@/lib/stores/context-store";
import { useMusicStore } from "@/lib/stores/music-store";
import { useSessionTimer } from "@/lib/hooks/use-session-timer";

const FULL_SIZE = { width: 1100, height: 720 };
const MINI_SIZE = { width: 420, height: 480 };

type ActiveSessionViewProps = {
  sessionId: string;
  contextId: string;
  startedAt: number;
  plannedDurationMinutes: number;
  taskIds: string[];
  onRequestEnd: (autoTriggered: boolean) => void;
};

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ActiveSessionView({
  sessionId: _sessionId,
  contextId,
  startedAt,
  plannedDurationMinutes,
  taskIds,
  onRequestEnd,
}: ActiveSessionViewProps) {
  const { remainingSeconds, elapsedSeconds, isOvertime, progress01 } = useSessionTimer(
    startedAt,
    plannedDurationMinutes,
  );

  const autoEndFired = React.useRef(false);

  React.useEffect(() => {
    if (remainingSeconds === 0 && !autoEndFired.current) {
      autoEndFired.current = true;
      // Fire a system notification so the user catches the moment even if
      // they stepped away from the desk. Read the context directly from the
      // store to keep this effect dep-light.
      const ctx = useContextStore.getState().getById(contextId);
      const ctxName = ctx?.name ?? "Session";
      void notify(
        "Session time is over",
        `${ctxName} · ${plannedDurationMinutes}m planned`,
      ).catch(() => {});
      onRequestEnd(true);
    }
  }, [remainingSeconds, onRequestEnd, contextId, plannedDurationMinutes]);

  const tasks = useTaskStore((s) => s.tasksFor(contextId));
  const loadByContext = useTaskStore((s) => s.loadByContext);

  // Quick-start paths (tray, card Start button, Sessions launcher) skip the
  // pre-session panel entirely, so tasks for this context may never have
  // been loaded into the store. Load on mount; downstream selector picks up
  // the hydrated list as soon as it lands.
  React.useEffect(() => {
    void loadByContext(contextId);
  }, [contextId, loadByContext]);

  // When taskIds is empty (quick-start from tray / card Start button skips
  // the pre-session task picker), fall back to all open tasks for the
  // context so the running session still surfaces something to check off.
  const sessionTasks =
    taskIds.length > 0
      ? tasks.filter((t) => taskIds.includes(t.id))
      : tasks.filter((t) => t.status !== "done");
  const completedCount = sessionTasks.filter((t) => t.status === "done").length;

  const context = useContextStore((s) => s.getById(contextId));
  const musicPath = context?.musicPath ?? null;
  const hasMusicPath = musicPath !== null;

  // Music playback state is owned by useMusicStore so the session view and
  // the tray menu stay in sync — toggling from either surface flows through
  // the same actions and both re-render on the same state change.
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const volume = useMusicStore((s) => s.volume);
  const loopEnabled = useMusicStore((s) => s.loop);
  const toggleMusic = useMusicStore((s) => s.toggle);
  const stopMusic = useMusicStore((s) => s.stop);
  const setMusicLoop = useMusicStore((s) => s.setLoop);
  const setMusicVolume = useMusicStore((s) => s.setVolume);

  const [miniMode, setMiniMode] = React.useState(false);

  async function toggleMiniMode() {
    const win = getCurrentWebviewWindow();
    const target = miniMode ? FULL_SIZE : MINI_SIZE;
    try {
      await win.setSize(new LogicalSize(target.width, target.height));
      await win.setAlwaysOnTop(!miniMode);
      setMiniMode(!miniMode);
    } catch (err) {
      console.error("[focrel] mini-mode toggle failed:", err);
    }
  }

  React.useEffect(() => {
    // Restore full window if the component unmounts while in mini mode.
    return () => {
      if (!miniMode) return;
      const win = getCurrentWebviewWindow();
      void win.setSize(new LogicalSize(FULL_SIZE.width, FULL_SIZE.height));
      void win.setAlwaysOnTop(false);
    };
    // Intentionally empty deps: cleanup runs only on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    await setMusicVolume(v);
  }

  const timerDisplay = isOvertime
    ? `+${formatMmSs(elapsedSeconds - plannedDurationMinutes * 60)}`
    : formatMmSs(remainingSeconds);

  if (miniMode) {
    const miniColor = context?.color ?? "#7c3aed";
    return (
      <div className="flex h-full flex-col gap-3">
        {/* Header: context + controls */}
        <div className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: miniColor }}
            aria-hidden
          />
          <span className="flex-1 truncate text-xs font-medium text-foreground">
            {context?.name ?? "Session"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => void toggleMiniMode()}
            aria-label="Exit mini mode"
            title="Exit mini mode"
          >
            <Maximize2 className="size-3.5" />
          </Button>
          <button
            type="button"
            onClick={() => onRequestEnd(false)}
            className={cn(
              "rounded-md border border-destructive/40 px-2 py-1 text-[11px] font-medium",
              "text-destructive transition-colors",
              "hover:bg-destructive hover:text-destructive-foreground",
            )}
          >
            End
          </button>
        </div>

        {/* Timer + progress */}
        <div className="flex flex-col items-center gap-2 py-1">
          <span
            className={cn(
              "font-mono text-5xl font-light tabular-nums tracking-tighter select-none",
              isOvertime ? "text-amber-500" : "text-foreground",
            )}
          >
            {timerDisplay}
          </span>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                isOvertime ? "bg-amber-500" : "bg-primary",
              )}
              style={{
                width: `${progress01 * 100}%`,
                ...(!isOvertime && { backgroundColor: "var(--accent-ctx, hsl(var(--primary)))" }),
              }}
            />
          </div>
          {isOvertime && (
            <p className="text-[10px] font-medium text-amber-500">Overtime</p>
          )}
        </div>

        {/* Tasks (compact, scrollable) */}
        <div className="flex-1 overflow-y-auto app-scroll">
          {sessionTasks.length > 0 && (
            <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tasks · {completedCount}/{sessionTasks.length}
            </div>
          )}
          {sessionTasks.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">No tasks.</p>
          ) : (
            <ul className="space-y-0.5">
              {sessionTasks.map((task) => (
                <li key={task.id}>
                  <TaskRow task={task} onDelete={() => {}} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Music strip */}
        {hasMusicPath && (
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => void toggleMusic()}
              aria-label={isPlaying ? "Pause music" : "Play music"}
            >
              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </Button>
            <Music className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => void handleVolumeChange(e)}
              className="h-1 min-w-0 flex-1 cursor-pointer rounded-full accent-primary"
              aria-label="Volume"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("size-7", loopEnabled ? "text-primary" : "text-muted-foreground")}
              onClick={() => void setMusicLoop(!loopEnabled)}
              aria-label={loopEnabled ? "Disable loop" : "Enable loop"}
            >
              <Repeat className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => void stopMusic()}
              aria-label="Stop music"
            >
              <Square className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  const contextColor = context?.color ?? "#7c3aed";
  const wallpaperUrl = context?.wallpaperPath ? convertFileSrc(context.wallpaperPath) : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 py-6 pb-24">
      {/* Context header row — color dot + name + running pill + mini-mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: contextColor }}
            aria-hidden
          />
          <span className="text-sm font-medium text-foreground">
            {context?.name ?? "Session"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-medium text-background">
            <Play className="size-3 fill-current" />
            Running
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void toggleMiniMode()}
            aria-label="Enter mini mode"
            title="Mini mode — compact always-on-top view"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <Minimize2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Timer + progress */}
      <div className="flex flex-col items-center gap-3">
        <span
          className={cn(
            "font-mono text-7xl font-light tabular-nums tracking-tighter select-none",
            isOvertime ? "text-amber-500" : "text-foreground",
          )}
        >
          {timerDisplay}
        </span>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              isOvertime ? "bg-amber-500" : "bg-primary",
            )}
            style={{
              width: `${progress01 * 100}%`,
              ...(!isOvertime && { backgroundColor: "var(--accent-ctx, hsl(var(--primary)))" }),
            }}
          />
        </div>
        {isOvertime && (
          <p className="text-xs font-medium text-amber-500">Session overtime — wrap it up!</p>
        )}
      </div>

      {/* Wallpaper tile — real background when configured, gradient fallback otherwise */}
      <div
        className={cn(
          "relative h-28 overflow-hidden rounded-xl border border-border",
          !wallpaperUrl && "bg-gradient-to-br from-violet-500/80 via-indigo-600/70 to-slate-900",
        )}
        style={
          wallpaperUrl
            ? { backgroundImage: `url(${wallpaperUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.2),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/85">
            Wallpaper · {wallpaperUrl ? "active" : "not set"}
          </span>
        </div>
      </div>

      {/* Music strip — inline row, only when a track is configured */}
      {hasMusicPath && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => void toggleMusic()}
            aria-label={isPlaying ? "Pause music" : "Play music"}
          >
            {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </Button>
          <Music className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => void handleVolumeChange(e)}
            className="h-1 flex-1 cursor-pointer rounded-full accent-primary"
            aria-label="Volume"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-7", loopEnabled ? "text-primary" : "text-muted-foreground")}
            onClick={() => void setMusicLoop(!loopEnabled)}
            aria-label={loopEnabled ? "Disable loop" : "Enable loop"}
          >
            <Repeat className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => void stopMusic()}
            aria-label="Stop music"
          >
            <Square className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Tasks — compact, no card wrapper */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tasks
          </span>
          {sessionTasks.length > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {completedCount} / {sessionTasks.length}
            </span>
          )}
        </div>
        {sessionTasks.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">
            No tasks selected for this session.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {sessionTasks.map((task) => (
              <li key={task.id}>
                <TaskRow task={task} onDelete={() => {}} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* End session — fixed bottom-right */}
      <div className="fixed bottom-6 right-6">
        <Button
          type="button"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => onRequestEnd(false)}
        >
          End session
        </Button>
      </div>
    </div>
  );
}
