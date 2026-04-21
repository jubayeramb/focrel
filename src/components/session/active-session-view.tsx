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
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { TaskRow } from "@/components/task-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { audio } from "@/lib/os";
import { useTaskStore } from "@/lib/stores/task-store";
import { useContextStore } from "@/lib/stores/context-store";
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
      onRequestEnd(true);
    }
  }, [remainingSeconds, onRequestEnd]);

  const tasks = useTaskStore((s) => s.tasksFor(contextId));
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

  const [isPlaying, setIsPlaying] = React.useState(hasMusicPath);
  const [volume, setVolume] = React.useState(0.6);
  const [loopEnabled, setLoopEnabled] = React.useState(true);
  const [miniMode, setMiniMode] = React.useState(false);
  // Track whether the Rust sink is alive. After Stop the sink is dropped, so
  // Play needs a fresh decode; on Pause the sink is preserved and Resume
  // picks up where it left off — we shouldn't restart the track.
  const [sinkAlive, setSinkAlive] = React.useState(hasMusicPath);

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

  async function togglePlayPause() {
    if (isPlaying) {
      await audio.pause();
      setIsPlaying(false);
    } else if (musicPath !== null) {
      if (sinkAlive) {
        await audio.resume();
      } else {
        await audio.play(musicPath, loopEnabled);
        setSinkAlive(true);
      }
      setIsPlaying(true);
    }
  }

  async function toggleLoop() {
    const next = !loopEnabled;
    setLoopEnabled(next);
    // Loop state is baked into the rodio source at play time, so to apply a
    // toggle mid-track we DO have to restart — rodio can't flip loop on an
    // existing Sink. Only do this if currently playing to avoid surprising
    // the user by restarting paused music.
    if (isPlaying && musicPath !== null) {
      await audio.play(musicPath, next);
      setSinkAlive(true);
    }
  }

  async function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    await audio.setVolume(v);
  }

  async function handleStopAudio() {
    await audio.stop();
    setIsPlaying(false);
    setSinkAlive(false);
  }

  const timerDisplay = isOvertime
    ? `+${formatMmSs(elapsedSeconds - plannedDurationMinutes * 60)}`
    : formatMmSs(remainingSeconds);

  if (miniMode) {
    return (
      <div className="flex flex-col gap-3 h-full">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-3xl font-thin tabular-nums tracking-tight",
              isOvertime ? "text-amber-500" : "text-foreground",
            )}
          >
            {timerDisplay}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void toggleMiniMode()}
            aria-label="Exit mini mode"
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
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
        <div className="flex-1 overflow-y-auto app-scroll">
          {sessionTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No tasks.</p>
          ) : (
            <ul className="space-y-1">
              {sessionTasks.map((task) => (
                <li key={task.id}>
                  <TaskRow task={task} onDelete={() => {}} />
                </li>
              ))}
            </ul>
          )}
        </div>
        {hasMusicPath && (
          <div className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => void togglePlayPause()}
              aria-label={isPlaying ? "Pause music" : "Play music"}
            >
              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </Button>
            <Music className="size-3.5 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => void handleVolumeChange(e)}
              className="flex-1 accent-primary h-1 rounded-full cursor-pointer min-w-0"
              aria-label="Volume"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "size-7",
                loopEnabled ? "text-primary" : "text-muted-foreground",
              )}
              onClick={() => void toggleLoop()}
              aria-label={loopEnabled ? "Disable loop" : "Enable loop"}
            >
              <Repeat className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => void handleStopAudio()}
              aria-label="Stop music"
            >
              <Square className="size-3.5" />
            </Button>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => onRequestEnd(false)}
        >
          End session
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto py-4 pb-20">
      {/* Timer card */}
      <Card className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => void toggleMiniMode()}
          aria-label="Enter mini mode"
          title="Mini mode — compact always-on-top view"
          className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-foreground"
        >
          <Minimize2 className="size-3.5" />
        </Button>
        <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4">
          <span
            className={cn(
              "text-8xl font-thin tabular-nums tracking-tighter select-none",
              isOvertime ? "text-amber-500" : "text-foreground",
            )}
          >
            {timerDisplay}
          </span>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
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
            <p className="text-xs text-amber-500 font-medium">Session overtime — wrap it up!</p>
          )}
        </CardContent>
      </Card>

      {/* Tasks card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Tasks
            </CardTitle>
            {sessionTasks.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedCount} / {sessionTasks.length} done
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {sessionTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No tasks selected for this session.</p>
          ) : (
            <ul className="space-y-0.5">
              {sessionTasks.map((task) => (
                <li key={task.id}>
                  <TaskRow
                    task={task}
                    onDelete={() => {}}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Music controls card */}
      {hasMusicPath && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Music
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void togglePlayPause()}
                aria-label={isPlaying ? "Pause music" : "Play music"}
              >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
              </Button>
              <div className="flex-1 flex items-center gap-2">
                <Music className="size-4 text-muted-foreground shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => void handleVolumeChange(e)}
                  className="flex-1 accent-primary h-1.5 rounded-full cursor-pointer"
                  aria-label="Volume"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void toggleLoop()}
                aria-label={loopEnabled ? "Disable loop" : "Enable loop"}
                className={loopEnabled ? "text-primary" : "text-muted-foreground"}
              >
                <Repeat className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handleStopAudio()}
                aria-label="Stop music"
              >
                <Square className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
